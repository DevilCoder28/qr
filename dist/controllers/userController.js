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
exports.userProfile = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const ApiResponse_1 = require("../config/ApiResponse");
const user_1 = require("../models/auth/user");
exports.userProfile = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedData = req.data;
    if (!decodedData) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'Profile could not be fetched', false, null);
    }
    const { userId } = decodedData;
    const user = yield user_1.User.findById(userId);
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Profile retrieved successfully', true, {
        userData: {
            id: user === null || user === void 0 ? void 0 : user._id,
            name: `${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName}`,
            email: user === null || user === void 0 ? void 0 : user.email,
            roles: user === null || user === void 0 ? void 0 : user.roles,
        },
    });
}));
