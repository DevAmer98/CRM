// app/api/quotation/[quotationId]/preview/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { buildQuotationPayload } from "@/app/lib/buildQuotationPayload";

export const runtime = "nodejs";
const execFileAsync = promisify(execFile);

function getLibreOfficePath() {
  const p = process.platform;
  if (p === "win32") return "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
  if (p === "darwin") return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  return "/usr/bin/soffice"; // adjust if your server has it elsewhere
}

async function renderDocxBuffer(templateBuffer, data) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" });
}

async function docxToPdfBytes(payload) {
  const isUSD = payload?.Currency === "USD";
  const templateFile = isUSD ? "SVS_Quotation_NEW_USD.docx" : "SVS_Quotation_NEW.docx";
  const templatePath = path.join(process.cwd(), "templates", templateFile);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }

  const renderedBuffer = await renderDocxBuffer(fs.readFileSync(templatePath), payload);

  const tmpDir = process.platform === "win32" ? path.join(process.cwd(), "tmp") : os.tmpdir();
  fs.mkdirSync(tmpDir, { recursive: true });

  const tmpDocx = path.join(tmpDir, `quotation-${Date.now()}.docx`);
  fs.writeFileSync(tmpDocx, renderedBuffer);

  const soffice = getLibreOfficePath();
  const outPdf = tmpDocx.replace(/\.docx$/i, ".pdf");

  try {
    await execFileAsync(soffice, [
      "--headless",
      "--convert-to", "pdf:writer_pdf_Export",
      "--outdir", tmpDir,
      tmpDocx,
    ]);
  } catch (e) {
    console.error("LibreOffice conversion failed:", e);
    throw new Error(
      "PDF conversion failed. Ensure LibreOffice (soffice) is installed and accessible on the server."
    );
  }

  const pdfBytes = fs.readFileSync(outPdf);
  try { fs.unlinkSync(tmpDocx); } catch {}
  try { fs.unlinkSync(outPdf); } catch {}
  return pdfBytes;
}

export async function GET(req, { params }) {
  try {
    const { quotationId } = params;

    // ✅ Build a same-origin absolute URL from the incoming request
    const apiUrl = new URL(`/api/quotation/${quotationId}`, req.url);
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to load quotation ${quotationId} (status ${res.status})`);
    }
    const quotation = await res.json();

    const payload = buildQuotationPayload(quotation);
    const pdfBytes = await docxToPdfBytes(payload);

    const filename = `Quotation_${quotation.quotationId || quotationId}.pdf`;
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("preview error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to preview PDF" },
      { status: 500 }
    );
  }
}
