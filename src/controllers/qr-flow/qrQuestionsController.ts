import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { QRQuestions } from '../../models/qr-flow/qrQuestions';
import { ApiResponse } from '../../config/ApiResponse';
import mongoose from 'mongoose';

export const getQRTypeQuestions = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { qrTypeId } = req.body;

    if (!qrTypeId) {
      return ApiResponse(res, 400, 'qrTypeId is required', false);
    }
    const allDocs = await QRQuestions.find().select('qrId questions');

    const matchedDoc = allDocs.find((doc) =>
      doc.qrId.equals(new mongoose.Types.ObjectId(qrTypeId)),
    );

    if (!matchedDoc) {
      return ApiResponse(
        res,
        404,
        'No questions found for this QR type',
        false,
      );
    }

    // console.log('Matched qrTypeId:', qrTypeId);
    // console.log('Matched Questions:', matchedDoc);

    return ApiResponse(
      res,
      200,
      'QR Questions fetched successfully',
      true,
      matchedDoc.questions || [],
    );
  },
);
