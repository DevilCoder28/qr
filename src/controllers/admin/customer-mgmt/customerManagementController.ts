import expressAsyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../../../types/AuthenticatedRequest';
import { User } from '../../../models/auth/user';
import { ApiResponse } from '../../../config/ApiResponse';
import { QRModel } from '../../../models/qr-flow/qrModel';
import mongoose, { Mongoose } from 'mongoose';

export const getCustomerData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const { search } = req.query;

    const query: any = {};
    if (search) {
      const regex = new RegExp(search as string, 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { mobileNumber: regex },
      ];
    }

    const users = await User.find(query).select(
      'firstName lastName email roles totalNumberOfQRsGenerated digitalWalletCoins',
    );
    return ApiResponse(res, 200, 'Customer data fetched', true, users);
  },
);

export const viewMoreCustomerData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const { userId } = req.body;

    if (!userId) {
      return ApiResponse(
        res,
        400,
        'User ID is required',
        false,
        null,
        'Missing userId',
      );
    }

    const qrs = await QRModel.find({
      createdFor: new mongoose.Types.ObjectId(userId),
    })
      .populate('createdBy', 'firstName lastName')
      .populate('qrTypeId', 'qrName deliveryType')
      .populate('transactionId', 'status')
      .select(
        'serialNumber qrName deliveryType qrStatus orderStatus mobileNumber vehicleNumber gstNumber textMessagesAllowed videoCallsAllowed qrUrl createdBy transactionId',
      );

    console.log('QR is :', qrs);

    const result = qrs.map((qr) => ({
      qrId: qr._id,
      serialNumber: qr.serialNumber,
      qrName: (qr.qrTypeId as any)?.qrName || '',
      qrType: (qr.qrTypeId as any)?.deliveryType || '',
      qrStatus: qr.qrStatus,
      orderStatus: qr.orderStatus,
      vehicleNumber: qr.vehicleNumber,
      gstNumber: qr.gstNumber,
      textMessagesAllowed: qr.textMessagesAllowed,
      videoCallsAllowed: qr.videoCallsAllowed,
      qrUrl: qr.qrUrl,
      transactionStatus: (qr.transactionId as any)?.status || 'N/A',

      createdBy: `${(qr.createdBy as any)?.firstName || ''} ${(qr.createdBy as any)?.lastName || ''}`,
    }));

    return ApiResponse(
      res,
      200,
      'Detailed customer QR data fetched',
      true,
      result,
    );
  },
);

export const updateCustomerData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const { userId, firstName, lastName, roles } = req.body;

    if (!userId) {
      return ApiResponse(
        res,
        400,
        'User ID is required',
        false,
        null,
        'Missing userId',
      );
    }

    const updateFields: any = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (roles) updateFields.roles = roles;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return ApiResponse(
        res,
        404,
        'User not found',
        false,
        null,
        'Invalid userId',
      );
    }
    return ApiResponse(res, 200, 'Customer data updated', true, updatedUser);
  },
);

export const updateViewMoreData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const { qrId, orderStatus, vehicleNumber, gstNumber } = req.body;

    if (!qrId) {
      return ApiResponse(
        res,
        400,
        'QR ID is required',
        false,
        null,
        'Missing qrId',
      );
    }

    const updateFields: any = {};
    if (orderStatus) updateFields.orderStatus = orderStatus;
    if (vehicleNumber) updateFields.vehicleNumber = vehicleNumber;
    if (gstNumber) updateFields.gstNumber = gstNumber;

    const updatedQR = await QRModel.findByIdAndUpdate(qrId, updateFields, {
      new: true,
    });

    if (!updatedQR) {
      return ApiResponse(res, 404, 'QR not found', false, null, 'Invalid qrId');
    }

    return ApiResponse(
      res,
      200,
      'QR data updated successfully',
      true,
      updatedQR,
    );
  },
);
