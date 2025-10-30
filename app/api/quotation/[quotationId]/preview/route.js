

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { buildQuotationPayload } from "@/app/lib/buildQuotationPayload";

export const runtime = "nodejs";
const execFileAsync = promisify(execFile);

/* ---------- Detect LibreOffice ---------- */
function getLibreOfficePath() {
  const possiblePaths = [
    "/opt/libreoffice25.2/program/soffice", // ✅ your installed version
    "/usr/bin/soffice",
    "/usr/local/bin/soffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log("🧭 Using LibreOffice binary at:", p);
      return p;
    }
  }

  throw new Error("LibreOffice not found in any known location.");
}



/* ---------- Render DOCX ---------- */
async function renderDocxBuffer(templateBuffer, data) {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    doc.render(data);
    return doc.getZip().generate({ type: "nodebuffer" });
  } catch (err) {
    console.error("❌ DOCX render error details:", err.properties || err);
    throw err;
  }
}

/* ---------- Normalize DOCX XML ---------- */
async function normalizeDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const files = Object.keys(zip.files).filter((f) =>
    f.match(/^word\/(document|header\d*|footer\d*)\.xml$/)
  );

  for (const f of files) {
    let xml = await zip.file(f).async("string");

    // ✅ 1. Allow table rows to split (fixes page push)
    xml = xml
      .replace(/<w:cantSplit[^>]*>/g, "")
      .replace(/<w:tr(?![^>]*w:cantSplit)/g, '<w:tr w:cantSplit="false"')
      .replace(/<w:trHeight[^>]*>/g, '<w:trHeight w:hRule="auto"/>');

    // ✅ 2. Remove floating & wrapping table positioning
    xml = xml.replace(/<w:tblpPr[\s\S]*?<\/w:tblpPr>/g, "");

    // ✅ 3. Normalize table look & overlap behavior
    xml = xml
      .replace(/<w:tblLook [^>]*\/>/g, '<w:tblLook w:noHBand="0" w:noVBand="0"/>')
      .replace(/<\/w:tblPr>/g, '<w:tblOverlap w:val="never"/></w:tblPr>');

    // ✅ 4. Remove “keep-with-next” *only when directly before tables*
    xml = xml.replace(
      /(<w:p[^>]*>[\s\S]*?<w:keepNext\/>[\s\S]*?<\/w:p>)(\s*<w:tbl)/g,
      (match, para, tbl) => para.replace(/<w:keepNext\/>/g, "") + tbl
    );

    // ✅ 5. Also remove “keepLines” to prevent grouping with next block
    xml = xml.replace(/<w:keepLines\/>/g, "");

    // ✅ 6. Remove truly empty paragraphs (avoid extra white space)
    xml = xml.replace(/<w:p(?: [^>]*)?>\s*(?:<w:pPr>[\s\S]*?<\/w:pPr>)?\s*<\/w:p>/g, "");

    // ✅ 7. Prevent extra margin between title and table (clean up multiple <w:p> between them)
    xml = xml.replace(/(<w:p[^>]*>[\s\S]*?<\/w:p>)(\s*<w:p>\s*<\/w:p>)+(\s*<w:tbl)/g, "$1$3");

    zip.file(f, xml);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}



/* ---------- DOCX → PDF Conversion (stable headless LibreOffice 25.2) ---------- */
async function docxToPdfBytes(payload) {
  const isUSD = payload?.Currency === "USD";
  const num = (v) => Number(String(v || "0").replace(/[^\d.-]/g, "")) || 0;

  const discountPer =
    num(payload?.discount_per) ||
    num(payload?.DiscountPer) ||
    num(payload?.TotalDiscountPct);
  const discountAmount =
    num(payload?.discount_amount) || num(payload?.DiscountAmount);
  const subtotal = num(payload?.Subtotal) || num(payload?.subtotal);
  const subtotalAfter =
    num(payload?.total_after) || num(payload?.SubtotalAfterTotalDiscount);
  const totalPrice = num(payload?.TotalPrice) || num(payload?.totalPrice);

  const hasDiscount =
    discountPer > 0 ||
    discountAmount > 0 ||
    (subtotalAfter > 0 && subtotalAfter < subtotal) ||
    (subtotalAfter > 0 && subtotalAfter < totalPrice);

  console.log("🧾 [Preview PDF] Discount detection summary:");
  console.table({
    discountPer,
    discountAmount,
    subtotal,
    subtotalAfter,
    totalPrice,
    hasDiscount,
  });

  // ✅ Choose the correct template file
  let templateFile;
  if (hasDiscount) {
    templateFile = isUSD
      ? "SVS_Quotation_Discount_USD.docx"
      : "SVS_Quotation_Discount.docx";
  } else {
    templateFile = isUSD
      ? "SVS_Quotation_NEW_USD.docx"
      : "SVS_Quotation_NEW.docx";
  }

  const templatePath = path.join(process.cwd(), "templates", templateFile);
  if (!fs.existsSync(templatePath))
    throw new Error(`Template not found at ${templatePath}`);
  console.log("📄 [Preview PDF] Using template:", templateFile);

  // ✅ Render and normalize DOCX
  const templateBuffer = fs.readFileSync(templatePath);
  const renderedBuffer = await renderDocxBuffer(templateBuffer, payload);
  console.log("🧩 Normalizing DOCX XML before PDF conversion...");
  const normalizedBuffer = await normalizeDocx(renderedBuffer);

  // ✅ Save to temporary file
  const tmpDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const tmpDocx = path.join(tmpDir, `quotation-${Date.now()}.docx`);
  fs.writeFileSync(tmpDocx, normalizedBuffer);
  console.log("🧩 Generated DOCX:", tmpDocx);

  const soffice = getLibreOfficePath();
  const outPdf = tmpDocx.replace(/\.docx$/i, ".pdf");

const execOptions = {
  cwd: tmpDir, // ensure working directory is writable
  env: {
    ...process.env,
    PATH: `/opt/libreoffice25.2/program:${process.env.PATH}`,
    UNO_PATH: "/opt/libreoffice25.2/program",
    PYTHONPATH: "/opt/libreoffice25.2/program",
    LD_LIBRARY_PATH: "/opt/libreoffice25.2/program",
    URE_BOOTSTRAP: "vnd.sun.star.pathname:/opt/libreoffice25.2/program/fundamentalrc",
    HOME: "/tmp",
    XDG_RUNTIME_DIR: "/tmp",
    XDG_CONFIG_HOME: "/tmp",
    XDG_CACHE_HOME: "/tmp",
    SAL_USE_VCLPLUGIN: "headless",
  },
};


  // ✅ Multiple filters for maximum compatibility
 // ✅ Multiple filters for maximum compatibility
const convertCommands = [
  ["--headless", "--invisible", "--norestore", "--nodefault",
   "--nolockcheck", "--nofirststartwizard",
   "--convert-to", "pdf:writer_pdf_Export", tmpDocx],
  ["--headless", "--invisible", "--norestore", "--nodefault",
   "--nolockcheck", "--nofirststartwizard",
   "--convert-to", "pdf:impress_pdf_Export", tmpDocx],
  ["--headless", "--invisible", "--norestore", "--nodefault",
   "--nolockcheck", "--nofirststartwizard",
   "--convert-to", "pdf", tmpDocx],
];

let converted = false;

for (const args of convertCommands) {
  try {
    console.log("🧩 Trying conversion with args:", args.join(" "));

    // 🧠 Create isolated user profile for LibreOffice
    const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), "lo-profile-"));
    const profileArgs = [
      `--env:UserInstallation=file://${tmpProfile}`,
      `--outdir=${tmpDir}`,
    ];

    // 🧠 Explicitly set working directory to tmpDir
    const execOptionsWithCwd = { ...execOptions, cwd: tmpDir };

    const pdfPath = path.join(
      tmpDir,
      path.basename(tmpDocx).replace(/\.docx$/, ".pdf")
    );

    await execFileAsync(soffice, [...profileArgs, ...args], execOptionsWithCwd);

    // Allow a tiny delay for filesystem sync
    await new Promise((r) => setTimeout(r, 800));

    if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 1000) {
      console.log("✅ PDF generated successfully:", pdfPath);
      converted = true;
      fs.rmSync(tmpProfile, { recursive: true, force: true });
      break;
    } else {
      console.warn("⚠️ LibreOffice did not output file:", pdfPath);
      fs.rmSync(tmpProfile, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn("⚠️ Conversion attempt failed:", e.message);
  }
}

if (!converted) {
  throw new Error(`LibreOffice failed to generate PDF from ${tmpDocx}`);
}

const pdfPath = path.join(tmpDir, path.basename(tmpDocx).replace(/\.docx$/, ".pdf"));
const pdfBytes = fs.readFileSync(pdfPath);
console.log("✅ PDF conversion complete:", pdfPath);


  return pdfBytes;
}


/* ---------- Internal Base ---------- */
function getInternalBase(req) {
  if (process.env.INTERNAL_API_BASE) return process.env.INTERNAL_API_BASE;

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "127.0.0.1:3000";
  const hintedProto = req.headers.get("x-forwarded-proto") || "http";
  const forceHttp = host.endsWith(":3000");
  return `${forceHttp ? "http" : hintedProto}://${host}`;
}

/* ---------- Clean Up Sections ---------- */
function sanitizeSections(payload) {
  if (!Array.isArray(payload.Sections)) return payload;

  payload.Sections = payload.Sections.filter(
    (s) => (s.Title && s.Title.trim() !== "") || (s.Items && s.Items.length > 0)
  );

  payload.Sections = payload.Sections.filter((section) => {
    if (
      (!section?.Title || !section.Title.trim()) &&
      (!section?.Items || section.Items.length === 0)
    )
      return false;

    if (!section?.Title?.trim()) {
      section.Title = undefined;
      section.TitleRow = undefined;
    } else {
      section.TitleRow = section.Title;
    }

    return true;
  });

  return payload;
}

/* ---------- GET ---------- */
export async function GET(req, { params }) {
  try {
    const { quotationId } = params;
    const base = getInternalBase(req);
    const apiUrl = new URL(`/api/quotation/${quotationId}`, base);

    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: { cookie: req.headers.get("cookie") || "" },
    });
    if (!res.ok) throw new Error(`Failed to load quotation ${quotationId}`);

    const quotation = await res.json();
    let payload = buildQuotationPayload(quotation);
    payload = sanitizeSections(payload);

    const pdfBytes = await docxToPdfBytes(payload);

    const filename = `Quotation_${quotation.quotationId || quotationId}.pdf`;
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: pdfHeaders(filename),
    });
  } catch (err) {
    console.error("❌ [Preview PDF GET] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ---------- POST ---------- */
export async function POST(req, { params }) {
  try {
    const { quotationId } = params;
    let payload = await req.json();
    console.log(
      "🧩 [Preview PDF POST] Received payload keys:",
      Object.keys(payload)
    );

    payload = sanitizeSections(payload);
    const pdfBytes = await docxToPdfBytes(payload);

    const filename = `Quotation_${payload?.QuotationNumber || quotationId}.pdf`;
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: pdfHeaders(filename),
    });
  } catch (err) {
    console.error("❌ [Preview PDF POST] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ---------- Headers Helper ---------- */
function pdfHeaders(filename) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(
      filename
    )}`,
    "Cache-Control": "no-store",
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Security-Policy": "frame-ancestors 'self'",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}


