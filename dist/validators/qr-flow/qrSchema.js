"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrUpdateSchema = exports.qrSchema = void 0;
const zod_1 = require("zod");
const schemas_1 = require("../../common/schemas");
const constants_1 = require("../../config/constants");
exports.qrSchema = zod_1.z.object({
    qrTypeId: schemas_1.objectIdSchema,
    serialNumber: schemas_1.serialNumberSchema,
    customerName: zod_1.z.string().optional(),
    mobileNumber: schemas_1.mobileNumberSchema.optional(),
    altMobileNumber: schemas_1.mobileNumberSchema.optional(),
    email: schemas_1.emailSchema.optional(),
    address: schemas_1.addressSchema.optional(),
    vehicleNumber: schemas_1.vehicleNumberSchema.optional(),
    gstNumber: schemas_1.gstNumberSchema.optional(),
    createdBy: schemas_1.objectIdSchema.optional(),
    createdFor: schemas_1.objectIdSchema.optional(),
    deliveryType: zod_1.z.nativeEnum(constants_1.DeliveryType).optional(),
    qrStatus: zod_1.z.nativeEnum(constants_1.QRStatus).default(constants_1.QRStatus.INACTIVE),
    shippingDetails: schemas_1.addressSchema.optional(),
    visibleInfoFields: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.qrUpdateSchema = zod_1.z.object({
    serialNumber: schemas_1.serialNumberSchema,
    customerName: zod_1.z.string(),
    mobileNumber: schemas_1.mobileNumberSchema,
    altMobileNumber: schemas_1.mobileNumberSchema.optional(),
    email: schemas_1.emailSchema,
    address: schemas_1.addressSchema.optional(),
    vehicleNumber: schemas_1.vehicleNumberSchema.optional(),
    gstNumber: schemas_1.gstNumberSchema.optional(),
    visibleInfoFields: zod_1.z.array(zod_1.z.string()).optional(),
    qrStatus: zod_1.z.nativeEnum(constants_1.QRStatus),
    textMessagesAllowed: zod_1.z.boolean().optional(),
    voiceCallsAllowed: zod_1.z.boolean().optional(),
    videoCallsAllowed: zod_1.z.boolean().optional(),
});
