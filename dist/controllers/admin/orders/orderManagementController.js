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
exports.updateOrderInformation = exports.getAllOrderInformation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ApiResponse_1 = require("../../../config/ApiResponse");
const constants_1 = require("../../../config/constants");
const qrModel_1 = require("../../../models/qr-flow/qrModel");
const paymentTransaction_1 = require("../../../models/transaction/paymentTransaction");
const getAllOrderInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search = '', page = 1, limit = 10 } = req.body;
        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);
        const skip = (pageNumber - 1) * pageSize;
        const searchRegex = new RegExp(search, 'i');
        const searchCondition = search
            ? {
                $or: [
                    { serialNumber: { $regex: searchRegex } },
                    { customerName: { $regex: searchRegex } },
                    { mobileNumber: { $regex: searchRegex } },
                ],
            }
            : {};
        const qrData = yield qrModel_1.QRModel.aggregate([
            { $match: searchCondition },
            {
                $lookup: {
                    from: constants_1.COLLECTION_NAMES.PAYMENT_HISTORY,
                    localField: 'transactionId',
                    foreignField: '_id',
                    as: 'transaction',
                },
            },
            {
                $unwind: {
                    path: '$transaction',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    qrId: '$_id',
                    _id: 0,
                    transactionID: '$transaction.transactionId',
                    deliveryType: '$deliveryType',
                    serialNumber: 1,
                    customerName: 1,
                    phoneNumber: '$mobileNumber',
                    orderDate: {
                        $dateToString: {
                            format: '%d/%m/%Y',
                            date: '$createdAt',
                        },
                    },
                    orderStatus: 1,
                    paymentStatus: '$transaction.status',
                    qrStatus: 1,
                    vehicleNumber: 1,
                    gstNumber: 1,
                },
            },
            { $sort: { createdDate: -1 } },
            { $skip: skip },
            { $limit: pageSize },
        ]);
        const totalCount = yield qrModel_1.QRModel.countDocuments(searchCondition);
        return (0, ApiResponse_1.ApiResponse)(res, 200, 'Information fetched successfully', true, {
            total: totalCount,
            page: pageNumber,
            pageSize,
            data: qrData,
        });
    }
    catch (error) {
        console.error('Error fetching order info:', error);
        return (0, ApiResponse_1.ApiResponse)(res, 500, 'Failed fetching information', false, error);
    }
});
exports.getAllOrderInformation = getAllOrderInformation;
const updateOrderInformation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { qrId } = _a, updateFields = __rest(_a, ["qrId"]);
        if (!qrId || !mongoose_1.default.Types.ObjectId.isValid(qrId)) {
            return (0, ApiResponse_1.ApiResponse)(res, 400, 'Invalid or missing QR Id', false);
        }
        if (updateFields.paymentStatus) {
            const qr = yield qrModel_1.QRModel.findById(qrId).select('transactionId').lean();
            if (qr === null || qr === void 0 ? void 0 : qr.transactionId) {
                console.log("Payment ID : ", qr.transactionId);
                const transaction = yield paymentTransaction_1.PaymentTransaction.findByIdAndUpdate(qr.transactionId, { status: updateFields.paymentStatus }, { new: true });
                if (!transaction) {
                    return (0, ApiResponse_1.ApiResponse)(res, 404, 'Transaction not found', false);
                }
            }
        }
        const updatedDoc = yield qrModel_1.QRModel.findByIdAndUpdate(qrId, { $set: updateFields }, { new: true });
        if (!updatedDoc) {
            return (0, ApiResponse_1.ApiResponse)(res, 404, 'QR document not found', false);
        }
        return (0, ApiResponse_1.ApiResponse)(res, 200, 'Order information updated successfully', true, updatedDoc);
    }
    catch (error) {
        console.error('Error updating order info:', error);
        return (0, ApiResponse_1.ApiResponse)(res, 500, 'Failed to update order information', false, error);
    }
});
exports.updateOrderInformation = updateOrderInformation;
