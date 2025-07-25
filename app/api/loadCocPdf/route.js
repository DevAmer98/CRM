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

// Function to convert DOCX to PDF using LibreOffice
async function convertDocxToPdf(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Update LibreOffice path for Linux
    const libreOfficePath = '/usr/bin/libreoffice'; // Path to LibreOffice on Linux
    const command = `${libreOfficePath} --headless --convert-to pdf --outdir ${path.dirname(outputPath)} ${inputPath}`;
    
    console.log('Running command:', command);

    exec(command, (error, stdout, stderr) => {
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);

      if (error) {
        console.error('Error during conversion:', error);
        reject(stderr);
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

    const fileName = 'SVS_COC_NEW.docx'; // Use the specified file name for the template
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
        'Content-Disposition': `attachment; filename="COC_${data.COCNumber || 'Document'}.pdf"`,
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
