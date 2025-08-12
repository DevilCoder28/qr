"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newQRTypeSchema = exports.baseProfessionSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../../config/constants");
exports.baseProfessionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Profession name is required').max(100).optional(),
    logoUrl: zod_1.z.string().url('Invalid logo URL').optional(),
});
exports.newQRTypeSchema = zod_1.z.object({
    qrName: zod_1.z
        .string()
        .min(3, 'QR name must be at least 3 characters')
        .max(100, 'Name cannot be more than 100 characters long'),
    qrDescription: zod_1.z.string().min(10, 'Description is too short'),
    qrUseCases: zod_1.z
        .array(zod_1.z.string().min(1))
        .min(1, 'At least one use case is required'),
    originalPrice: zod_1.z.number().nonnegative('Price must be 0 or more'),
    discountedPrice: zod_1.z.number().nonnegative('Discounted price must be 0 or more'),
    includeGST: zod_1.z.boolean().optional().default(false),
    professionBased: zod_1.z.boolean().optional().default(false),
    professionsAllowed: zod_1.z.array(exports.baseProfessionSchema).optional(),
    qrBackgroundImage: zod_1.z.string().url().optional(),
    qrIcon: zod_1.z.string().url().optional(),
    productImage: zod_1.z.string().url().optional(),
    qrFormatType: zod_1.z
        .nativeEnum(constants_1.qrFormatType)
        .optional()
        .default(constants_1.qrFormatType.SQUARE),
    pdfTemplate: zod_1.z.string().url().optional(),
    deliveryType: zod_1.z
        .array(zod_1.z.nativeEnum(constants_1.DeliveryType))
        .min(1)
        .optional()
        .default([
        constants_1.DeliveryType.ETAG,
        constants_1.DeliveryType.PHYSICAL_SHIP,
        constants_1.DeliveryType.BULK_GENERATION,
    ]),
    stockCount: zod_1.z.number().int().min(0).default(0),
});
