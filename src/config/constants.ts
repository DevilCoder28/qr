import path from 'path';

export const COLLECTION_NAMES = {
  USER: 'users',
  QR_TYPES_META_DATA: 'qrtypesmetadatas',
  GENERATED_QRS: 'generatedqrs',
  PAYMENT_HISTORY: 'paymenthistories',
  QR_QUESTIONS: 'qr-questions'
};

export const TEMPLATE_DIR = path.join(__dirname, '..', 'templates');

export const APP_NAME = 'DigiPehchan';

export const allowedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
];

export enum qrFormatType {
  SQUARE = 'SQUARE',
  ROUND = 'ROUND',
  STICKER = 'STICKER',
}

export enum DeliveryType {
  ETAG = 'ETAG',
  PHYSICAL_SHIP = 'PHYSICAL_SHIP',
  BULK_GENERATION = 'BULK_GENERATION',
}

export enum QRStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PaymentTransactionStatus {
  INITIATED = 'INITIATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  SUCCESS = "SUCCESS",
}

export enum OrderStatus{
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    DISPATCHED = 'DISPATCHED'
}


export const PDF_NAME = "DigiPehchan_QR_Code.pdf";