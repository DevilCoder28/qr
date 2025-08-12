import mongoose, { Schema } from 'mongoose';
import { IBaseProfession, INewQRType } from '../../types/newQRType.types';
import {
  COLLECTION_NAMES,
  DeliveryType,
  qrFormatType,
} from '../../config/constants';

const BaseProfessionSchema: Schema<IBaseProfession> = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
  },
  logoUrl: {
    type: String,
    required: true,
    match: /^https?:\/\/.+\..+/,
  },
});

const NewQRTypeSchema: Schema<INewQRType> = new Schema(
  {
    qrName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
    },
    qrDescription: {
      type: String,
      required: true,
      minlength: 10,
    },
    qrUseCases: {
      type: [String],
      required: true,
      validate: [
        (val: string[]) => val.length > 0,
        'At least one use case is required',
      ],
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    includeGST: {
      type: Boolean,
      default: false,
    },
    professionBased: {
      type: Boolean,
      default: false,
    },
    professionsAllowed: {
      type: [BaseProfessionSchema],
      default: [],
    },
    qrBackgroundImage: {
      type: String,
      match: /^https?:\/\/.+\..+/,
    },
    qrIcon: {
      type: String,
      match: /^https?:\/\/.+\..+/,
    },
    productImage: {
      type: String,
      match: /^https?:\/\/.+\..+/,
    },
    qrFormatType: {
      type: String,
      enum: Object.values(qrFormatType),
      default: qrFormatType.SQUARE,
    },
    pdfTemplate: {
      type: String,
      match: /^https?:\/\/.+\..+/,
    },
    deliveryType: {
      type: [String],
      enum: Object.values(DeliveryType),
      default: [
        DeliveryType.ETAG,
        DeliveryType.PHYSICAL_SHIP,
        DeliveryType.BULK_GENERATION,
      ],
    },
    stockCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
      },
    },
  },
);

export const QRMetaData = mongoose.model<INewQRType>(
  COLLECTION_NAMES.QR_TYPES_META_DATA,
  NewQRTypeSchema,
);
