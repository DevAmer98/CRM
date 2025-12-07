import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { buildQuotationPayload } from "@/app/lib/buildQuotationPayload";
import { normalizeDocx } from "@/app/api/_lib/normalizeDocx";

export const runtime = "nodejs";
const execFileAsync = promisify(execFile);

// ---------- Detect LibreOffice ----------
function getLibreOfficePath() {
  const p = process.platform;
  if (p === "win32") return "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
  if (p === "darwin") return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  return "/usr/bin/soffice";
}

// ---------- Clean HTML (for Description fields) ----------
function cleanHTML(input = "") {
  if (!input) return "";
  let output = String(input);

  // Normalize <br> and paragraphs
  output = output
    .replace(/<br\s*\/?>/gi, "\r\n")
    .replace(/<\/p>/gi, "\r\n");

  // Ordered lists → numbered bullets with spacing
  output = output.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, list) => {
    let counter = 0;
    return (
      list
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, li) => {
          counter++;
          const text = li.replace(/<[^>]+>/g, "").trim();
          // two spaces + "1." + text + double newline
          return `  ${String(counter).padStart(2, " ")}. ${text}\r\n\r\n`;
        })
        .trim() + "\r\n"
    );
  });

  // Unordered lists → bullet dots with line spacing
  output = output.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, list) => {
    return (
      list
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, li) => {
          const text = li.replace(/<[^>]+>/g, "").trim();
          // add padding between each bullet
          return `  • ${text}\r\n\r\n`;
        })
        .trim() + "\r\n"
    );
  });

  // Remove any remaining tags
  output = output
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\r?\n{3,}/g, "\r\n\r\n")
    .trim();

  return output;
}

// ---------- Render DOCX ----------
async function renderDocxBuffer(templateBuffer, data) {
  try {
    // Clean descriptions before render
    if (Array.isArray(data?.Sections)) {
      data.Sections.forEach((section) => {
        if (Array.isArray(section.Items)) {
          section.Items.forEach((item) => {
            if (item.DescriptionRich) {
              if (Array.isArray(item.DescriptionRich)) {
                item.DescriptionRich = item.DescriptionRich.map((t) => cleanHTML(t));
              } else {
                item.DescriptionRich = [cleanHTML(item.DescriptionRich)];
              }
            } else if (item.Description) {
              item.Description = cleanHTML(item.Description);
            }
          });
        }
      });
    }

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

// ---------- DOCX → PDF with robust discount detection ----------
async function docxToPdfBytes(payload) {
  const isUSD = payload?.Currency === "USD";
  const num = (v) => {
    if (v == null) return 0;
    const n = Number(String(v).replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  // Normalize possible discount / price keys
  const discountPer =
    num(payload?.discountPer) ||
    num(payload?.discount_per) ||
    num(payload?.DiscountPer) ||
    num(payload?.TotalDiscountPct);

  const discountAmount =
    num(payload?.discountAmount) ||
    num(payload?.discount_amount) ||
    num(payload?.DiscountAmount);

  const subtotal =
    num(payload?.Subtotal) ||
    num(payload?.subtotal) ||
    num(payload?.TotalPrice);

  const subtotalAfter =
    num(payload?.SubtotalAfterTotalDiscount) ||
    num(payload?.subtotalAfterTotalDiscount) ||
    num(payload?.total_after);

  const totalPrice =
    num(payload?.NetPrice) ||
    num(payload?.totalPrice) ||
    num(payload?.TotalPrice);

  // Robust discount detection
  const hasDiscount =
    discountPer > 0 ||
    discountAmount > 0 ||
    (subtotal > 0 && subtotalAfter > 0 && subtotalAfter < subtotal) ||
    (subtotal > 0 && totalPrice > 0 && totalPrice < subtotal);

  console.log("🧾 [loadQuoPdf] Discount detection summary:");
  console.table({
    discountPer,
    discountAmount,
    subtotal,
    subtotalAfter,
    totalPrice,
    hasDiscount,
  });

  // Choose correct template
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
  console.log("📄 [loadQuoPdf] Using template:", templateFile);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }

  // Render DOCX
  const templateBuffer = fs.readFileSync(templatePath);
  const renderedBuffer = await renderDocxBuffer(templateBuffer, payload);
  const normalizedBuffer = await normalizeDocx(renderedBuffer);

  // Convert DOCX → PDF
  const tmpDir =
    process.platform === "win32"
      ? path.join(process.cwd(), "tmp")
      : os.tmpdir();
  fs.mkdirSync(tmpDir, { recursive: true });

  const tmpDocx = path.join(tmpDir, `quotation-${Date.now()}.docx`);
  fs.writeFileSync(tmpDocx, normalizedBuffer);

  const soffice = getLibreOfficePath();
  const outPdf = tmpDocx.replace(/\.docx$/i, ".pdf");

  await execFileAsync(soffice, [
    "--headless",
    "--convert-to",
    "pdf:writer_pdf_Export",
    "--outdir",
    tmpDir,
    tmpDocx,
  ]);

  const pdfBytes = fs.readFileSync(outPdf);
  try { fs.unlinkSync(tmpDocx); } catch {}
  try { fs.unlinkSync(outPdf); } catch {}

  return pdfBytes;
}

// ---------- Internal Base ----------
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

// ---------- Sanitize Sections ----------
function sanitizeSections(payload) {
  if (!Array.isArray(payload.Sections)) return payload;
  payload.Sections = payload.Sections.filter(
    (s) =>
      (s.Title && s.Title.trim() !== "") || (s.Items && s.Items.length > 0)
  );
  payload.Sections.forEach((s) => {
    if (!s.Title?.trim()) {
      s.Title = undefined;
      s.TitleRow = undefined;
    } else {
      s.TitleRow = s.Title;
    }
  });
  return payload;
}

// ---------- GET ----------
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
    console.error("❌ [loadQuoPdf GET] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------- POST ----------
export async function POST(req, { params }) {
  try {
    const { quotationId } = params || {};
    let payload = await req.json();
    console.log("🧩 [loadQuoPdf POST] Received payload keys:", Object.keys(payload));

    payload = sanitizeSections(payload);

    const pdfBytes = await docxToPdfBytes(payload);

    const filename = `Quotation_${payload?.QuotationNumber || quotationId || "Preview"}.pdf`;
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: pdfHeaders(filename),
    });
  } catch (err) {
    console.error("❌ [loadQuoPdf POST] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------- PDF Headers ----------
function pdfHeaders(filename) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "no-store",
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Security-Policy": "frame-ancestors 'self'",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}
