"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const userPayloadSchema_1 = require("../validators/auth/userPayloadSchema");
const jwtHelper_1 = require("../utils/jwtHelper");
const ApiResponse_1 = require("../config/ApiResponse");
exports.authenticate = (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
    if (!token) {
        return (0, ApiResponse_1.ApiResponse)(res, 401, 'Unauthenticated', false, null, 'Authentication Error');
    }
    const decoded = (0, jwtHelper_1.verifyToken)(token);
    const parsedUser = userPayloadSchema_1.UserPayloadSchema.parse(decoded);
    req.data = parsedUser;
    next();
}));
const authorize = (allowedRoles) => (0, express_async_handler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.data) {
        return (0, ApiResponse_1.ApiResponse)(res, 401, 'Unauthorized', false, null, 'Authorization Error');
    }
    const { roles } = req.data;
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return (0, ApiResponse_1.ApiResponse)(res, 403, 'Forbidden', false, null, 'Authorization Error');
    }
    const hasPermission = roles.some((role) => allowedRoles.includes(role));
    if (!hasPermission) {
        throw (0, http_errors_1.default)(403, 'Forbidden: You are not authorized to access this resource.');
    }
    next();
}));
exports.authorize = authorize;
