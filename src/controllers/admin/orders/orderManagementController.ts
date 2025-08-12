import mongoose from 'mongoose';
import { ApiResponse } from '../../../config/ApiResponse';
import { COLLECTION_NAMES } from '../../../config/constants';
import { QRModel } from '../../../models/qr-flow/qrModel';
import { AuthenticatedRequest } from '../../../types/AuthenticatedRequest';
import { Response } from 'express';
import { PaymentTransaction } from '../../../models/transaction/paymentTransaction';

export const getAllOrderInformation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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

    const qrData = await QRModel.aggregate([
      { $match: searchCondition },
      {
        $lookup: {
          from: COLLECTION_NAMES.PAYMENT_HISTORY,
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

    const totalCount = await QRModel.countDocuments(searchCondition);

    return ApiResponse(res, 200, 'Information fetched successfully', true, {
      total: totalCount,
      page: pageNumber,
      pageSize,
      data: qrData,
    });
  } catch (error) {
    console.error('Error fetching order info:', error);
    return ApiResponse(res, 500, 'Failed fetching information', false, error);
  }
};

export const updateOrderInformation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { qrId, ...updateFields } = req.body;

    if (!qrId || !mongoose.Types.ObjectId.isValid(qrId)) {
      return ApiResponse(res, 400, 'Invalid or missing QR Id', false);
    }

   if (updateFields.paymentStatus) {
      const qr = await QRModel.findById(qrId).select('transactionId').lean();

      if (qr?.transactionId) {
        console.log("Payment ID : ", qr.transactionId); 
        const transaction = await PaymentTransaction.findByIdAndUpdate(
          qr.transactionId,
          { status: updateFields.paymentStatus },
          { new: true }
        );

        if (!transaction) {
          return ApiResponse(res, 404, 'Transaction not found', false);
        }
      }
    }

    const updatedDoc = await QRModel.findByIdAndUpdate(
      qrId,
      { $set: updateFields },
      { new: true },
    );

    if (!updatedDoc) {
      return ApiResponse(res, 404, 'QR document not found', false);
    }

    return ApiResponse(
      res,
      200,
      'Order information updated successfully',
      true,
      updatedDoc,
    );
  } catch (error) {
    console.error('Error updating order info:', error);
    return ApiResponse(
      res,
      500,
      'Failed to update order information',
      false,
      error,
    );
  }
};
