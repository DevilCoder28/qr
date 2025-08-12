"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const userRoute_1 = require("./routes/userRoute");
const authRoute_1 = require("./routes/auth/authRoute");
const qrFlowRoute_1 = require("./routes/qr-flow/qrFlowRoute");
const adminRoute_1 = require("./routes/admin/adminRoute");
const callTextController_1 = require("./controllers/call-text/callTextController");
exports.apiRouter = express_1.default.Router();
exports.apiRouter.use('/user', userRoute_1.userRoute);
exports.apiRouter.use('/auth', authRoute_1.authRoute);
exports.apiRouter.use('/qr-flow', qrFlowRoute_1.qrFlowRoute);
exports.apiRouter.use('/admin', adminRoute_1.adminRoute);
exports.apiRouter.post('/qr/send-voice-reason', callTextController_1.sendVoiceReason);
exports.apiRouter.get('/twilio/forward-call', callTextController_1.forwardCall);
