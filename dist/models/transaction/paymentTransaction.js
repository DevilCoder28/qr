"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const transactionSchema = new mongoose_1.default.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    items: [
        {
            qrTypeId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: constants_1.COLLECTION_NAMES.QR_TYPES_META_DATA,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
    },
    createdFor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
    },
    shippingAddress: {
        houseNumber: String,
        locality: String,
        nearByAreaName: String,
        pincode: String,
        city: String,
        state: String,
        country: String,
    },
    deliveryType: {
        type: String,
        enum: Object.values(constants_1.DeliveryType),
    },
    amount: Number,
    status: {
        type: String,
        enum: Object.values(constants_1.PaymentTransactionStatus),
        default: constants_1.PaymentTransactionStatus.INITIATED,
    },
}, { timestamps: true });
exports.PaymentTransaction = mongoose_1.default.model(constants_1.COLLECTION_NAMES.PAYMENT_HISTORY, transactionSchema);
