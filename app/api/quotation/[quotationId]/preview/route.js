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
  // adjust if your distro places it elsewhere (e.g. /usr/lib/libreoffice/program/soffice)
  return "/usr/bin/soffice";
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
    throw new Error("PDF conversion failed. Ensure LibreOffice (soffice) is installed and in PATH on the server.");
  }

  const pdfBytes = fs.readFileSync(outPdf);
  try { fs.unlinkSync(tmpDocx); } catch {}
  try { fs.unlinkSync(outPdf); } catch {}
  return pdfBytes;
}

// Build a reliable base URL for server-side calls to your own API.
// Prefer INTERNAL_API_BASE (e.g. http://127.0.0.1:3000) to avoid TLS/proxy issues.
function getInternalBase(req) {
  if (process.env.INTERNAL_API_BASE) return process.env.INTERNAL_API_BASE;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "127.0.0.1:3000";
  const hintedProto = req.headers.get("x-forwarded-proto") || "http";

  // If the host includes a dev port (like :3000), force http (no TLS on that port)
  const forceHttp = /:(\d+)$/.test(host) && host.endsWith(":3000");
  const scheme = forceHttp ? "http" : hintedProto;

  return `${scheme}://${host}`;
}

export async function GET(req, { params }) {
  try {
    const { quotationId } = params;

    // Safe internal base to avoid ERR_SSL_WRONG_VERSION_NUMBER
    const base = getInternalBase(req);
    const apiUrl = new URL(`/api/quotation/${quotationId}`, base);

    // Forward cookies if your API requires auth/session
    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: { cookie: req.headers.get("cookie") || "" },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Failed to load quotation ${quotationId} (status ${res.status}) ${txt}`);
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

        // ✅ allow iframe embedding on same origin
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
        // optional: reduce CORB/CORP issues
        "Cross-Origin-Resource-Policy": "same-origin",
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
