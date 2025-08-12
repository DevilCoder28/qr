"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const addressSchema = new mongoose_1.Schema({
    houseNumber: String,
    locality: String,
    nearByAreaName: String,
    pincode: String,
    city: String,
    state: String,
    country: String,
}, { _id: false });
const qrSchema = new mongoose_1.Schema({
    qrTypeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.QR_TYPES_META_DATA,
        required: true,
    },
    serialNumber: {
        type: String,
        match: /^DIGI\d{10}$/,
    },
    customerName: {
        type: String,
    },
    mobileNumber: {
        type: String,
        match: /^\+\d{1,3}\s\d{10}$/,
    },
    altMobileNumber: {
        type: String,
        match: /^\+\d{1,3}\s\d{10}$/,
    },
    email: {
        type: String,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    address: addressSchema,
    vehicleNumber: {
        type: String,
        match: /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/,
    },
    gstNumber: {
        type: String,
        match: /^[0-3][0-9][A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
    },
    createdFor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER,
    },
    deliveryType: {
        type: String,
        enum: Object.values(constants_1.DeliveryType),
    },
    orderStatus: {
        type: String,
        enum: Object.values(constants_1.OrderStatus),
        default: constants_1.OrderStatus.SHIPPED
    },
    qrStatus: {
        type: String,
        enum: Object.values(constants_1.QRStatus),
        default: constants_1.QRStatus.INACTIVE,
    },
    shippingDetails: addressSchema,
    visibleInfoFields: {
        type: [String],
        default: [],
    },
    transactionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.PAYMENT_HISTORY,
    },
    qrUrl: {
        type: String,
    },
    qrRawData: {
        type: String,
    },
    textMessagesAllowed: {
        type: Boolean,
        default: false,
    },
    voiceCallsAllowed: {
        type: Boolean,
        default: false,
    },
    videoCallsAllowed: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
exports.QRModel = mongoose_1.default.model(constants_1.COLLECTION_NAMES.GENERATED_QRS, qrSchema);
