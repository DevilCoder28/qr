"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDF_NAME = exports.OrderStatus = exports.PaymentTransactionStatus = exports.QRStatus = exports.DeliveryType = exports.qrFormatType = exports.allowedFileTypes = exports.APP_NAME = exports.TEMPLATE_DIR = exports.COLLECTION_NAMES = void 0;
const path_1 = __importDefault(require("path"));
exports.COLLECTION_NAMES = {
    USER: 'users',
    QR_TYPES_META_DATA: 'qrtypesmetadatas',
    GENERATED_QRS: 'generatedqrs',
    PAYMENT_HISTORY: 'paymenthistories',
    QR_QUESTIONS: 'qr-questions'
};
exports.TEMPLATE_DIR = path_1.default.join(__dirname, '..', 'templates');
exports.APP_NAME = 'DigiPehchan';
exports.allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/pdf',
];
var qrFormatType;
(function (qrFormatType) {
    qrFormatType["SQUARE"] = "SQUARE";
    qrFormatType["ROUND"] = "ROUND";
    qrFormatType["STICKER"] = "STICKER";
})(qrFormatType || (exports.qrFormatType = qrFormatType = {}));
var DeliveryType;
(function (DeliveryType) {
    DeliveryType["ETAG"] = "ETAG";
    DeliveryType["PHYSICAL_SHIP"] = "PHYSICAL_SHIP";
    DeliveryType["BULK_GENERATION"] = "BULK_GENERATION";
})(DeliveryType || (exports.DeliveryType = DeliveryType = {}));
var QRStatus;
(function (QRStatus) {
    QRStatus["ACTIVE"] = "ACTIVE";
    QRStatus["INACTIVE"] = "INACTIVE";
})(QRStatus || (exports.QRStatus = QRStatus = {}));
var PaymentTransactionStatus;
(function (PaymentTransactionStatus) {
    PaymentTransactionStatus["INITIATED"] = "INITIATED";
    PaymentTransactionStatus["PAID"] = "PAID";
    PaymentTransactionStatus["FAILED"] = "FAILED";
    PaymentTransactionStatus["SUCCESS"] = "SUCCESS";
})(PaymentTransactionStatus || (exports.PaymentTransactionStatus = PaymentTransactionStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["DISPATCHED"] = "DISPATCHED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
exports.PDF_NAME = "DigiPehchan_QR_Code.pdf";
