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
exports.scanQrHandler = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const qrModel_1 = require("../../models/qr-flow/qrModel");
const ApiResponse_1 = require("../../config/ApiResponse");
const constants_1 = require("../../config/constants");
exports.scanQrHandler = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { qrId } = req.params;
    const qr = yield qrModel_1.QRModel.findById(qrId).lean();
    if (!qr) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'QR Code not found', false, null);
    }
    if (qr.qrStatus !== constants_1.QRStatus.ACTIVE) {
        return (0, ApiResponse_1.ApiResponse)(res, 403, 'QR Code is not active', false, null);
    }
    const visibleFields = qr.visibleInfoFields || [];
    const visibleData = Object.fromEntries(Object.entries(qr).filter(([key]) => visibleFields.includes(key)));
    // console.log("Visible Data : ", visibleData);
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'QR scanned successfully', true, {
        qrTypeId: qr.qrTypeId,
        visibleData,
        qrStatus: qr.qrStatus,
    });
}));
