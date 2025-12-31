import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import jwt from "jsonwebtoken";
import { buildQuotationPayload } from "@/app/lib/buildQuotationPayload";

const CUSTOM_TEMPLATE_DIR = path.join(process.cwd(), "tmp", "custom-templates");
const DEFAULT_TEMPLATE = "SVS_Quotation_NEW.docx";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || DEFAULT_TEMPLATE;
  const quotationId = searchParams.get("quotationId");
  const dataToken = searchParams.get("dataToken");
  console.log("[OO FILE] request", { name, quotationId, hasToken: !!dataToken });

  // If the requested file already exists (e.g., pre-rendered filled DOCX), serve directly
  const directPath = path.join(CUSTOM_TEMPLATE_DIR, path.basename(name));
  if (fs.existsSync(directPath)) {
    const buf = fs.readFileSync(directPath);
    console.log("[OO FILE] Serving pre-rendered file", directPath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${path.basename(directPath)}"`,
      },
    });
  }

  const hintedBase =
    process.env.ONLYOFFICE_PUBLIC_BASE ||
    process.env.INTERNAL_API_BASE ||
    null;

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "127.0.0.1:3000";
  const protoHint = req.headers.get("x-forwarded-proto") || "http";
  const fallbackBase = `${host.includes(":3000") ? "http" : protoHint}://${host}`;
  const apiBase = (hintedBase || fallbackBase).replace(/\/+$/, "");

  // If a token with payload is provided, render with that payload
  if (dataToken) {
    try {
      const decoded = jwt.verify(
        dataToken,
        process.env.ONLYOFFICE_JWT_SECRET || "local-secret"
      );
      const payload = decoded?.payload;
      if (!payload) throw new Error("Missing payload");
      console.log("[OO FILE] Rendering with token payload keys:", Object.keys(payload || {}));

      const customPath = path.join(CUSTOM_TEMPLATE_DIR, path.basename(name));
      const basePath = path.join(process.cwd(), "templates", DEFAULT_TEMPLATE);
      const templatePath = fs.existsSync(customPath) ? customPath : basePath;
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      const templateBuffer = fs.readFileSync(templatePath);
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render(payload);
      const rendered = doc.getZip().generate({ type: "nodebuffer" });

      return new NextResponse(rendered, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Quotation_${quotationId || "Preview"}.docx"`,
        },
      });
    } catch (err) {
      console.error("Failed to build filled template from token:", err);
      return NextResponse.json({ error: "Failed to render quotation template" }, { status: 500 });
    }
  }

  // If a quotationId is provided without token, attempt a simple fetch (may fail if protected)
  if (quotationId) {
    try {
      console.log("[OO FILE] Falling back to fetch quotation", quotationId);
      const res = await fetch(`${apiBase}/api/quotation/${quotationId}`);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Unable to fetch quotation ${quotationId}` },
          { status: 500 }
        );
      }
      const quotation = await res.json();
      const payload = buildQuotationPayload(quotation);
      console.log("[OO FILE] Rendered via fetch, payload keys:", Object.keys(payload || {}));

      // Prefer custom template if present
      const customPath = path.join(CUSTOM_TEMPLATE_DIR, path.basename(name));
      const basePath = path.join(process.cwd(), "templates", DEFAULT_TEMPLATE);
      const templatePath = fs.existsSync(customPath) ? customPath : basePath;
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      const templateBuffer = fs.readFileSync(templatePath);
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render(payload);
      const rendered = doc.getZip().generate({ type: "nodebuffer" });

      return new NextResponse(rendered, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="Quotation_${quotationId}.docx"`,
        },
      });
    } catch (err) {
      console.error("Failed to build filled template:", err);
      return NextResponse.json({ error: "Failed to render quotation template" }, { status: 500 });
    }
  }

  const customPath = path.join(CUSTOM_TEMPLATE_DIR, path.basename(name));
  const basePath = path.join(process.cwd(), "templates", DEFAULT_TEMPLATE);

  let filePath = basePath;
  if (fs.existsSync(customPath)) {
    filePath = customPath;
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
    },
  });
}
