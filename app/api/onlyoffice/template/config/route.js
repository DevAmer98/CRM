import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const CUSTOM_TEMPLATE_DIR = path.join(process.cwd(), "tmp", "custom-templates");
const DEFAULT_TEMPLATE = "SVS_Quotation_NEW.docx";

function ensureCustomDir() {
  try {
    fs.mkdirSync(CUSTOM_TEMPLATE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function POST(req) {
  const body = await req.json();
  const name = body?.name || DEFAULT_TEMPLATE;
  const onlyOfficeUrl = (
    body?.onlyOfficeUrl ||
    process.env.NEXT_PUBLIC_ONLYOFFICE_URL ||
    ""
  ).replace(/\/+$/, "");
  const quotationId = body?.quotationId;
  const payloadData = body?.payload || null;
  const secret = process.env.ONLYOFFICE_JWT_SECRET || "local-secret";
  if (payloadData) {
    console.log("[OO CONFIG] Received payload for", name, "keys:", Object.keys(payloadData || {}));
  } else {
    console.log("[OO CONFIG] No payload provided for", name);
  }

  const { headers } = req;
  const hintedBase =
    process.env.ONLYOFFICE_PUBLIC_BASE ||
    process.env.INTERNAL_API_BASE ||
    null;

  let origin = hintedBase;
  if (!origin) {
    const host = headers.get("host");
    const proto =
      headers.get("x-forwarded-proto") ||
      (host && host.endsWith(":3000") ? "http" : "https") ||
      "http";
    origin = `${proto}://${host}`;
  }

  ensureCustomDir();

  const base = origin.replace(/\/+$/, "");
  const qSlugRaw =
    payloadData?.QuotationNumber ||
    quotationId ||
    name.replace(/\.docx$/i, "") ||
    "Quotation";
  const qSlug = qSlugRaw.replace(/[^A-Za-z0-9_-]+/g, "_");
  let effectiveName = `${qSlug}.docx`;

  // Pre-render a filled DOCX when payload provided, write it to tmp so OnlyOffice opens data-filled doc
  if (payloadData) {
    const customPath = path.join(CUSTOM_TEMPLATE_DIR, path.basename(name));
    const basePath = path.join(process.cwd(), "templates", name);
    const templatePath = fs.existsSync(customPath) ? customPath : basePath;
    const filledName = effectiveName;
    const filledPath = path.join(CUSTOM_TEMPLATE_DIR, filledName);
    try {
      const templateBuffer = fs.readFileSync(templatePath);
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render(payloadData);
      const rendered = doc.getZip().generate({ type: "nodebuffer" });
      fs.writeFileSync(filledPath, rendered);
      effectiveName = filledName;
      console.log("[OO CONFIG] Wrote filled doc for editor:", filledPath);
    } catch (err) {
      console.error("Failed to pre-render filled template, falling back to raw:", err);
      effectiveName = name;
    }
  }

  const docParams = new URLSearchParams({ name: effectiveName });

  const docUrl = `${base}/api/onlyoffice/template/file?${docParams.toString()}`;
  const saveUrl = `${base}/api/onlyoffice/template/save?name=${encodeURIComponent(
    name
  )}`;

  const config = {
    document: {
      fileType: "docx",
      title: effectiveName,
      url: docUrl,
      key: `${effectiveName}-${Date.now()}-${Math.random().toString(16).slice(2)}`, // unique per session
      permissions: {
        edit: true,
        download: true,
        print: true,
      },
    },
    documentType: "word",
    editorConfig: {
      mode: "edit",
      callbackUrl: saveUrl,
      customization: {
        autosave: true,
      },
    },
    token: null,
  };

  const signedPayload = {
    ...config,
    document: {
      ...config.document,
      url: docUrl,
      title: effectiveName,
    },
  };

  // Attach token if service URL provided
  if (onlyOfficeUrl) {
    config.token = jwt.sign(signedPayload, secret);
    config.onlyofficeUrl = onlyOfficeUrl;
  }

  return NextResponse.json(config);
}
