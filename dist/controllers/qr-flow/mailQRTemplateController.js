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
exports.mailQR = exports.mailQRTemplate = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const generateQRPDF_1 = require("../../helpers/generateQRPDF");
const ApiResponse_1 = require("../../config/ApiResponse");
const user_1 = require("../../models/auth/user");
const mailer_1 = require("../../config/mailer");
const secrets_1 = require("../../secrets");
const templateRenderer_1 = require("../../utils/templateRenderer");
const enums_1 = require("../../enums/enums");
const constants_1 = require("../../config/constants");
exports.mailQRTemplate = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { serialNumber, qrUrl } = req.body;
    const isMailSent = yield (0, exports.mailQR)(serialNumber, qrUrl, (_a = req.data) === null || _a === void 0 ? void 0 : _a.userId);
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'QR Code Generation is completed and Email is Sent', true, isMailSent);
}));
const mailQR = (serialNumber, qrUrl, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isPDFGenerated = yield (0, generateQRPDF_1.generateQRPDFAndUploadToCloudinary)(serialNumber, qrUrl, '/qrcode-pdfs');
        console.log("Is PDF generated : ", isPDFGenerated);
        if (isPDFGenerated) {
            // console.log(req.data);
            // const userId = req.data?.userId;
            console.log('User ID : ', userId);
            const user = yield user_1.User.findById(userId);
            if (user && user.email) {
                const attachmentPath = isPDFGenerated;
                const feUrl = secrets_1.NODE_ENV == 'dev'
                    ? secrets_1.FRONTEND_BASE_URL_DEV
                    : secrets_1.FRONTEND_BASE_URL_PROD_DOMAIN;
                const activationLink = `${feUrl}/qr/check-validity`;
                const emailContent = {
                    user_name: user.firstName,
                    serial_number: serialNumber,
                    download_link: qrUrl,
                    activation_link: activationLink,
                    app_name: constants_1.APP_NAME,
                };
                const { html, text } = yield (0, templateRenderer_1.renderTemplate)(enums_1.MailTemplate.QR_CODE, emailContent);
                yield (0, mailer_1.sendEmail)(user.email, 'Your QR Code PDF is Ready', text, html, [
                    isPDFGenerated,
                ]);
            }
        }
        return true;
    }
    catch (error) {
        console.log('Error occurred in mailing PDF!');
        console.log('Error is : ', error.message);
        return false;
    }
});
exports.mailQR = mailQR;
