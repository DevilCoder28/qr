"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../enums/enums");
exports.userSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().regex(/^[A-Za-z]+$/, {
        message: 'First name must contain only alphabets',
    }),
    lastName: zod_1.z
        .string()
        .regex(/^[A-Za-z]+$/, { message: 'Last name must contain only alphabets' }),
    password: zod_1.z.string().optional(),
    roles: zod_1.z.array(zod_1.z.nativeEnum(enums_1.UserRoles)).default([enums_1.UserRoles.BASIC_USER]),
});
