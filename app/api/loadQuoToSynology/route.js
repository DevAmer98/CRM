import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import os from 'os';
import Docxtemplater from 'docxtemplater';
import { exec } from 'child_process';
import { NextResponse } from 'next/server';
import { Client } from 'basic-ftp';

// Detect correct LibreOffice path
function getLibreOfficePath() {
    if (os.platform() === 'win32') {
        return `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
    }
    return '/usr/bin/soffice'; // Linux default (adjust if needed)
}

// Upload to Synology NAS
async function uploadToSynology(localFilePath, remoteFilePath) {
    const client = new Client();
    client.ftp.verbose = true;

    const ftpConfig = {
        host: 'svscrm.synology.me',
        port: 8080, // adjust if needed
        user: 'crm',
        password: 'Amer@200300'
    };

    try {
        await client.access(ftpConfig);
        await client.uploadFrom(localFilePath, remoteFilePath);
        console.log('File uploaded successfully to Synology NAS');
    } finally {
        client.close();
    }
}

// Write buffer to temp file
async function writeBufferToTempFile(buffer, fileName) {
    const tempDir = os.platform() === 'win32'
        ? path.join(process.cwd(), 'tmp') // local dev
        : os.tmpdir(); // Linux server-safe

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = path.join(tempDir, fileName);
    return new Promise((resolve, reject) => {
        fs.writeFile(tempFilePath, buffer, (err) => {
            if (err) reject(err);
            else resolve(tempFilePath);
        });
    });
}

// Fetch DOCX template
async function fetchDocxTemplate(fileName) {
    const filePath = path.join(process.cwd(), 'templates', fileName);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath);
}

// Convert DOCX to PDF
async function convertDocxToPdf(inputPath, outputPath) {
    const libreOfficePath = getLibreOfficePath();
    const command = `${libreOfficePath} --headless --convert-to pdf --outdir ${path.dirname(outputPath)} ${inputPath}`;
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error during conversion:', error);
                reject(stderr);
            } else {
                resolve(outputPath);
            }
        });
    });
}

// Clean up temp files
function cleanupTempFiles(filePaths) {
    filePaths.forEach(filePath => {
        fs.unlink(filePath, err => {
            if (err) console.error(`Failed to delete file ${filePath}:`, err);
        });
    });
}

// POST handler
export async function POST(req) {
    try {
        const chunks = [];
        for await (const chunk of req.body) {
            chunks.push(chunk);
        }
        const data = JSON.parse(Buffer.concat(chunks).toString());

        const fileName = 'SVS_Quotation_NEW.docx';
        const docxBuffer = await fetchDocxTemplate(fileName);

        const zip = new PizZip(docxBuffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        doc.render(data);

        const tempDocxFilePath = await writeBufferToTempFile(
            doc.getZip().generate({ type: 'nodebuffer' }),
            'temp.docx'
        );

        const pdfPath = tempDocxFilePath.replace('.docx', '.pdf');
        await convertDocxToPdf(tempDocxFilePath, pdfPath);

        const remoteFilePath = `/CRM/Quotation/${data.QuotationNumber || 'Document'}.pdf`;
        await uploadToSynology(pdfPath, remoteFilePath);

        const pdfBuffer = fs.readFileSync(pdfPath);

        const response = new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${remoteFilePath}"`,
                'Content-Type': 'application/pdf'
            }
        });

        cleanupTempFiles([tempDocxFilePath, pdfPath]);

        return response;
    } catch (error) {
        console.error('Error in document generation or upload:', error.message);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
