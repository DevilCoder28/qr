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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const secrets_1 = require("../secrets");
const logger_1 = __importDefault(require("./logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch")); // If not installed: npm install node-fetch
const transport = nodemailer_1.default.createTransport({
    host: secrets_1.NODEMAILER_HOST,
    port: Number(secrets_1.NODEMAILER_PORT),
    secure: true,
    auth: {
        user: secrets_1.NODEMAILER_SENDER_ADDRESS,
        pass: secrets_1.NODEMAILER_GMAIL_APP_PASSWORD,
    },
});
const isURL = (str) => /^https?:\/\//.test(str);
const sendEmail = (to_1, subject_1, text_1, html_1, ...args_1) => __awaiter(void 0, [to_1, subject_1, text_1, html_1, ...args_1], void 0, function* (to, subject, text, html, attachmentPaths = []) {
    const delay = 2000;
    const sendEmailRetries = secrets_1.SEND_EMAIL_RETRIES;
    const attachments = yield Promise.all(attachmentPaths.map((filePath) => __awaiter(void 0, void 0, void 0, function* () {
        if (isURL(filePath)) {
            const response = yield (0, node_fetch_1.default)(filePath);
            if (!response.ok) {
                throw new Error(`Failed to download attachment: ${filePath}`);
            }
            const arrayBuffer = yield response.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);
            return {
                filename: path_1.default.basename(filePath.split('?')[0]),
                content: pdfBuffer,
                contentType: 'application/pdf',
            };
        }
        else {
            return {
                filename: path_1.default.basename(filePath),
                content: fs_1.default.readFileSync(filePath),
                contentType: 'application/pdf',
            };
        }
    })));
    const mailOptions = Object.assign({ from: secrets_1.NODEMAILER_SENDER_ADDRESS, to,
        subject,
        text,
        html }, (attachments.length > 0 && { attachments }));
    let attempts = 0;
    while (attempts < sendEmailRetries) {
        try {
            const info = yield transport.sendMail(mailOptions);
            logger_1.default.info(`Mail sent successfully: ${info.response}`);
            return;
        }
        catch (err) {
            attempts++;
            logger_1.default.error(`Attempt ${attempts}: Error in sending email - ${err}`);
            if (attempts < sendEmailRetries) {
                logger_1.default.info(`Retrying... Attempt ${attempts + 1} in ${delay / 1000}s`);
                yield new Promise((resolve) => setTimeout(resolve, delay));
            }
            else {
                logger_1.default.error('Max retry attempts reached. Could not send email.');
            }
        }
    }
});
exports.sendEmail = sendEmail;
