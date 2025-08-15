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
exports.startCallHandler = exports.scanQrHandler = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const qrModel_1 = require("../../models/qr-flow/qrModel");
const ApiResponse_1 = require("../../config/ApiResponse");
const constants_1 = require("../../config/constants");
const user_1 = require("../../models/auth/user");
const push_1 = require("../../config/push");
/**
 * Handler for scanning a QR code
 * Sends notification to the QR owner with scan location
 */
exports.scanQrHandler = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { qrId } = req.params;
    const latitude = parseFloat(req.query.latitude) || null;
    const longitude = parseFloat(req.query.longitude) || null;
    // Fetch QR info
    const qr = yield qrModel_1.QRModel.findById(qrId)
        .populate({ path: 'createdBy', select: 'avatar' })
        .lean();
    if (!qr)
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'QR Code not found', false, null);
    let notificationSent = false;
    try {
        const ownerId = ((_b = (_a = qr.createdFor) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) ||
            ((_e = (_d = (_c = qr.createdFor) === null || _c === void 0 ? void 0 : _c._id) === null || _d === void 0 ? void 0 : _d.toString) === null || _e === void 0 ? void 0 : _e.call(_d));
        if (ownerId) {
            const owner = yield user_1.User.findById(ownerId).select('deviceTokens').lean();
            const tokens = (owner === null || owner === void 0 ? void 0 : owner.deviceTokens) || [];
            if (tokens.length) {
                yield push_1.push.notifyMany(tokens, 'QR scanned', `Your QR ${qr.serialNumber || ''} was scanned at ${latitude}, ${longitude}`, {
                    qrId: String(qr._id),
                    serialNumber: qr.serialNumber || '',
                    qrStatus: qr.qrStatus || '',
                    vehicleNumber: qr.vehicleNumber || '',
                    latitude: (latitude === null || latitude === void 0 ? void 0 : latitude.toString()) || '',
                    longitude: (longitude === null || longitude === void 0 ? void 0 : longitude.toString()) || '',
                });
                notificationSent = true;
            }
        }
    }
    catch (err) {
        console.error('Push notification error:', err);
        notificationSent = false;
    }
    if (qr.qrStatus !== constants_1.QRStatus.ACTIVE) {
        return (0, ApiResponse_1.ApiResponse)(res, 403, 'QR Code is not active', false, {
            _id: qr._id,
            serialNumber: qr.serialNumber,
            qrStatus: qr.qrStatus,
            createdByAvatar: qr.createdBy || null,
            notificationSent,
        });
    }
    const visibleFields = qr.visibleInfoFields || [];
    const visibleData = Object.fromEntries(Object.entries(qr).filter(([key]) => visibleFields.includes(key)));
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'QR scanned successfully', true, {
        qrTypeId: qr.qrTypeId,
        visibleData,
        qrStatus: qr.qrStatus,
        customerName: qr.customerName || null,
        altMobileNumber: qr.altMobileNumber || null,
        email: qr.email || null,
        vehicleNumber: qr.vehicleNumber || null,
        mobileNumber: qr.mobileNumber || null,
        textMessagesAllowed: qr.textMessagesAllowed || false,
        voiceCallsAllowed: qr.voiceCallsAllowed || false,
        videoCallsAllowed: qr.videoCallsAllowed || false,
        createdByAvatar: qr.createdBy || null,
        notificationSent,
        latitude,
        longitude,
    });
}));
/**
 * Handler to initiate a video call
 * Sends incoming call notification to driver with a unique roomId
 */
exports.startCallHandler = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { qrId, userName } = req.body;
    if (!qrId || !userName) {
        return res.status(400).json({ message: 'qrId and userName are required' });
    }
    // Fetch QR info
    const qr = yield qrModel_1.QRModel.findById(qrId)
        .populate({ path: 'createdFor', select: 'deviceTokens' })
        .lean();
    if (!qr)
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'QR Code not found', false, null);
    if (qr.qrStatus !== constants_1.QRStatus.ACTIVE) {
        return (0, ApiResponse_1.ApiResponse)(res, 403, 'QR Code is not active', false, null);
    }
    const roomId = Math.random().toString(36).substring(2, 10); // generate random 8-char roomId
    let notificationSent = false;
    try {
        const driver = qr.createdFor;
        const tokens = (driver === null || driver === void 0 ? void 0 : driver.deviceTokens) || [];
        if (tokens.length) {
            yield push_1.push.notifyMany(tokens, 'Incoming Video Call', `${userName} wants to video call`, { roomId, userName });
            notificationSent = true;
        }
    }
    catch (err) {
        console.error('Push notification error:', err);
        notificationSent = false;
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Call initiated', true, { roomId, notificationSent });
}));
