import fs from 'fs/promises';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { NextResponse } from 'next/server';
import { ensurePurchaseDocSections } from '@/app/lib/purchaseDocSections';

export async function POST(req) {
  try {
    // Read the stream and convert it into a JSON object
    const chunks = [];
    for await (const chunk of req.body) {
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString());
    console.log("Received data for document generation:", data);
    const payload = ensurePurchaseDocSections({ ...data });

    // Path to the local DOCX template
    const templatePath = path.join(process.cwd(), 'templates', 'SVS_PO_NEW.docx');
    console.log("Attempting to read local file at:", templatePath);

    // Asynchronously read the local DOCX template
    const content = await fs.readFile(templatePath);
    console.log(`Template read successfully. Content length: ${content.length} bytes`);

    const zip = new PizZip(content);
    console.log("ZIP library instantiated.");

    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    console.log("Docxtemplater instantiated.");

    // Render the document using the data
    doc.render(payload);
    console.log("Template rendered with data.");

    // Generate the document as a nodebuffer
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    console.log(`Buffer generated. Buffer length: ${buffer.length}`);

    const responseHeaders = {
      'Content-Disposition': `attachment; filename=PO_${payload.PurchaseId || payload.PONumber || 'Document'}.docx`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    return new NextResponse(Buffer.from(buffer), { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error('Error generating document:', error);
    return new NextResponse('Error generating document', { status: 500 });
  }
}
