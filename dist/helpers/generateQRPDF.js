"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRPDFAndUploadToCloudinary = exports.uploadLocalPDF = void 0;
const pdf_lib_1 = require("pdf-lib");
const node_fetch_1 = __importDefault(require("node-fetch")); // only if not globally available
const uploadToCloudinary_1 = require("../config/uploadToCloudinary");
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const uploadLocalPDF = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const localFilePath = path_1.default.resolve('QRTemplate.pdf');
        // const result = await cloudinary.uploader.unsigned_upload(localFilePath, "unsigned_1", {
        //   resource_type: 'raw',
        //   public_id: 'QRTemplate',
        //   folder: 'qr-pdfs',
        //   // access_mode : 'public'
        // });
        const result = yield cloudinary_1.v2.uploader.upload(localFilePath, {
            folder: 'qr-pdfs',
            resource_type: 'raw',
            public_id: 'QRTemplate',
            access_mode: 'public',
            type: 'upload',
        });
        yield cloudinary_1.v2.api.update('qr-pdfs/QRTemplate', {
            resource_type: 'raw',
            access_mode: 'public',
        });
        console.log(' Uploaded:', result.secure_url);
    }
    catch (err) {
        console.error('Upload failed:', err);
    }
});
exports.uploadLocalPDF = uploadLocalPDF;
const generateQRPDFAndUploadToCloudinary = (serialNumber, qrUrl, folderPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!serialNumber || typeof serialNumber !== 'string') {
            throw new Error('Invalid serial number');
        }
        if (!qrUrl.startsWith('http')) {
            throw new Error('Invalid QR image URL');
        }
        const qrImageResponse = yield (0, node_fetch_1.default)(qrUrl);
        if (!qrImageResponse.ok) {
            throw new Error('Failed to fetch QR image from URL');
        }
        const qrImageBuffer = Buffer.from(yield qrImageResponse.arrayBuffer());
        const templateResponse = yield (0, node_fetch_1.default)("https://res.cloudinary.com/dwu0hlosq/raw/upload/v1749986033/qr-pdfs/QRTemplate.pdf");
        console.log("Template response : ", templateResponse);
        if (!templateResponse.ok) {
            throw new Error('Failed to fetch PDF template');
        }
        const templateBytes = new Uint8Array(yield templateResponse.arrayBuffer());
        const pdfDoc = yield pdf_lib_1.PDFDocument.load(templateBytes);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        const font = yield pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        page.drawText(`SERIAL NUMBER : ${serialNumber}`, {
            x: 100,
            y: height - 90,
            size: 12,
            font,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        const qrImage = yield pdfDoc.embedPng(qrImageBuffer);
        page.drawImage(qrImage, {
            x: width - 490,
            y: height - 290,
            width: 100,
            height: 100,
        });
        const pdfBytes = yield pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);
        const result = yield (0, uploadToCloudinary_1.uploadToCloudinary)(pdfBuffer, folderPath, 'raw', serialNumber, 'pdf');
        console.log("Result URL : ", result.secure_url);
        return result.secure_url;
    }
    catch (error) {
        console.error('QR PDF generation/upload error:', error);
        return null;
    }
});
exports.generateQRPDFAndUploadToCloudinary = generateQRPDFAndUploadToCloudinary;
