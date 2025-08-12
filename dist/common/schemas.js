"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gstNumberSchema = exports.vehicleNumberSchema = exports.addressSchema = exports.emailSchema = exports.mobileNumberSchema = exports.serialNumberSchema = exports.objectIdSchema = void 0;
const zod_1 = require("zod");
exports.objectIdSchema = zod_1.z
    .string()
    .regex(/^[a-f\d]{24}$/i, { message: 'Invalid ObjectId format' });
exports.serialNumberSchema = zod_1.z.string().regex(/^DIGI\d{10}$/, {
    message: "Serial number must start with 'DIGI' followed by 10 digits",
});
exports.mobileNumberSchema = zod_1.z.string().regex(/^\+\d{1,3}\s\d{10}$/, {
    message: "Mobile number must be in format '+<country-code> 1234567890'",
});
exports.emailSchema = zod_1.z.string().email({
    message: 'Invalid email address',
});
const pinCodeSchema = zod_1.z.string().regex(/^\d{6}$/, {
    message: 'PIN code must be exactly 6 digits',
});
exports.addressSchema = zod_1.z.object({
    houseNumber: zod_1.z.string().optional(),
    locality: zod_1.z.string().optional(),
    nearByAreaName: zod_1.z.string().optional(),
    pincode: pinCodeSchema.optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
});
exports.vehicleNumberSchema = zod_1.z
    .string()
    .regex(/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/, {
    message: "Vehicle number must be in format 'XX00XX0000' without spaces",
});
exports.gstNumberSchema = zod_1.z
    .string()
    .regex(/^[0-3][0-9][A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/, {
    message: 'Invalid GST Number format',
});
