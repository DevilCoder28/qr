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
exports.monthlyRevenueTrend = exports.weeklyRevenueTrend = exports.rangedRevenue = exports.adminAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const qrModel_1 = require("../../../models/qr-flow/qrModel");
const constants_1 = require("../../../config/constants");
const user_1 = require("../../../models/auth/user");
const enums_1 = require("../../../enums/enums");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore"));
const paymentTransaction_1 = require("../../../models/transaction/paymentTransaction");
const ApiResponse_1 = require("../../../config/ApiResponse");
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(customParseFormat_1.default);
dayjs_1.default.extend(isSameOrBefore_1.default);
exports.adminAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deliveryTypeResult = yield qrModel_1.QRModel.aggregate([
        {
            $group: {
                _id: '$deliveryType',
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                deliveryType: '$_id',
                count: 1,
            },
        },
    ]);
    const statusCounts = yield qrModel_1.QRModel.aggregate([
        {
            $group: {
                _id: '$qrStatus',
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                qrStatus: '$_id',
                count: '$count',
            },
        },
    ]);
    const qrTypePerformance = yield qrModel_1.QRModel.aggregate([
        {
            $group: {
                _id: '$qrTypeId',
                totalGenerated: { $sum: 1 },
                activeCount: {
                    $sum: {
                        $cond: [{ $eq: ['$qrStatus', 'ACTIVE'] }, 1, 0],
                    },
                },
                inactiveCount: {
                    $sum: {
                        $cond: [{ $eq: ['$qrStatus', 'INACTIVE'] }, 1, 0],
                    },
                },
            },
        },
        {
            $lookup: {
                from: constants_1.COLLECTION_NAMES.QR_TYPES_META_DATA,
                localField: '_id',
                foreignField: '_id',
                as: 'qrType',
            },
        },
        {
            $unwind: '$qrType',
        },
        {
            $project: {
                _id: 0,
                qrTypeId: '$_id',
                qrName: '$qrType.qrName',
                //   deliveryTypes: '$qrType.deliveryType',
                totalGenerated: 1,
                activeCount: 1,
                inactiveCount: 1,
            },
        },
        {
            $sort: { totalGenerated: -1 }, //Sort by usage
        },
    ]);
    const salesPersonData = yield user_1.User.aggregate([
        {
            $match: {
                roles: { $in: [enums_1.UserRoles.SALESPERSON] },
            },
        },
        {
            $lookup: {
                from: constants_1.COLLECTION_NAMES.GENERATED_QRS,
                let: { userId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: constants_1.COLLECTION_NAMES.QR_TYPES_META_DATA,
                            localField: 'qrTypeId',
                            foreignField: '_id',
                            as: 'qrType',
                        },
                    },
                    { $unwind: '$qrType' },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$createdFor', '$$userId'] },
                                    {
                                        $in: [
                                            constants_1.DeliveryType.BULK_GENERATION,
                                            '$qrType.deliveryType',
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: 'bulkQRs',
            },
        },
        {
            $addFields: {
                totalGenerated: { $size: '$bulkQRs' },
                activeCount: {
                    $size: {
                        $filter: {
                            input: '$bulkQRs',
                            as: 'qr',
                            cond: { $eq: ['$$qr.qrStatus', constants_1.QRStatus.ACTIVE] },
                        },
                    },
                },
                inactiveCount: {
                    $size: {
                        $filter: {
                            input: '$bulkQRs',
                            as: 'qr',
                            cond: { $eq: ['$$qr.qrStatus', constants_1.QRStatus.INACTIVE] },
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                userId: '$_id',
                name: {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ['$firstName', ''] },
                                ' ',
                                { $ifNull: ['$lastName', ''] },
                            ],
                        },
                    },
                },
                email: '$email',
                totalGenerated: 1,
                activeCount: 1,
                inactiveCount: 1,
            },
        },
        {
            $sort: { totalGenerated: -1 },
        },
    ]);
    console.log('QR Type Performance : ', qrTypePerformance);
    console.log('Status Counts : ', statusCounts);
    console.log('Delivery Type Result is : ', deliveryTypeResult);
    console.log('Salesperson Performance : ', salesPersonData);
    return (0, ApiResponse_1.ApiResponse)(res, 200, "Information fetched successfully", true, {
        qrTypePerformance: qrTypePerformance,
        statusCounts: statusCounts,
        deliveryTypeResult: deliveryTypeResult,
        salesPersonData: salesPersonData
    });
}));
exports.rangedRevenue = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDateStr, endDateStr } = req.body;
    const tz = 'Asia/Kolkata';
    const start = dayjs_1.default.tz(startDateStr, 'DD-MM-YYYY', tz).startOf('day');
    const end = dayjs_1.default.tz(endDateStr, 'DD-MM-YYYY', tz).endOf('day');
    const dailyRevenueRaw = yield paymentTransaction_1.PaymentTransaction.aggregate([
        {
            $match: {
                status: constants_1.PaymentTransactionStatus.PAID,
                createdAt: {
                    $gte: start.toDate(),
                    $lte: end.toDate(),
                },
            },
        },
        {
            $addFields: {
                istDate: {
                    $dateToString: {
                        date: { $add: ['$createdAt', 19800000] }, // Add 5.5 hours in ms for UTC settlement
                        format: '%d-%m-%Y',
                    },
                },
            },
        },
        {
            $group: {
                _id: '$istDate',
                dailyRevenue: { $sum: '$amount' },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);
    // Convert raw data into map for fast lookup
    const revenueMap = new Map();
    for (const entry of dailyRevenueRaw) {
        revenueMap.set(entry._id, entry.dailyRevenue);
    }
    // Fill in missing dates
    const dailyRevenueData = [];
    let current = start.clone();
    while (current.isSameOrBefore(end, 'day')) {
        const dateStr = current.format('DD-MM-YYYY');
        dailyRevenueData.push({
            date: dateStr,
            dailyRevenue: revenueMap.get(dateStr) || 0,
        });
        current = current.add(1, 'day');
    }
    const accumulatedRevenue = dailyRevenueData.reduce((acc, entry) => acc + entry.dailyRevenue, 0);
    const result = {
        dailyRevenueData,
        accumulatedRevenue,
    };
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Revenue fetched successfully', true, result);
}));
exports.weeklyRevenueTrend = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDateStr, endDateStr } = req.body;
    const startDate = dayjs_1.default
        .tz(startDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
        .startOf('day');
    const endDate = dayjs_1.default
        .tz(endDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
        .endOf('day');
    const transactions = yield paymentTransaction_1.PaymentTransaction.aggregate([
        {
            $match: {
                status: constants_1.PaymentTransactionStatus.PAID,
                createdAt: {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate(),
                },
            },
        },
        {
            $addFields: {
                istCreatedAt: {
                    $add: ['$createdAt', 19800000],
                },
            },
        },
        {
            $project: {
                amount: 1,
                istDate: {
                    $dateToString: {
                        date: '$istCreatedAt',
                        format: '%Y-%m-%d',
                    },
                },
            },
        },
    ]);
    const weeklyMap = new Map();
    for (const txn of transactions) {
        const txnDate = dayjs_1.default.tz(txn.istDate, 'YYYY-MM-DD', 'Asia/Kolkata');
        const weekStart = txnDate.startOf('week');
        const weekEnd = txnDate.endOf('week');
        const key = `${weekStart.format('DD-MM-YYYY')} - ${weekEnd.format('DD-MM-YYYY')}`;
        weeklyMap.set(key, (weeklyMap.get(key) || 0) + txn.amount);
    }
    const weeklyTrend = {};
    let current = startDate.startOf('week');
    while (current.isSameOrBefore(endDate, 'day')) {
        const weekStart = current.clone().startOf('week');
        const weekEnd = current.clone().endOf('week');
        const key = `${weekStart.format('DD-MM-YYYY')} - ${weekEnd.format('DD-MM-YYYY')}`;
        weeklyTrend[key] = weeklyMap.get(key) || 0;
        current = current.add(1, 'week');
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Weekly revenue trend fetched', true, weeklyTrend);
}));
exports.monthlyRevenueTrend = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDateStr, endDateStr } = req.body;
    const startDate = dayjs_1.default
        .tz(startDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
        .startOf('day');
    const endDate = dayjs_1.default
        .tz(endDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
        .endOf('day');
    const transactions = yield paymentTransaction_1.PaymentTransaction.aggregate([
        {
            $match: {
                status: constants_1.PaymentTransactionStatus.PAID,
                createdAt: {
                    $gte: startDate.toDate(),
                    $lte: endDate.toDate(),
                },
            },
        },
        {
            $addFields: {
                istCreatedAt: {
                    $add: ['$createdAt', 19800000],
                },
            },
        },
        {
            $project: {
                amount: 1,
                istDate: {
                    $dateToString: {
                        date: '$istCreatedAt',
                        format: '%Y-%m-%d',
                    },
                },
            },
        },
    ]);
    const monthlyMap = new Map();
    for (const txn of transactions) {
        const txnDate = dayjs_1.default.tz(txn.istDate, 'YYYY-MM-DD', 'Asia/Kolkata');
        const monthStart = txnDate.startOf('month');
        const monthEnd = txnDate.endOf('month');
        const key = `${monthStart.format('DD-MM-YYYY')} - ${monthEnd.format('DD-MM-YYYY')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + txn.amount);
    }
    const monthlyTrend = {};
    let current = startDate.startOf('month');
    while (current.isSameOrBefore(endDate, 'month')) {
        const monthStart = current.clone().startOf('month');
        const monthEnd = current.clone().endOf('month');
        const key = `${monthStart.format('DD-MM-YYYY')} - ${monthEnd.format('DD-MM-YYYY')}`;
        monthlyTrend[key] = monthlyMap.get(key) || 0;
        current = current.add(1, 'month');
    }
    return (0, ApiResponse_1.ApiResponse)(res, 200, 'Monthly revenue trend fetched', true, monthlyTrend);
}));
