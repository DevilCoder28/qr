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
exports.QRMetaData = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../../config/constants");
const BaseProfessionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100,
    },
    logoUrl: {
        type: String,
        required: true,
        match: /^https?:\/\/.+\..+/,
    },
});
const NewQRTypeSchema = new mongoose_1.Schema({
    qrName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100,
    },
    qrDescription: {
        type: String,
        required: true,
        minlength: 10,
    },
    qrUseCases: {
        type: [String],
        required: true,
        validate: [
            (val) => val.length > 0,
            'At least one use case is required',
        ],
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    discountedPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    includeGST: {
        type: Boolean,
        default: false,
    },
    professionBased: {
        type: Boolean,
        default: false,
    },
    professionsAllowed: {
        type: [BaseProfessionSchema],
        default: [],
    },
    qrBackgroundImage: {
        type: String,
        match: /^https?:\/\/.+\..+/,
    },
    qrIcon: {
        type: String,
        match: /^https?:\/\/.+\..+/,
    },
    productImage: {
        type: String,
        match: /^https?:\/\/.+\..+/,
    },
    qrFormatType: {
        type: String,
        enum: Object.values(constants_1.qrFormatType),
        default: constants_1.qrFormatType.SQUARE,
    },
    pdfTemplate: {
        type: String,
        match: /^https?:\/\/.+\..+/,
    },
    deliveryType: {
        type: [String],
        enum: Object.values(constants_1.DeliveryType),
        default: [
            constants_1.DeliveryType.ETAG,
            constants_1.DeliveryType.PHYSICAL_SHIP,
            constants_1.DeliveryType.BULK_GENERATION,
        ],
    },
    stockCount: {
        type: Number,
        min: 0,
        default: 0,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
        },
    },
    toObject: {
        transform(doc, ret) {
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
        },
    },
});
exports.QRMetaData = mongoose_1.default.model(constants_1.COLLECTION_NAMES.QR_TYPES_META_DATA, NewQRTypeSchema);
