import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const CUSTOM_TEMPLATE_DIR = path.join(process.cwd(), "tmp", "custom-templates");
const DEFAULT_TEMPLATE = "SVS_Quotation_NEW.docx";

function ensureDir() {
  try {
    fs.mkdirSync(CUSTOM_TEMPLATE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function downloadToFile(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || DEFAULT_TEMPLATE;
    const status = body?.status;
    const downloadUri = body?.url || body?.downloadUri;

    // Only save when document is ready (status 2 or 6)
    if (status === 2 || status === 6) {
      if (!downloadUri) {
        return NextResponse.json({ error: "No download URL provided" }, { status: 400 });
      }
      ensureDir();
      const target = path.join(CUSTOM_TEMPLATE_DIR, path.basename(name));
      await downloadToFile(downloadUri, target);
      return NextResponse.json({ saved: true });
    }

    // Acknowledge other statuses
    return NextResponse.json({ status });
  } catch (err) {
    console.error("OnlyOffice save error:", err);
    return NextResponse.json({ error: err.message || "Save failed" }, { status: 500 });
  }
}
