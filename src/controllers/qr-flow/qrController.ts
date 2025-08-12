import expressAsyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { Response } from 'express';
import { QRMetaData } from '../../models/qr-flow/newQRTypeModel';
import { ApiResponse } from '../../config/ApiResponse';

export const fetchTypesOfQRBasedOnDelivery = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { deliveryType } = req.body;

    if (!deliveryType) {
      return ApiResponse(res, 400, 'deliveryType is required', false, null);
    }

        const qrTypes = await QRMetaData.find({
      deliveryType: { $in: [deliveryType] },
    }).select(
      '_id qrName qrDescription qrUseCases productImage originalPrice discountedPrice includeGST stockCount deliveryType',
    );

    return ApiResponse(
      res,
      200,
      'QR Types fetched successfully',
      true,
      qrTypes,
    );
  },
);
