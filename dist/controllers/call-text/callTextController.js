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
exports.sendVoiceReason = exports.sendTextReason = exports.forwardCall = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const __1 = require("../..");
const qrModel_1 = require("../../models/qr-flow/qrModel");
const ApiResponse_1 = require("../../config/ApiResponse");
const newQRTypeModel_1 = require("../../models/qr-flow/newQRTypeModel");
const secrets_1 = require("../../secrets");
const twilio_1 = require("twilio");
const forwardCall = (req, res) => {
    const { to, reason, qrName } = req.query;
    const voice = new twilio_1.twiml.VoiceResponse();
    voice.say({ voice: 'alice' }, `Connecting your call for reason: ${reason}`);
    voice.pause({ length: 1 });
    voice.say({ voice: 'alice' }, `Reason: ${reason}`);
    voice.pause({ length: 1 });
    voice.dial(to);
    res.type('text/xml');
    res.send(voice.toString());
};
exports.forwardCall = forwardCall;
const normalizePhone = (phone) => {
    if (phone) {
        const cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+') && /^\+\d{10,15}$/.test(cleaned)) {
            return cleaned;
        }
        const digits = cleaned.replace(/\D/g, '');
        if (digits.length === 10)
            return '+91' + digits;
        if (digits.length === 12 && digits.startsWith('91'))
            return '+' + digits;
        return null;
    }
    return null;
};
exports.sendTextReason = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { qrId, reason } = req.body;
    const qr = yield qrModel_1.QRModel.findById(qrId);
    if (!(qr === null || qr === void 0 ? void 0 : qr.textMessagesAllowed)) {
        return (0, ApiResponse_1.ApiResponse)(res, 404, 'Sorry, QR Owner has disabled sending information via text messages.', false, null);
    }
    const qrName = yield newQRTypeModel_1.QRMetaData.findById(qr === null || qr === void 0 ? void 0 : qr.qrTypeId);
    const phoneNumber = normalizePhone(qr === null || qr === void 0 ? void 0 : qr.mobileNumber);
    if (phoneNumber) {
        const abc = yield __1.twilioClient.messages.create({
            body: `Someone tried reaching out to you via DigiPehchan for QR : ${qrName}, Reason : ${reason}`,
            from: secrets_1.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });
        if (abc)
            return (0, ApiResponse_1.ApiResponse)(res, 200, 'Your Message is successfully delivered.', true, abc);
    }
    return (0, ApiResponse_1.ApiResponse)(res, 400, 'Error occurred sending message, Phone Number of QR Owner is not registered.', false, null);
}));
exports.sendVoiceReason = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { qrId, reason, finderPhone } = req.body;
    if (!qrId || !reason || !finderPhone) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'qrId, reason, and finderPhone are required.', false);
    }
    const qr = yield qrModel_1.QRModel.findById(qrId);
    if (!(qr === null || qr === void 0 ? void 0 : qr.voiceCallsAllowed)) {
        return (0, ApiResponse_1.ApiResponse)(res, 403, 'Voice calls are disabled for this QR by the owner.', false, null);
    }
    const qrNameDoc = yield newQRTypeModel_1.QRMetaData.findById(qr === null || qr === void 0 ? void 0 : qr.qrTypeId);
    const qrName = (qrNameDoc === null || qrNameDoc === void 0 ? void 0 : qrNameDoc.qrName) || 'your item';
    const ownerPhone = normalizePhone(qr === null || qr === void 0 ? void 0 : qr.mobileNumber);
    const formattedFinderPhone = normalizePhone(finderPhone);
    if (!ownerPhone) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'QR Owner phone number is not registered.', false);
    }
    if (!formattedFinderPhone) {
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'Finder phone number is invalid.', false);
    }
    const twimlUrl = `${secrets_1.BACKEND_PROD_URL}/api/twilio/forward-call?to=${ownerPhone}&reason=${encodeURIComponent(reason)}&qrName=${encodeURIComponent(qrName)}`;
    const call = yield __1.twilioClient.calls.create({
        url: twimlUrl,
        to: formattedFinderPhone,
        from: secrets_1.TWILIO_PHONE_NUMBER,
    });
    if (call) {
        return (0, ApiResponse_1.ApiResponse)(res, 200, 'Masked voice call initiated successfully.', true, { sid: call.sid });
    }
    return (0, ApiResponse_1.ApiResponse)(res, 500, 'Failed to initiate call.', false, null);
}));
