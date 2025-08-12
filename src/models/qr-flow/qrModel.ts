import mongoose, { Schema } from 'mongoose';
import { IAddress, IQR } from '../../types/newQR.types';
import {
  COLLECTION_NAMES,
  DeliveryType,
  OrderStatus,
  QRStatus,
} from '../../config/constants';

const addressSchema = new Schema<IAddress>(
  {
    houseNumber: String,
    locality: String,
    nearByAreaName: String,
    pincode: String,
    city: String,
    state: String,
    country: String,
  },
  { _id: false },
);

const qrSchema = new Schema<IQR>(
  {
    qrTypeId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAMES.QR_TYPES_META_DATA,
      required: true,
    },
    serialNumber: {
      type: String,
      match: /^DIGI\d{10}$/,
    },
    customerName: {
      type: String,
    },
    mobileNumber: {
      type: String,
      match: /^\+\d{1,3}\s\d{10}$/,
    },
    altMobileNumber: {
      type: String,
      match: /^\+\d{1,3}\s\d{10}$/,
    },
    email: {
      type: String,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    address: addressSchema,
    vehicleNumber: {
      type: String,
      match: /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/,
    },
    gstNumber: {
      type: String,
      match: /^[0-3][0-9][A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAMES.USER,
    },
    createdFor: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAMES.USER,
    },
    deliveryType: {
      type: String,
      enum: Object.values(DeliveryType),
    },
    orderStatus : {
      type : String,
      enum : Object.values(OrderStatus),
      default : OrderStatus.SHIPPED
    },
    qrStatus: {
      type: String,
      enum: Object.values(QRStatus),
      default: QRStatus.INACTIVE,
    },
    shippingDetails: addressSchema,
    visibleInfoFields: {
      type: [String],
      default: [],
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAMES.PAYMENT_HISTORY,
    },
    qrUrl: {
      type: String,
    },
    qrRawData: {
      type: String,
    },
    textMessagesAllowed: {
      type: Boolean,
      default: false,
    },
    voiceCallsAllowed: {
      type: Boolean,
      default: false,
    },
    videoCallsAllowed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const QRModel = mongoose.model<IQR>(
  COLLECTION_NAMES.GENERATED_QRS,
  qrSchema,
);
