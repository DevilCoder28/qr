import expressAsyncHandler from 'express-async-handler';
import {
  INewQRTypeSchema,
  newQRTypeSchema,
} from '../../validators/qr-flow/newQRTypeSchema';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { handleQRTypeCreation } from '../../helpers/qr-flow/handleQRCreation';
import { ApiResponse } from '../../config/ApiResponse';
import logger from '../../config/logger';
import { parseRequestBody } from '../../helpers/parseHelper';
import mongoose, { Types } from 'mongoose';
import { QRMetaData } from '../../models/qr-flow/newQRTypeModel';
import { IAddress } from '../../types/newQR.types';
import { QRModel } from '../../models/qr-flow/qrModel';
import { generateRandomSerialNumber } from '../../utils/generateSerialNumber';
import { DeliveryType, OrderStatus } from '../../config/constants';
import { uploadToCloudinary } from '../../config/uploadToCloudinary';
import {
  FRONTEND_BASE_URL_DEV,
  FRONTEND_BASE_URL_PROD_DOMAIN,
  NODE_ENV,
} from '../../secrets';
import { mailQR } from './mailQRTemplateController';
import { User } from '../../models/auth/user';

export interface CreateAndSaveQRParams {
  qrTypeId: Types.ObjectId;
  createdBy?: Types.ObjectId;
  createdFor?: Types.ObjectId;
  transactionId: Types.ObjectId;
  shippingAddress: IAddress | undefined;
  deliveryType: DeliveryType;
  currentUserIdLoggedIn : string
}

export const createNewQRType = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filesArray = req.files as Express.Multer.File[];
      console.log('Files array : ', filesArray);
      const filesByField: Record<string, Express.Multer.File[]> = {};
      for (const file of filesArray) {
        if (!filesByField[file.fieldname]) filesByField[file.fieldname] = [];
        filesByField[file.fieldname].push(file);
      }

      // const newQRTypeData : INewQRTypeSchema = req.body;

      const rawData = req.body;
      console.log('Raw Data : ', rawData);
      const newQRTypeData = parseRequestBody<INewQRTypeSchema>(rawData, {
        arrays: ['qrUseCases', 'deliveryType', 'professionsAllowed'],
        booleans: ['includeGST', 'professionBased'],
        numbers: ['originalPrice', 'discountedPrice', 'stockCount'],
      });

      console.log('New QR Type Data : ', newQRTypeData);

      const validation = newQRTypeSchema.safeParse(newQRTypeData);
      console.log('Validation : ', validation.error?.errors[0]);
      if (!validation.success)
        return ApiResponse(res, 500, 'Failed to create QR Type!', false, null);

      const newQR = await handleQRTypeCreation(validation.data, filesByField);

      return ApiResponse(
        res,
        201,
        'New QR Type created successfully',
        true,
        newQR,
      );
    } catch (error: any) {
      logger.error('Create QR Type Error:', error);
      return ApiResponse(
        res,
        500,
        'Failed to create QR Type!',
        false,
        null,
        error.message,
      );
    }
  },
);

export const createAndSaveQR = async (params: CreateAndSaveQRParams) => {
  const {
    qrTypeId,
    createdBy,
    createdFor,
    transactionId,
    deliveryType,
    shippingAddress,
  } = params;
  const newQRType = await QRMetaData.findById(qrTypeId);
  const backgroundImage = newQRType?.qrBackgroundImage;
  const icon = newQRType?.qrIcon;

  const qrId = new mongoose.Types.ObjectId();
  const frontendUrl =
    NODE_ENV === 'dev' ? FRONTEND_BASE_URL_DEV : FRONTEND_BASE_URL_PROD_DOMAIN;

  const qrRawData = `${frontendUrl}/qr/scan/${qrId.toString()}`;

  const QRCode = await import('qrcode');
  const qrBuffer = await QRCode.toBuffer(qrRawData, { type: 'png' });

  const cloudinaryResult: any = await uploadToCloudinary(
    qrBuffer,
    'qr_codes/',
    'image',
  );


  const serialNumber = generateRandomSerialNumber();
  const orderStatus = deliveryType == DeliveryType.ETAG ? OrderStatus.DELIVERED : OrderStatus.SHIPPED;
  const qr = await QRModel.create({
    _id: qrId,
    qrTypeId : qrTypeId,
    serialNumber: serialNumber,
    createdBy: createdBy,
    createdFor: createdFor,
    deliveryType: deliveryType,
    shippingDetails: shippingAddress,
    transactionId: transactionId,
    qrRawData: qrRawData,
    qrUrl: cloudinaryResult.secure_url,
    orderStatus : orderStatus
  });

   await User.findByIdAndUpdate(
    createdFor,
    { $inc: { totalGeneratedQRs: 1 } },
    { new: true }
  );
  
  console.log("Serial Number : ", serialNumber);
  console.log("Cloudinary URL : ", cloudinaryResult.secure_url);
  const isMailSent = await mailQR(serialNumber, cloudinaryResult.secure_url, params.currentUserIdLoggedIn)
  console.log("QR is : ", qr);
  return qr;
};
