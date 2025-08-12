import expressAsyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../../../types/AuthenticatedRequest';
import { Response } from 'express';
import { QRModel } from '../../../models/qr-flow/qrModel';
import {
  COLLECTION_NAMES,
  DeliveryType,
  PaymentTransactionStatus,
  QRStatus,
} from '../../../config/constants';
import { User } from '../../../models/auth/user';
import { UserRoles } from '../../../enums/enums';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { PaymentTransaction } from '../../../models/transaction/paymentTransaction';
import { ApiResponse } from '../../../config/ApiResponse';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore)

export const adminAnalytics = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const deliveryTypeResult = await QRModel.aggregate([
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

    const statusCounts = await QRModel.aggregate([
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

    const qrTypePerformance = await QRModel.aggregate([
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
          from: COLLECTION_NAMES.QR_TYPES_META_DATA,
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

    const salesPersonData = await User.aggregate([
      {
        $match: {
          roles: { $in: [UserRoles.SALESPERSON] },
        },
      },

      {
        $lookup: {
          from: COLLECTION_NAMES.GENERATED_QRS,
          let: { userId: '$_id' },
          pipeline: [
            {
              $lookup: {
                from: COLLECTION_NAMES.QR_TYPES_META_DATA,
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
                        DeliveryType.BULK_GENERATION,
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
                cond: { $eq: ['$$qr.qrStatus', QRStatus.ACTIVE] },
              },
            },
          },
          inactiveCount: {
            $size: {
              $filter: {
                input: '$bulkQRs',
                as: 'qr',
                cond: { $eq: ['$$qr.qrStatus', QRStatus.INACTIVE] },
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
    return ApiResponse(res, 200, "Information fetched successfully", true,{
        qrTypePerformance : qrTypePerformance,
        statusCounts : statusCounts,
        deliveryTypeResult : deliveryTypeResult,
        salesPersonData : salesPersonData
    })
  },
);

export const rangedRevenue = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { startDateStr, endDateStr } = req.body;

    const tz = 'Asia/Kolkata';
    const start = dayjs.tz(startDateStr, 'DD-MM-YYYY', tz).startOf('day');
    const end = dayjs.tz(endDateStr, 'DD-MM-YYYY', tz).endOf('day');

    const dailyRevenueRaw = await PaymentTransaction.aggregate([
      {
        $match: {
          status: PaymentTransactionStatus.PAID,
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
    const revenueMap = new Map<string, number>();
    for (const entry of dailyRevenueRaw) {
      revenueMap.set(entry._id, entry.dailyRevenue);
    }

    // Fill in missing dates
    const dailyRevenueData: { date: string; dailyRevenue: number }[] = [];
    let current = start.clone();
    while (current.isSameOrBefore(end, 'day')) {
      const dateStr = current.format('DD-MM-YYYY');
      dailyRevenueData.push({
        date: dateStr,
        dailyRevenue: revenueMap.get(dateStr) || 0,
      });
      current = current.add(1, 'day');
    }

    const accumulatedRevenue = dailyRevenueData.reduce(
      (acc, entry) => acc + entry.dailyRevenue,
      0,
    );

    const result = {
      dailyRevenueData,
      accumulatedRevenue,
    };

    return ApiResponse(res, 200, 'Revenue fetched successfully', true, result);
  },
);

export const weeklyRevenueTrend = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { startDateStr, endDateStr } = req.body;

    const startDate = dayjs
      .tz(startDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
      .startOf('day');
    const endDate = dayjs
      .tz(endDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
      .endOf('day');

    const transactions = await PaymentTransaction.aggregate([
      {
        $match: {
          status: PaymentTransactionStatus.PAID,
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

    const weeklyMap = new Map<string, number>();
    for (const txn of transactions) {
      const txnDate = dayjs.tz(txn.istDate, 'YYYY-MM-DD', 'Asia/Kolkata');
      const weekStart = txnDate.startOf('week');
      const weekEnd = txnDate.endOf('week');
      const key = `${weekStart.format('DD-MM-YYYY')} - ${weekEnd.format('DD-MM-YYYY')}`;
      weeklyMap.set(key, (weeklyMap.get(key) || 0) + txn.amount);
    }

    const weeklyTrend: Record<string, number> = {};
    let current = startDate.startOf('week');
    while (current.isSameOrBefore(endDate, 'day')) {
      const weekStart = current.clone().startOf('week');
      const weekEnd = current.clone().endOf('week');
      const key = `${weekStart.format('DD-MM-YYYY')} - ${weekEnd.format('DD-MM-YYYY')}`;
      weeklyTrend[key] = weeklyMap.get(key) || 0;
      current = current.add(1, 'week');
    }

    return ApiResponse(res, 200, 'Weekly revenue trend fetched', true, weeklyTrend);
  }
);

export const monthlyRevenueTrend = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { startDateStr, endDateStr } = req.body;

    const startDate = dayjs
      .tz(startDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
      .startOf('day');
    const endDate = dayjs
      .tz(endDateStr, 'DD-MM-YYYY', 'Asia/Kolkata')
      .endOf('day');

    const transactions = await PaymentTransaction.aggregate([
      {
        $match: {
          status: PaymentTransactionStatus.PAID,
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

    const monthlyMap = new Map<string, number>();
    for (const txn of transactions) {
      const txnDate = dayjs.tz(txn.istDate, 'YYYY-MM-DD', 'Asia/Kolkata');
      const monthStart = txnDate.startOf('month');
      const monthEnd = txnDate.endOf('month');
      const key = `${monthStart.format('DD-MM-YYYY')} - ${monthEnd.format('DD-MM-YYYY')}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + txn.amount);
    }

    const monthlyTrend: Record<string, number> = {};
    let current = startDate.startOf('month');
    while (current.isSameOrBefore(endDate, 'month')) {
      const monthStart = current.clone().startOf('month');
      const monthEnd = current.clone().endOf('month');
      const key = `${monthStart.format('DD-MM-YYYY')} - ${monthEnd.format('DD-MM-YYYY')}`;
      monthlyTrend[key] = monthlyMap.get(key) || 0;
      current = current.add(1, 'month');
    }

    return ApiResponse(res, 200, 'Monthly revenue trend fetched', true, monthlyTrend);
  }
);
