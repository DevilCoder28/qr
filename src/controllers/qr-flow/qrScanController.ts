import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { QRModel } from '../../models/qr-flow/qrModel';
import { ApiResponse } from '../../config/ApiResponse';
import { QRStatus } from '../../config/constants';

export const scanQrHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { qrId } = req.params;

    const qr = await QRModel.findById(qrId)
    .populate({
      path: 'createdBy',
      select: 'avatar'      // Only fetch the 'avatar' field from the User document
    })
    .lean();   


    if (!qr) {
      return ApiResponse(res, 404, 'QR Code not found', false, null);
    }

    if (qr.qrStatus !== QRStatus.ACTIVE) {
      return ApiResponse(res, 403, 'QR Code is not active', false, null);
    }

    const visibleFields = qr.visibleInfoFields || [];

    const visibleData = Object.fromEntries(
      Object.entries(qr).filter(([key]) => visibleFields.includes(key)),
    );

    // console.log("Visible Data : ", visibleData);

    return ApiResponse(res, 200, 'QR scanned successfully', true, {
      qrTypeId : qr.qrTypeId, 
      visibleData,
      qrStatus: qr.qrStatus,
      createdByAvatar: qr.createdBy || null,
    });
  },
);
