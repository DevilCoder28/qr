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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQRBySerialNumberHandler = exports.checkQRValidity = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const qrModel_1 = require("../../models/qr-flow/qrModel");
const ApiResponse_1 = require("../../config/ApiResponse");
const constants_1 = require("../../config/constants");
const paymentTransaction_1 = require("../../models/transaction/paymentTransaction");
const qrSchema_1 = require("../../validators/qr-flow/qrSchema");
exports.checkQRValidity = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serialNumber } = req.body;
    const QR = yield qrModel_1.QRModel.findOne({ serialNumber: serialNumber });
    if (!QR)
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'No QR found with this serial number', false, null);
    if (QR.qrStatus === constants_1.QRStatus.INACTIVE)
        return (0, ApiResponse_1.ApiResponse)(res, 200, 'The QR is not yet activated.', true, {
            qrStatus: QR.qrStatus,
        });
    const transactionId = QR === null || QR === void 0 ? void 0 : QR.transactionId;
    const transaction = yield paymentTransaction_1.PaymentTransaction.findById(transactionId);
    if (!transaction)
        return (0, ApiResponse_1.ApiResponse)(res, 200, 'No Valid Transaction found for this one!', true, {
            qrStatus: QR.qrStatus,
        });
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'QR Information fetched successfully', true, {
        qrInfo: QR,
        transaction: transaction,
    });
}));
exports.updateQRBySerialNumberHandler = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const qrInfo = req.body;
    const validation = qrSchema_1.qrUpdateSchema.safeParse(qrInfo);
    console.log("Validation Error : ", validation.error);
    if (!validation.success)
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'Error occurred in validation', false, null);
    const _a = validation.data, { serialNumber } = _a, updateData = __rest(_a, ["serialNumber"]);
    const updatedQR = yield qrModel_1.QRModel.findOneAndUpdate({ serialNumber }, {
        $set: Object.assign({}, updateData),
    }, {
        new: true,
        runValidators: true,
    });
    if (!updatedQR) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'QR with given serial number not found.', false, null);
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'QR updated successfully.', true, updatedQR);
}));
