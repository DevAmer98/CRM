// app/api/quote/route.ts (or .js)
export const runtime = 'nodejs';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { spawn } from 'child_process';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { NextResponse } from 'next/server';
import { Client } from 'basic-ftp';
import osMod from 'os';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const rm = promisify(fs.rm);
const access = promisify(fs.access);

function findSofficePath(): string {
  if (osMod.platform() === 'win32') {
    // Adjust if LibreOffice is in another path on your dev PC
    return `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
  }
  const candidates = ['/usr/bin/soffice', '/usr/local/bin/soffice', 'soffice'];
  for (const p of candidates) {
    try { fs.accessSync(p.replace(/"/g, ''), fs.constants.X_OK); return p; } catch {}
  }
  return 'soffice';
}

async function fetchDocxTemplate(fileName: string): Promise<Buffer> {
  const filePath = path.join(process.cwd(), 'templates', fileName);
  await access(filePath, fs.constants.R_OK);
  return readFile(filePath);
}

async function convertDocxToPdf(inputPath: string, outDir: string): Promise<string> {
  const soffice = findSofficePath();
  const userProfileDir = path.join(outDir, `lo_profile_${process.pid}_${Date.now()}`);
  await mkdir(userProfileDir, { recursive: true });

  const args = [
    '--headless',
    `-env:UserInstallation=file://${userProfileDir}`,
    '--convert-to', 'pdf:writer_pdf_Export',
    '--outdir', outDir,
    inputPath,
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(soffice, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = ''; let stderr = '';
    proc.stdout.on('data', d => (stdout += d.toString()));
    proc.stderr.on('data', d => (stderr += d.toString()));
    proc.on('error', reject);
    proc.on('close', code => code === 0 ? resolve() :
      reject(new Error(`LibreOffice exit ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`)));
  });

  return inputPath.replace(/\.docx$/i, '.pdf');
}

function safeFileBase(input: string, fallback = 'Document'): string {
  const base = (input || fallback).toString().trim();
  return base.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120) || fallback;
}

async function uploadToSynology(localFilePath: string, remoteFilePath: string) {
  // Put these in .env.local / server env:
  const host = process.env.FTP_HOST || 'svscrm.synology.me';
  const port = Number(process.env.FTP_PORT || 8080);            // 21 for FTP, 990 for FTPS
  const user = process.env.FTP_USER || 'crm';
  const password = process.env.FTP_PASS || 'Amer@200300';
  const secure = (process.env.FTP_SECURE || 'false') === 'true'; // 'true' for FTPS

  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({ host, port, user, password, secure });
    // Ensure parent dir exists, then upload
    const dir = path.posix.dirname(remoteFilePath);
    await client.ensureDir(dir); // creates nested directories as needed
    await client.uploadFrom(localFilePath, remoteFilePath);
  } finally {
    client.close();
  }
}

export async function POST(req: Request) {
  const tmpRoot = os.tmpdir();
  const reqTmp = path.join(tmpRoot, `quote_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  try {
    const data = await req.json();

    const templateName = 'SVS_Quotation_NEW.docx';
    const docxBuffer = await fetchDocxTemplate(templateName);

    const zip = new PizZip(docxBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);

    await mkdir(reqTmp, { recursive: true });
    const tmpDocx = path.join(reqTmp, 'temp.docx');
    await writeFile(tmpDocx, doc.getZip().generate({ type: 'nodebuffer' }));

    const pdfPath = await convertDocxToPdf(tmpDocx, reqTmp);

    // Build a safe filename and remote path
    const base = safeFileBase(data?.QuotationNumber, 'Document');
    const remoteFilePath = `/CRM/Quotation/${base}.pdf`;

    // Upload to Synology NAS (FTP/FTPS)
    await uploadToSynology(pdfPath, remoteFilePath);

    // Serve to client
    const pdfBuffer = await readFile(pdfPath);
    const downloadName = `Quotation_${base}.pdf`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Error in document generation/upload:', err?.message || err);
    return new NextResponse('Internal Server Error', { status: 500 });
  } finally {
    // best-effort cleanup
    try { await rm(reqTmp, { recursive: true, force: true }); } catch {}
  }
}
