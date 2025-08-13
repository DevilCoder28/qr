import expressAsyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { Response } from 'express';
import { QRModel } from '../../models/qr-flow/qrModel';
import { ApiResponse } from '../../config/ApiResponse';
import { QRStatus } from '../../config/constants';
import { PaymentTransaction } from '../../models/transaction/paymentTransaction';
import {
  IQRUpdateSchema,
  qrUpdateSchema,
} from '../../validators/qr-flow/qrSchema';

export const checkQRValidity = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { serialNumber } = req.body;
    const QR = await QRModel.findOne({ serialNumber: serialNumber });
    if (!QR)
      return ApiResponse(
        res,
        400,
        'No QR found with this serial number',
        false,
        null,
      );

    if (QR.qrStatus === QRStatus.INACTIVE)
      return ApiResponse(res, 200, 'The QR is not yet activated.', true, {
        qrStatus: QR.qrStatus,
      });

    const transactionId = QR?.transactionId;

    const transaction = await PaymentTransaction.findById(transactionId);

    if (!transaction)
      return ApiResponse(
        res,
        200,
        'No Valid Transaction found for this one!',
        true,
        {
          qrStatus: QR.qrStatus,
        },
      );

    return ApiResponse(res, 200, 'QR Information fetched successfully', true, {
      qrInfo: QR,
      transaction: transaction,
    });
  },
);

export const updateQRBySerialNumberHandler = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const qrInfo: IQRUpdateSchema = req.body;

    const validation = qrUpdateSchema.safeParse(qrInfo);
    console.log("Validation Error : ", validation.error);
    if (!validation.success)
      return ApiResponse(res, 400, 'Error occurred in validation', false, null);

    const { serialNumber, ...updateData } = validation.data;

    const updatedQR = await QRModel.findOneAndUpdate(
      { serialNumber },
      {
        $set: {
          ...updateData,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedQR) {
      return ApiResponse(
        res,
        404,
        'QR with given serial number not found.',
        false,
        null,
      );
    }

    return ApiResponse(res, 200, 'QR updated successfully.', true, updatedQR);
  },
);
