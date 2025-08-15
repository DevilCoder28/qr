import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { QRModel } from '../../models/qr-flow/qrModel';
import { ApiResponse } from '../../config/ApiResponse';
import { QRStatus } from '../../config/constants';
import { User } from '../../models/auth/user';
import { push } from '../../config/push';

export const scanQrHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { qrId } = req.params;
    const { latitude, longitude } = req.query;
// <-- new

    const qr = await QRModel.findById(qrId)
      .populate({
        path: 'createdBy',
        select: 'avatar', 
      })
      .lean();

    if (!qr) {
      return ApiResponse(res, 404, 'QR Code not found', false, null);
    }

    let notificationSent = false;

    try {
      const ownerId =
        (qr as any).createdFor?.toString?.() ||
        (qr as any).createdFor?._id?.toString?.();

      if (ownerId) {
        const owner = await User.findById(ownerId)
          .select('deviceTokens')
          .lean();
        const tokens = owner?.deviceTokens || [];

        if (tokens.length) {
          await push.notifyMany(
            tokens,
            'QR scanned',
            `Your QR ${qr.serialNumber || ''} was scanned at ${latitude}, ${longitude}`, // include location in message
            {
              qrId: String((qr as any)._id),
              serialNumber: qr.serialNumber || '',
              qrStatus: qr.qrStatus || '',
              vehicleNumber: qr.vehicleNumber || '',
              latitude: latitude?.toString() || '',
              longitude: longitude?.toString() || '',
            },
          );
          notificationSent = true;
        }
      }
    } catch (err) {
      console.error("Push notification error:", err);
      notificationSent = false;
    }

    if (qr.qrStatus !== QRStatus.ACTIVE) {
      return ApiResponse(res, 403, 'QR Code is not active', false, {
        _id: qr._id,
        serialNumber: qr.serialNumber,
        qrStatus: qr.qrStatus,
        createdByAvatar: qr.createdBy || null,
        notificationSent,
      });
    }

    const visibleFields = qr.visibleInfoFields || [];
    const visibleData = Object.fromEntries(
      Object.entries(qr).filter(([key]) => visibleFields.includes(key)),
    );

    return ApiResponse(res, 200, 'QR scanned successfully', true, {
      qrTypeId: qr.qrTypeId,
      visibleData,
      qrStatus: qr.qrStatus,
      customerName: qr.customerName || null,
      altMobileNumber: qr.altMobileNumber || null,
      email: qr.email || null,
      vehicleNumber: qr.vehicleNumber || null,
      mobileNumber: qr.mobileNumber || null,
      textMessagesAllowed: qr.textMessagesAllowed || false,
      voiceCallsAllowed: qr.voiceCallsAllowed || false,
      videoCallsAllowed: qr.videoCallsAllowed || false,
      createdByAvatar: qr.createdBy || null,
      notificationSent,
      latitude: latitude || null, // optional in response
      longitude: longitude || null,
    });
  }
);
