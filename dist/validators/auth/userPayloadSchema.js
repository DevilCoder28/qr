"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPayloadSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../enums/enums");
exports.UserPayloadSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    roles: zod_1.z.array(zod_1.z.nativeEnum(enums_1.UserRoles)),
});
