

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



/* ---------- DOCX → PDF Conversion (LibreOffice headless, stable) ---------- */
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

  // Choose the correct template file
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

  // Render DOCX and normalize its XML
  const templateBuffer = fs.readFileSync(templatePath);
  const renderedBuffer = await renderDocxBuffer(templateBuffer, payload);
  console.log("🧩 Normalizing DOCX XML before PDF conversion...");
  const normalizedBuffer = await normalizeDocx(renderedBuffer);

  // Save to temporary location
  const tmpDir = path.join(process.cwd(), "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const tmpDocx = path.join(tmpDir, `quotation-${Date.now()}.docx`);
  fs.writeFileSync(tmpDocx, normalizedBuffer);
  console.log("🧩 Generated DOCX:", tmpDocx);

  const soffice = getLibreOfficePath();
  const outPdf = tmpDocx.replace(/\.docx$/i, ".pdf");


  // Try multiple filters to ensure compatibility across LibreOffice versions
const convertCommands = [
  ["--headless", "--convert-to", "pdf:writer_pdf_Export", "--outdir", tmpDir, tmpDocx],
  ["--headless", "--convert-to", "pdf:impress_pdf_Export", "--outdir", tmpDir, tmpDocx],
  ["--headless", "--convert-to", "pdf", "--outdir", tmpDir, tmpDocx],
];

let converted = false;

for (const args of convertCommands) {
  try {
    console.log("🧩 Trying conversion with args:", args.join(" "));
    await execFileAsync(soffice, args);
    if (fs.existsSync(outPdf)) {
      converted = true;
      break;
    }
  } catch (e) {
    console.warn("⚠️ Conversion attempt failed:", e.message);
  }
}

if (!converted) {
  throw new Error(`LibreOffice failed to generate PDF from ${tmpDocx}`);
}

const pdfBytes = fs.readFileSync(outPdf);
console.log("✅ PDF generated successfully:", outPdf);


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


