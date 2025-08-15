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
exports.push = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
function initAdmin() {
    var _a;
    if (firebase_admin_1.default.apps.length)
        return;
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is missing");
    }
    console.log("FIREBASE_SERVICE_ACCOUNT_BASE64 length:", (_a = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) === null || _a === void 0 ? void 0 : _a.length);
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8"));
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
    });
}
initAdmin();
exports.push = {
    notifyMany: (tokens, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(tokens === null || tokens === void 0 ? void 0 : tokens.length))
            return;
        // Add datetime to the data payload
        const payloadData = Object.assign(Object.assign({}, data), { timestamp: new Date().toISOString() });
        const res = yield firebase_admin_1.default.messaging().sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: payloadData, // send datetime in data
        });
        console.log('FCM result:', {
            successCount: res.successCount,
            failureCount: res.failureCount,
        });
        // log per token error and remove invalid tokens
        const failedTokens = [];
        res.responses.forEach((r, i) => {
            if (!r.success) {
                console.error('FCM error for token:', tokens[i], r.error);
                failedTokens.push(tokens[i]);
            }
        });
        return res;
    }),
};
