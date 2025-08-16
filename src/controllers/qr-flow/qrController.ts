import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../types/AuthenticatedRequest";
import { Response } from "express";
import { QRMetaData } from "../../models/qr-flow/newQRTypeModel";
import { ApiResponse } from "../../config/ApiResponse";
import { QRModel } from "../../models/qr-flow/qrModel";
import {
  IQRPermissionsUpdateByUserSchema,
  qrPermissionsUpdateByUserSchema,
} from "../../validators/qr-flow/qrSchema";

export const fetchGeneratedQRsByUser = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId, createdFor } = req.query;

    if (!userId || !createdFor) {
      return ApiResponse(
        res,
        400,
        "Both userId and createdFor are required",
        false,
        null
      );
    }

    try {
      const qrs = await QRModel.find({
        createdBy: userId,
        createdFor: createdFor,
      }).select(
        "_id serialNumber qrTypeId qrStatus qrUrl createdBy createdFor"
      );

      return ApiResponse(
        res,
        200,
        "Generated QRs fetched successfully",
        true,
        qrs
      );
    } catch (error) {
      console.error("Error fetching generated QRs:", error);
      return ApiResponse(res, 500, "Failed to fetch QRs", false, null);
    }
  }
);

export const fetchTypesOfQRBasedOnDelivery = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { deliveryType } = req.body;

    if (!deliveryType) {
      return ApiResponse(res, 400, "deliveryType is required", false, null);
    }

    const qrTypes = await QRMetaData.find({
      deliveryType: { $in: [deliveryType] },
    }).select(
      "_id qrName qrDescription qrUseCases productImage originalPrice discountedPrice includeGST stockCount deliveryType"
    );

    return ApiResponse(
      res,
      200,
      "QR Types fetched successfully",
      true,
      qrTypes
    );
  }
);

// Bulk update permission flags for all QRs of a specific user (createdFor = userId)
export const updateQRPermissionsByUserHandler = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const payload: IQRPermissionsUpdateByUserSchema = req.body;

    const validation = qrPermissionsUpdateByUserSchema.safeParse(payload);
    if (!validation.success) {
      return ApiResponse(
        res,
        400,
        "Invalid payload for user-level permissions update",
        false,
        null
      );
    }

    const { userId, ...updateData } = validation.data;

    const result = await QRModel.updateMany(
      { createdFor: userId },
      { $set: { ...updateData } },
      { upsert: false }
    );

    return ApiResponse(
      res,
      200,
      "Permissions updated for all QRs of the user",
      true,
      {
        matchedCount: (result as any).matchedCount ?? undefined,
        modifiedCount: (result as any).modifiedCount ?? undefined,
        acknowledged: (result as any).acknowledged ?? undefined,
      }
    );
  }
);
