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
exports.updateViewMoreData = exports.updateCustomerData = exports.viewMoreCustomerData = exports.getCustomerData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_1 = require("../../../models/auth/user");
const ApiResponse_1 = require("../../../config/ApiResponse");
const qrModel_1 = require("../../../models/qr-flow/qrModel");
const mongoose_1 = __importDefault(require("mongoose"));
exports.getCustomerData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search } = req.query;
    const query = {};
    if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
            { firstName: regex },
            { lastName: regex },
            { mobileNumber: regex },
        ];
    }
    const users = yield user_1.User.find(query).select('firstName lastName email roles totalNumberOfQRsGenerated digitalWalletCoins');
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Customer data fetched', true, users);
}));
exports.viewMoreCustomerData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    if (!userId) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'User ID is required', false, null, 'Missing userId');
    }
    const qrs = yield qrModel_1.QRModel.find({
        createdFor: new mongoose_1.default.Types.ObjectId(userId),
    })
        .populate('createdBy', 'firstName lastName')
        .populate('qrTypeId', 'qrName deliveryType')
        .populate('transactionId', 'status')
        .select('serialNumber qrName deliveryType qrStatus orderStatus mobileNumber vehicleNumber gstNumber textMessagesAllowed videoCallsAllowed qrUrl createdBy transactionId');
    console.log('QR is :', qrs);
    const result = qrs.map((qr) => {
        var _a, _b, _c, _d, _e;
        return ({
            qrId: qr._id,
            serialNumber: qr.serialNumber,
            qrName: ((_a = qr.qrTypeId) === null || _a === void 0 ? void 0 : _a.qrName) || '',
            qrType: ((_b = qr.qrTypeId) === null || _b === void 0 ? void 0 : _b.deliveryType) || '',
            qrStatus: qr.qrStatus,
            orderStatus: qr.orderStatus,
            vehicleNumber: qr.vehicleNumber,
            gstNumber: qr.gstNumber,
            textMessagesAllowed: qr.textMessagesAllowed,
            videoCallsAllowed: qr.videoCallsAllowed,
            qrUrl: qr.qrUrl,
            transactionStatus: ((_c = qr.transactionId) === null || _c === void 0 ? void 0 : _c.status) || 'N/A',
            createdBy: `${((_d = qr.createdBy) === null || _d === void 0 ? void 0 : _d.firstName) || ''} ${((_e = qr.createdBy) === null || _e === void 0 ? void 0 : _e.lastName) || ''}`,
        });
    });
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Detailed customer QR data fetched', true, result);
}));
exports.updateCustomerData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, firstName, lastName, roles } = req.body;
    if (!userId) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'User ID is required', false, null, 'Missing userId');
    }
    const updateFields = {};
    if (firstName)
        updateFields.firstName = firstName;
    if (lastName)
        updateFields.lastName = lastName;
    if (roles)
        updateFields.roles = roles;
    const updatedUser = yield user_1.User.findByIdAndUpdate(userId, updateFields, {
        new: true,
    });
    if (!updatedUser) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'User not found', false, null, 'Invalid userId');
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Customer data updated', true, updatedUser);
}));
exports.updateViewMoreData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { qrId, orderStatus, vehicleNumber, gstNumber } = req.body;
    if (!qrId) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'QR ID is required', false, null, 'Missing qrId');
    }
    const updateFields = {};
    if (orderStatus)
        updateFields.orderStatus = orderStatus;
    if (vehicleNumber)
        updateFields.vehicleNumber = vehicleNumber;
    if (gstNumber)
        updateFields.gstNumber = gstNumber;
    const updatedQR = yield qrModel_1.QRModel.findByIdAndUpdate(qrId, updateFields, {
        new: true,
    });
    if (!updatedQR) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'QR not found', false, null, 'Invalid qrId');
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'QR data updated successfully', true, updatedQR);
}));
