import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Readable } from 'stream';
import fetch from 'node-fetch'; // only if not globally available
import { uploadToCloudinary } from '../config/uploadToCloudinary';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

export const uploadLocalPDF = async () => {
  try {
    const localFilePath = path.resolve('QRTemplate.pdf'); 

    // const result = await cloudinary.uploader.unsigned_upload(localFilePath, "unsigned_1", {
    //   resource_type: 'raw',
    //   public_id: 'QRTemplate',
    //   folder: 'qr-pdfs',
    //   // access_mode : 'public'
    // });
    const result = await cloudinary.uploader.upload(localFilePath, {
  folder: 'qr-pdfs',
  resource_type: 'raw',
  public_id: 'QRTemplate',
  access_mode: 'public', 
  type: 'upload',
});

await cloudinary.api.update('qr-pdfs/QRTemplate', {
  resource_type: 'raw',
  access_mode: 'public',
});



    console.log(' Uploaded:', result.secure_url); 
  } catch (err) {
    console.error('Upload failed:', err);
  }
};


export const generateQRPDFAndUploadToCloudinary = async ( serialNumber: string, qrUrl: string, folderPath: string, ): Promise<string | null> => {
  try {
    if (!serialNumber || typeof serialNumber !== 'string') {
      throw new Error('Invalid serial number');
    }

    if (!qrUrl.startsWith('http')) {
      throw new Error('Invalid QR image URL');
    }

    const qrImageResponse = await fetch(qrUrl);
    if (!qrImageResponse.ok) {
      throw new Error('Failed to fetch QR image from URL');
    }

    const qrImageBuffer = Buffer.from(await qrImageResponse.arrayBuffer());

    const templateResponse = await fetch(
     "https://res.cloudinary.com/dwu0hlosq/raw/upload/v1749986033/qr-pdfs/QRTemplate.pdf",
    );
    console.log("Template response : ", templateResponse)

    if (!templateResponse.ok) {
      throw new Error('Failed to fetch PDF template');
    }

    const templateBytes = new Uint8Array(await templateResponse.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(`SERIAL NUMBER : ${serialNumber}`, {
      x: 100,
      y: height - 90,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    const qrImage = await pdfDoc.embedPng(qrImageBuffer);
    page.drawImage(qrImage, {
      x: width - 490,
      y: height - 290,
      width: 100,
      height: 100,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const result: any = await uploadToCloudinary(
      pdfBuffer,
      folderPath,
      'raw',
      serialNumber,
      'pdf',
    );
    console.log("Result URL : ", result.secure_url);

    return result.secure_url;
  }
  catch (error) {
    console.error('QR PDF generation/upload error:', error);
    return null;
  }
};


