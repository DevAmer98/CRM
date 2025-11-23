import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import { exec } from 'child_process';
import { NextResponse } from 'next/server';

// Function to write buffer to a temporary file
function writeBufferToTempFile(buffer, fileName) {
  const tempDir = path.join(process.cwd(), 'tmp'); // Directory for temporary files
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir); // Create the directory if it doesn't exist
  }
  const tempFilePath = path.join(tempDir, fileName);
  return new Promise((resolve, reject) => {
    fs.writeFile(tempFilePath, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(tempFilePath);
      }
    });
  });
}

// Function to fetch the DOCX template from the local directory
async function fetchDocxTemplate(fileName) {
  const filePath = path.join(process.cwd(), 'templates', fileName); // Path to template
  console.log(`Fetching DOCX template from local path: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return fs.readFileSync(filePath); // Return the file buffer
}

function resolveLibreOfficePath() {
  const explicit = process.env.LIBREOFFICE_PATH && process.env.LIBREOFFICE_PATH.trim();
  const candidates = [
    explicit,
    process.platform === 'win32' ? 'C:\\\\Program Files\\\\LibreOffice\\\\program\\\\soffice.exe' : null,
    process.platform === 'win32' ? 'C:\\\\Program Files (x86)\\\\LibreOffice\\\\program\\\\soffice.exe' : null,
    '/usr/bin/soffice',
    '/usr/local/bin/soffice',
    '/usr/lib/libreoffice/program/soffice',
    '/opt/libreoffice/program/soffice',
    '/snap/bin/libreoffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch (err) {
      // try next candidate
    }
  }

  throw new Error(
    `LibreOffice executable not found. Set LIBREOFFICE_PATH or install soffice. Candidates tried: ${candidates.join(', ')}`
  );
}

function quoteArg(value = '') {
  return `"${value.replace(/"/g, '\\"')}"`;
}

// Function to convert DOCX to PDF using LibreOffice
async function convertDocxToPdf(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    let libreOfficePath;
    try {
      libreOfficePath = resolveLibreOfficePath();
    } catch (err) {
      return reject(err);
    }
    const command = `${quoteArg(libreOfficePath)} --headless --convert-to pdf --outdir ${quoteArg(
      path.dirname(outputPath)
    )} ${quoteArg(inputPath)}`;
    
    console.log('Running command:', command);

    exec(command, (error, stdout, stderr) => {
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);

      if (error) {
        console.error('Error during conversion:', error);
        reject(stderr || error);
      } else {
        console.log('Conversion successful:', stdout);
        resolve(outputPath);
      }
    });
  });
}

// Helper function to clean up temporary files
function cleanupTempFiles(filePaths) {
  filePaths.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file ${filePath}:`, err.message);
      } else {
        console.log(`Temporary file deleted: ${filePath}`);
      }
    });
  });
}

// POST handler for generating and downloading the PDF
export async function POST(req) {
  try {
    console.log('Step 1: Request received');

    const chunks = [];
    for await (const chunk of req.body) {
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString());
    console.log('Step 2: Parsed request data:', data);

    const fileName = 'SVS_PO_NEW.docx'; // Use the specified file name for the template
    const docxBuffer = await fetchDocxTemplate(fileName);
    console.log('Step 3: DOCX template fetched successfully');

    const zip = new PizZip(docxBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
    console.log('Step 4: DOCX template rendered successfully');

    const tempDocxFilePath = await writeBufferToTempFile(doc.getZip().generate({ type: 'nodebuffer' }), 'temp.docx');
    console.log('Step 5: Rendered DOCX saved at:', tempDocxFilePath);

    const pdfPath = tempDocxFilePath.replace('.docx', '.pdf');
    console.log('Converting DOCX to PDF using LibreOffice...');
    await convertDocxToPdf(tempDocxFilePath, pdfPath);
    console.log('PDF generated successfully at:', pdfPath);

    const pdfBuffer = fs.readFileSync(pdfPath);

    // Serve the PDF to the client
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="PO_${data.PONumber || 'Document'}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    });

    // Clean up temporary files
    cleanupTempFiles([tempDocxFilePath, pdfPath]);

    return response;
  } catch (error) {
    console.error('Error in document generation:', error.message);
    console.error('Stack Trace:', error.stack);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
