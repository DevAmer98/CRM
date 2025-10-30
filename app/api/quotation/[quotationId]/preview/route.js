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
  const p = process.platform;
  if (p === "win32") return "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
  if (p === "darwin") return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  return "/usr/bin/soffice";
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

    xml = xml
      // ✅ Allow table rows to break
      .replace(/<w:cantSplit[^>]*>/g, '<w:cantSplit w:val="0"/>')
      // ✅ Auto row height
      .replace(/<w:trHeight[^>]*>/g, '<w:trHeight w:hRule="auto"/>')
      // ✅ Remove floating-positioned tables
      .replace(/<w:tblpPr[^>]*>[\s\S]*?<\/w:tblpPr>/g, "")
      // ✅ Ensure consistent table look
      .replace(
        /<w:tblLook [^>]*\/>/g,
        '<w:tblLook w:noHBand="0" w:noVBand="0"/>'
      )
      // ✅ Force tables to overlap “never”
      .replace(/<\/w:tblPr>/g, '<w:tblOverlap w:val="never"/></w:tblPr>')
      // ✅ Remove “keep with next / keep lines” (prevents LibreOffice from grouping rows)
      .replace(/<w:keepNext\/>/g, "")
      .replace(/<w:keepLines\/>/g, "");

    zip.file(f, xml);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}

/* ---------- DOCX → PDF Conversion (using unoconv + LibreOffice 25.2) ---------- */
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

  const outPdf = tmpDocx.replace(/\.docx$/i, ".pdf");

  /* ✅ Use LibreOffice 25.2 Python + unoconv */
  const execOptions = {
    env: {
      ...process.env,
      PATH: `/opt/libreoffice25.2/program:${process.env.PATH}`,
      UNO_PATH: "/opt/libreoffice25.2/program",
      PYTHONPATH: "/opt/libreoffice25.2/program",
    },
  };

  await execFileAsync(
    "/opt/libreoffice25.2/program/python",
    [
      "/usr/bin/unoconv",
      "--connection",
      "socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext",
      "-f",
      "pdf",
      tmpDocx,
    ],
    execOptions
  );

  const pdfBytes = fs.readFileSync(outPdf);
  console.log("✅ PDF generated:", outPdf);

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
