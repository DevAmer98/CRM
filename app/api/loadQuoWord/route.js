// app/api/loadQuoWord/route.js
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { buildQuotationPayload } from "@/app/lib/buildQuotationPayload";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    let payload = body;

    // ---------- Fetch full quotation if only ID is sent ----------
    if (body?.quotationId && !body?.Sections) {
      const base =
        process.env.INTERNAL_API_BASE ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000";

      const res = await fetch(`${base}/api/quotation/${body.quotationId}`, {
        cache: "no-store",
      });

      if (!res.ok)
        throw new Error(`Failed to fetch quotation ${body.quotationId}`);

      const quotation = await res.json();
      payload = buildQuotationPayload(
        quotation,
        quotation.currency || "USD",
        quotation.user?.username || "N/A"
      );
    } else if (body?.quotation) {
      payload = buildQuotationPayload(
        body.quotation,
        body.quotation.currency || "USD"
      );
    }

    // ---------- Pick template by company profile ----------
    const companyProfile = payload?.CompanyProfile || "SMART_VISION";
    const templateFile =
      companyProfile === "ARABIC_LINE"
        ? "AR_Quotation_NEW.docx"
        : "SVS_Quotation_NEW.docx";

    const templatePath = path.join(process.cwd(), "templates", templateFile);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at ${templatePath}`);
    }

    // ---------- Render Word document ----------
    const templateBuffer = fs.readFileSync(templatePath);
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render(payload);

    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    const filename = `Quotation_${payload?.QuotationNumber || "Preview"}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating Word document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Word document" },
      { status: 500 }
    );
  }
}
