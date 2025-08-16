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
exports.paymentStatusHandler = exports.paymentCallBackHandler = exports.initiatePayment = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const newQRTypeModel_1 = require("../../models/qr-flow/newQRTypeModel");
const ApiResponse_1 = require("../../config/ApiResponse");
const paymentTransaction_1 = require("../../models/transaction/paymentTransaction");
const constants_1 = require("../../config/constants");
const secrets_1 = require("../../secrets");
const createNewQRTypeController_1 = require("../qr-flow/createNewQRTypeController");
const axios_1 = __importDefault(require("axios"));
const user_1 = require("../../models/auth/user");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../config/logger"));
exports.initiatePayment = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    let { items, createdFor, shippingAddress = {}, deliveryType } = req.body;
    console.log("Items : ", items);
    const createdBy = (_a = req.data) === null || _a === void 0 ? void 0 : _a.userId;
    if (!createdFor)
        createdFor = (_b = req.data) === null || _b === void 0 ? void 0 : _b.userId;
    let totalAmount = 0;
    for (const item of items) {
        console.log('Item is : ', item);
        const qrType = yield newQRTypeModel_1.QRMetaData.findById(item.qrTypeId);
        console.log('QR Type is : ', qrType);
        if (!qrType)
            return (0, ApiResponse_1.ApiResponse)(res, 400, 'QR Type Not Found!', false, null);
        totalAmount = totalAmount + item.quantity * qrType.discountedPrice;
    }
    const transactionId = new mongoose_1.default.Types.ObjectId();
    yield paymentTransaction_1.PaymentTransaction.create({
        transactionId,
        items,
        createdBy,
        createdFor,
        deliveryType: deliveryType,
        shippingAddress,
        amount: totalAmount,
        status: constants_1.PaymentTransactionStatus.INITIATED,
    });
    // const backendUrl = NODE_ENV === 'dev' ? BACKEND_BASE_URL : BACKEND_PROD_URL;
    const backendUrl = "https://digipahchan-qr.onrender.com";
    const redirectUrl = `${backendUrl}/api/qr-flow/payment/verify-payment`;
    console.log('Backend Base URL : ', backendUrl);
    console.log('Redirection URL : ', redirectUrl);
    const user = yield user_1.User.findById(createdFor || ((_c = req.data) === null || _c === void 0 ? void 0 : _c.userId));
    try {
        const ekqrPayload = {
            key: secrets_1.EKQR_API_KEY,
            client_txn_id: transactionId.toString(),
            amount: totalAmount.toString(),
            p_info: 'QR Purchase',
            customer_name: ((_d = user === null || user === void 0 ? void 0 : user.firstName) !== null && _d !== void 0 ? _d : '' + (user === null || user === void 0 ? void 0 : user.lastName)) || 'Customer',
            customer_email: (user === null || user === void 0 ? void 0 : user.email) || 'customer@example.com',
            customer_mobile: '9999999999',
            redirect_url: redirectUrl,
        };
        console.log("Payment Payload : ", ekqrPayload);
        const response = yield axios_1.default.post('https://api.ekqr.in/api/create_order', ekqrPayload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log("Response is : ", response);
        const ekqrResponse = response.data;
        logger_1.default.info('EKQR Response', ekqrResponse);
        if (ekqrResponse.status && ((_e = ekqrResponse.data) === null || _e === void 0 ? void 0 : _e.payment_url)) {
            return (0, ApiResponse_1.ApiResponse)(res, 200, 'Payment initiated', true, ekqrResponse.data.payment_url);
        }
        else {
            logger_1.default.error('eKQR API Error:', ekqrResponse); // log full object
            return (0, ApiResponse_1.ApiResponse)(res, 500, 'Failed to initiate payment with eKQR', false, null, (ekqrResponse === null || ekqrResponse === void 0 ? void 0 : ekqrResponse.msg) || JSON.stringify(ekqrResponse));
        }
    }
    catch (error) {
        const errPayload = ((_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.data) || (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error';
        logger_1.default.error('Error initiating eKQR payment:', errPayload);
        return (0, ApiResponse_1.ApiResponse)(res, 500, 'Payment initiation failed', false, null, typeof errPayload === 'string' ? errPayload : JSON.stringify(errPayload));
    }
}));
exports.paymentCallBackHandler = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { client_txn_id: transactionId } = req.query;
    if (!transactionId)
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'Missing Txn ID', false, null);
    let isPaymentSuccess = false;
    let paymentStatusMessage = 'Payment unfulfilled';
    const transaction = yield paymentTransaction_1.PaymentTransaction.findOne({ transactionId });
    const transactionDate = transaction.createdAt;
    const year = transactionDate.getFullYear();
    const month = (transactionDate.getMonth() + 1).toString().padStart(2, '0');
    const day = transactionDate.getDate().toString().padStart(2, '0');
    const formattedTxnDate = `${day}-${month}-${year}`;
    try {
        const statusCheckPayload = {
            key: secrets_1.EKQR_API_KEY,
            client_txn_id: transactionId,
            txn_date: formattedTxnDate,
        };
        const statusCheckResponse = yield axios_1.default.post('https://api.ekqr.in/api/check_order_status', statusCheckPayload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const ekqrStatusData = statusCheckResponse.data;
        console.log('eKQR Status Check Response:', ekqrStatusData);
        if (ekqrStatusData.status === true && ((_a = ekqrStatusData.data) === null || _a === void 0 ? void 0 : _a.status) === 'success') {
            isPaymentSuccess = true;
            paymentStatusMessage = 'Payment successful';
        }
        else {
            paymentStatusMessage = ((_b = ekqrStatusData.data) === null || _b === void 0 ? void 0 : _b.status_message) || 'Payment failed or pending';
        }
    }
    catch (error) {
        logger_1.default.error('Error verifying eKQR payment status:', error.message);
        paymentStatusMessage = 'Failed to verify payment status with gateway.';
    }
    if (transaction && isPaymentSuccess) {
        transaction.status = constants_1.PaymentTransactionStatus.PAID;
        let transactionDocumentId = transaction._id;
        let items = transaction.items;
        console.log('Items : ', items);
        let createdBy = transaction.createdBy;
        let createdFor = transaction.createdFor;
        for (const item of items) {
            yield (0, createNewQRTypeController_1.createAndSaveQR)({
                qrTypeId: item.qrTypeId,
                createdBy: createdBy,
                createdFor: createdFor,
                transactionId: transactionDocumentId,
                shippingAddress: transaction === null || transaction === void 0 ? void 0 : transaction.shippingAddress,
                deliveryType: transaction.deliveryType,
                currentUserIdLoggedIn: createdFor === null || createdFor === void 0 ? void 0 : createdFor.toString()
            });
        }
        yield transaction.save();
        //TODO : Here we will send the pdfs on email.
    }
    else if (transaction) {
        transaction.status = constants_1.PaymentTransactionStatus.FAILED;
        yield transaction.save();
    }
    const frontendBaseUrl = secrets_1.NODE_ENV == 'dev' ? secrets_1.FRONTEND_BASE_URL_DEV : secrets_1.FRONTEND_BASE_URL_PROD_DOMAIN;
    const redirectFrontendUrl = `${frontendBaseUrl}/payment-status?transactionId=${transactionId}`;
    // return ApiResponse(res,200, 'Phone Pe Payment completed!', true, redirectFrontendUrl);
    return res.redirect(redirectFrontendUrl);
}));
exports.paymentStatusHandler = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { transactionId } = req.query;
    console.log("TID : ", transactionId);
    const transaction = yield paymentTransaction_1.PaymentTransaction.findOne({ transactionId });
    if (!transaction)
        return (0, ApiResponse_1.ApiResponse)(res, 400, 'No transaction found!', false, null);
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Payment information fetched successfully', true, {
        paymentStatus: transaction.status,
        items: transaction.items,
        amount: transaction.amount,
    });
}));
