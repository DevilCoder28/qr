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
exports.verifyPhonePeTransactionStatus = exports.PhonePePaymentInit = void 0;
const crypto_1 = __importDefault(require("crypto"));
const secrets_1 = require("../secrets");
const axios_1 = __importDefault(require("axios"));
const PhonePePaymentInit = (_a) => __awaiter(void 0, [_a], void 0, function* ({ amount, transactionId, redirectUrl, merchantUserId, }) {
    const merchantId = secrets_1.PHONEPE_MERCHANT_ID;
    const saltKey = secrets_1.PHONEPE_SALT_KEY;
    const saltIndex = secrets_1.PHONEPE_SALT_INDEX;
    const payload = {
        merchantId,
        transactionId,
        merchantUserId: merchantUserId,
        amount,
        redirectUrl,
        redirectMode: 'POST',
        paymentInstrument: {
            type: 'PAY_PAGE',
        },
    };
    console.log('Payload is : ', payload);
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    console.log('Base 64 Payload is : ', base64Payload);
    const signature = crypto_1.default
        .createHash('sha256')
        .update(base64Payload + '/pg/v1/pay' + saltKey)
        .digest('hex');
    console.log('Signature is : ', signature);
    const fullSignature = `${signature}###${saltIndex}`;
    console.log('Phone Pe Merchant ID : ', secrets_1.PHONEPE_MERCHANT_ID);
    try {
        console.log({
            merchantId: typeof secrets_1.PHONEPE_MERCHANT_ID,
            saltKey: typeof secrets_1.PHONEPE_SALT_KEY,
            saltIndex: typeof secrets_1.PHONEPE_SALT_INDEX,
            values: {
                merchantId: secrets_1.PHONEPE_MERCHANT_ID,
                saltKey: secrets_1.PHONEPE_SALT_KEY,
                saltIndex: secrets_1.PHONEPE_SALT_INDEX,
            },
        });
        const response = yield axios_1.default.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', { request: base64Payload }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': fullSignature,
                'X-MERCHANT-ID': secrets_1.PHONEPE_MERCHANT_ID,
            },
        });
        return response.data.data.instrumentResponse.redirectInfo.url;
    }
    catch (error) {
        console.log('error : ', error);
        console.log('Error occurred', error.message);
    }
});
exports.PhonePePaymentInit = PhonePePaymentInit;
const verifyPhonePeTransactionStatus = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantId = secrets_1.PHONEPE_MERCHANT_ID;
    const saltKey = secrets_1.PHONEPE_SALT_KEY;
    const saltIndex = secrets_1.PHONEPE_SALT_INDEX;
    const urlPath = `/pg/v1/status/${merchantId}/${transactionId}`;
    const baseUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    const fullUrl = `${baseUrl}${urlPath}`;
    const xVerify = crypto_1.default
        .createHash('sha256')
        .update(urlPath + saltKey)
        .digest('hex') + `###${saltIndex}`;
    try {
        const response = yield axios_1.default.get(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'X-MERCHANT-ID': merchantId,
            },
        });
        return response.data.data;
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
exports.verifyPhonePeTransactionStatus = verifyPhonePeTransactionStatus;
