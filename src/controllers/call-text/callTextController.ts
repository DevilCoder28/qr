import expressAsyncHandler from 'express-async-handler';
import { twilioClient } from '../..';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { Request, Response } from 'express';
import { QRModel } from '../../models/qr-flow/qrModel';
import { ApiResponse } from '../../config/ApiResponse';
import { QRMetaData } from '../../models/qr-flow/newQRTypeModel';
import { BACKEND_PROD_URL, TWILIO_PHONE_NUMBER } from '../../secrets';

import { twiml as TwiML } from 'twilio';

export const forwardCall = (req: Request, res: Response) => {
  const { to, reason, qrName } = req.query;

  const voice = new TwiML.VoiceResponse();
  voice.say({ voice: 'alice' }, `Connecting your call for reason: ${reason}`);
  voice.pause({ length: 1 });
  voice.say({ voice: 'alice' }, `Reason: ${reason}`);
  voice.pause({ length: 1 });
  voice.dial(to as string);

  res.type('text/xml');
  res.send(voice.toString());
};


const normalizePhone = (phone: string | undefined): string | null => {
  if (phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+') && /^\+\d{10,15}$/.test(cleaned)) {
      return cleaned;
    }

    const digits = cleaned.replace(/\D/g, '');

    if (digits.length === 10) return '+91' + digits;
    if (digits.length === 12 && digits.startsWith('91')) return '+' + digits;

    return null;
  }
  return null;
};

export const sendTextReason = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { qrId, reason } = req.body;
    const qr = await QRModel.findById(qrId);
    if (!qr?.textMessagesAllowed) {
      return ApiResponse(
        res,
        404,
        'Sorry, QR Owner has disabled sending information via text messages.',
        false,
        null,
      );
    }

    const qrName = await QRMetaData.findById(qr?.qrTypeId);
    const phoneNumber = normalizePhone(qr?.mobileNumber);
    if (phoneNumber) {
      const abc = await twilioClient.messages.create({
        body: `Someone tried reaching out to you via DigiPehchan for QR : ${qrName}, Reason : ${reason}`,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      if (abc)
        return ApiResponse(
          res,
          200,
          'Your Message is successfully delivered.',
          true,
          abc,
        );
    }
    return ApiResponse(
      res,
      400,
      'Error occurred sending message, Phone Number of QR Owner is not registered.',
      false,
      null,
    );
  },
);



export const sendVoiceReason = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { qrId, reason, finderPhone } = req.body;

    if (!qrId || !reason || !finderPhone) {
      return ApiResponse(res, 400, 'qrId, reason, and finderPhone are required.', false);
    }

    const qr = await QRModel.findById(qrId);
    if (!qr?.voiceCallsAllowed) {
      return ApiResponse(
        res,
        403,
        'Voice calls are disabled for this QR by the owner.',
        false,
        null,
      );
    }

    const qrNameDoc = await QRMetaData.findById(qr?.qrTypeId);
    const qrName = qrNameDoc?.qrName || 'your item';

    const ownerPhone = normalizePhone(qr?.mobileNumber);
    const formattedFinderPhone = normalizePhone(finderPhone);

    if (!ownerPhone) {
      return ApiResponse(res, 400, 'QR Owner phone number is not registered.', false);
    }

    if (!formattedFinderPhone) {
      return ApiResponse(res, 400, 'Finder phone number is invalid.', false);
    }

    const twimlUrl = `${BACKEND_PROD_URL}/api/twilio/forward-call?to=${ownerPhone}&reason=${encodeURIComponent(
      reason,
    )}&qrName=${encodeURIComponent(qrName)}`;

    const call = await twilioClient.calls.create({
      url: twimlUrl,
      to: formattedFinderPhone,
      from: TWILIO_PHONE_NUMBER,
    });

    if (call) {
      return ApiResponse(
        res,
        200,
        'Masked voice call initiated successfully.',
        true,
        { sid: call.sid },
      );
    }

    return ApiResponse(res, 500, 'Failed to initiate call.', false, null);
  },
);


export const sendRtoRequest = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { vehicalNo } = req.body;

    if (!vehicalNo) {
      res.status(400).json({ success: false, message: "vehicalNo is required." });
      return;
    }

    try {
      const apiRes = await fetch("https://prod.apiclub.in/api/v1/rc_lite", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${process.env.RTO_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicalNo }),
      });
      
      if (!apiRes.ok) {
        const errorData = await apiRes.json();
        res.status(apiRes.status).json({ success: false, ...errorData });
        return;
      }

      const data = await apiRes.json();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: "RTO API error", error: String(error) });
    }
  }
);


  export const initiateCallConnect = expressAsyncHandler(
    async (req: Request, res: Response) => {
    
      const { mobileNo, callerNo } = req.body;
      const cloudPhone = process.env.CLOUD_PHONE || "";

      if (!mobileNo) {
        res.status(400).json({
          success: false,
          message: "mobileNo is required.",
        });
        return;
      }

      if (!cloudPhone) {
        res.status(500).json({
          success: false,
          message: "Cloud phone number is not configured in environment variables.",
        });
        return;
      }

      const payload = {
        to_number_1:callerNo,
        to_number_2: mobileNo,  
        api_key: process.env.salessquared_api_key || "",
        cloud_phone: cloudPhone,  
        calldet_callback_url: "https://www.google.com/", 
      };
  
      try {
        const response = await fetch("https://api.salesquared.io/v2/call-connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.errcode !== 0) {
          res.status(400).json({
            success: false,
            message: data.errmsg || "Call connect API returned an error",
            data,
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: "Call initiated successfully",
          call_id: data.call_id,
          data,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Internal server error",
          error: String(error),
        });
      }
    }
  );