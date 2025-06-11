import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import { exec } from 'child_process';
import { NextResponse } from 'next/server';
import { Client } from 'basic-ftp';

// Function to upload files to Synology NAS
async function uploadToSynology(localFilePath, remoteFilePath) {
    const client = new Client();
    client.ftp.verbose = true;
    const ftpConfig = {
        host: 'svscrm.synology.me',
        port: 8080,
        user: 'amer.svs',
        password: 'Amer@200300'
    };
    try {
        await client.access(ftpConfig);
        await client.uploadFrom(localFilePath, remoteFilePath);
        console.log(`File uploaded successfully: ${remoteFilePath}`);
    } finally {
        client.close();
    }
}

// Function to write buffer to a temporary file
async function writeBufferToTempFile(buffer, fileName) {
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    const tempFilePath = path.join(tempDir, fileName);
    return new Promise((resolve, reject) => {
        fs.writeFile(tempFilePath, buffer, (err) => {
            if (err) reject(err);
            else resolve(tempFilePath);
        });
    });
}

// Function to fetch the DOCX template from the local directory
async function fetchDocxTemplate(fileName) {
    const filePath = path.join(process.cwd(), 'templates', fileName);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    return fs.readFileSync(filePath);
}

// Function to convert DOCX to PDF
async function convertDocxToPdf(inputPath, outputPath) {
    const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
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

// Helper function to clean up temporary files
function cleanupTempFiles(filePaths) {
    filePaths.forEach(filePath => {
        fs.unlink(filePath, err => {
            if (err) console.error(`Failed to delete file: ${filePath}`, err);
        });
    });
}

// POST handler for generating and downloading the PDF
export async function POST(req) {
    try {
        const chunks = [];
        for await (const chunk of req.body) {
            chunks.push(chunk);
        }
        const data = JSON.parse(Buffer.concat(chunks).toString());

        // Ensure COCNumber is available, otherwise use a default
        const cocNumber = data.CocNumber || 'Document';

        const fileName = 'SVS_COC_NEW.docx';
        const docxBuffer = await fetchDocxTemplate(fileName);
        const zip = new PizZip(docxBuffer);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        doc.render(data);

        const tempDocxFilePath = await writeBufferToTempFile(doc.getZip().generate({ type: 'nodebuffer' }), 'temp.docx');
        const pdfPath = tempDocxFilePath.replace('.docx', '.pdf');
        await convertDocxToPdf(tempDocxFilePath, pdfPath);

        const remoteFilePath = `/CRM_Test/CoC/${cocNumber}.pdf`;
        await uploadToSynology(pdfPath, remoteFilePath);

        const pdfBuffer = fs.readFileSync(pdfPath);

        // Serve the PDF to the client with a more descriptive filename
        const response = new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="COC_${cocNumber}.pdf"`,
                'Content-Type': 'application/pdf'
            }
        });

        // Clean up temporary files
        cleanupTempFiles([tempDocxFilePath, pdfPath]);

        return response;
    } catch (error) {
        console.error('Error in document generation or upload:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
