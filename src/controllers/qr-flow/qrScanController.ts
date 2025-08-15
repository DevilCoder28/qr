import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { QRModel } from '../../models/qr-flow/qrModel';
import { ApiResponse } from '../../config/ApiResponse';
import { QRStatus } from '../../config/constants';
import { User } from '../../models/auth/user';
import { push } from '../../config/push';

/**
 * Handler for scanning a QR code
 * Sends notification to the QR owner with scan location
 */
export const scanQrHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { qrId } = req.params;
    const { latitude, longitude } = req.body; // get from body

    // Parse latitude and longitude as floats (if provided)
    const lat = latitude !== undefined ? parseFloat(latitude) : null;
    const long = longitude !== undefined ? parseFloat(longitude) : null;

    // Fetch QR info
    const qr = await QRModel.findById(qrId)
      .populate({ path: 'createdBy', select: 'avatar' })
      .lean();

    if (!qr) return ApiResponse(res, 404, 'QR Code not found', false, null);

    let notificationSent = false;

    try {
      const ownerId =
        (qr as any).createdFor?.toString?.() ||
        (qr as any).createdFor?._id?.toString?.();

      if (ownerId) {
        const owner = await User.findById(ownerId).select('deviceTokens').lean();
        const tokens = owner?.deviceTokens || [];

        if (tokens.length) {
          await push.notifyMany(
            tokens,
            'QR scanned',
            `Your QR ${qr.serialNumber || ''} was scanned at ${lat}, ${long}`,
            {
              qrId: String((qr as any)._id),
              serialNumber: qr.serialNumber || '',
              qrStatus: qr.qrStatus || '',
              vehicleNumber: qr.vehicleNumber || '',
              latitude: lat?.toString() || '',
              longitude: long?.toString() || '',
            }
          );
          notificationSent = true;
        }
      }
    } catch (err) {
      console.error('Push notification error:', err);
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
      Object.entries(qr).filter(([key]) => visibleFields.includes(key))
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
      latitude: lat,
      longitude: long,
    });
  }
);


/**
 * Handler to initiate a video call
 * Sends incoming call notification to driver with a unique roomId
 */
export const startCallHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { qrId } = req.params;
    const { userName, roomId } = req.body;

    console.log("✅ /start-call hit", req.body);

    // Validate required fields
    if (!qrId || !userName) {
      return res.status(400).json({ message: 'qrId and userName are required' });
    }

    // Fetch QR info
    const qr = await QRModel.findById(qrId)
      .populate({ path: 'createdFor', select: 'deviceTokens' })
      .lean();

    if (!qr) {
      return ApiResponse(res, 404, 'QR Code not found', false, null);
    }

    if (qr.qrStatus !== QRStatus.ACTIVE) {
      return ApiResponse(res, 403, 'QR Code is not active', false, null);
    }


    let notificationSent = false;

    try {
      const driver = qr.createdFor as any;
      const tokens = driver?.deviceTokens || [];

      if (tokens.length > 0) {
        await push.notifyMany(
          tokens,
          'Incoming Video Call',
          `${userName} wants to video call`,
          { roomId, userName }
        );
        notificationSent = true;
      }
    } catch (err) {
      console.error('Push notification error:', err);
      notificationSent = false;
    }

    return ApiResponse(res, 200, 'Call initiated', true, { roomId, notificationSent });
  }
);