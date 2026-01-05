import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export const runtime = "nodejs"; // so we can use fs and child_process

const execFileAsync = promisify(execFile);

// LibreOffice path per platform
function getLibreOfficePath() {
  const p = process.platform;
  if (p === "win32") return "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
  if (p === "darwin") return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  return "/usr/bin/soffice"; // Linux
}

// Render DOCX buffer from template + data
async function renderDocxBuffer(templateBuffer, data) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" });
}

// Convert DOCX buffer to PDF bytes via LibreOffice
async function docxToPdfBytes(payload) {
  // 1) Load DOCX template from your repo
  const companyProfile = payload?.CompanyProfile || "SMART_VISION";
  const templateFile =
    companyProfile === "ARABIC_LINE"
      ? "AR_Quotation_NEW.docx"
      : "SVS_Quotation_NEW.docx";
  const templatePath = path.join(process.cwd(), "templates", templateFile);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }
  const templateBuffer = fs.readFileSync(templatePath);

  // 2) Render
  const renderedBuffer = await renderDocxBuffer(templateBuffer, payload);

  // 3) Write temp DOCX
  const tmpDir = process.platform === "win32" ? path.join(process.cwd(), "tmp") : os.tmpdir();
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpDocx = path.join(tmpDir, `quotation-${Date.now()}.docx`);
  fs.writeFileSync(tmpDocx, renderedBuffer);

  // 4) Convert to PDF
  const soffice = getLibreOfficePath();
  const outPdf = tmpDocx.replace(/\.docx$/i, ".pdf");
  try {
    await execFileAsync(soffice, [
      "--headless",
      "--convert-to",
      "pdf:writer_pdf_Export",
      "--outdir",
      tmpDir,
      tmpDocx,
    ]);
  } catch (e) {
    throw new Error(
      `LibreOffice conversion failed. Ensure LibreOffice is installed and path is correct.\n${e?.message || e}`
    );
  }

  // 5) Read & cleanup
  const pdfBytes = fs.readFileSync(outPdf);
  try { fs.unlinkSync(tmpDocx); } catch {}
  try { fs.unlinkSync(outPdf); } catch {}
  return pdfBytes;
}

export async function POST(req) {
  try {
    const payload = await req.json();

    // Always use DOCX → PDF for exact review (dynamic rows/pagination)
    const pdfBytes = await docxToPdfBytes(payload);

    const filename = `Quotation_${payload?.QuotationNumber || "Preview"}.pdf`;
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("loadQuoPdf error:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate PDF" }, { status: 500 });
  }
}
