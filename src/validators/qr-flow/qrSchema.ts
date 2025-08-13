import { z } from 'zod';
import {
  addressSchema,
  emailSchema,
  gstNumberSchema,
  mobileNumberSchema,
  objectIdSchema,
  serialNumberSchema,
  vehicleNumberSchema,
} from '../../common/schemas';
import { DeliveryType, QRStatus } from '../../config/constants';

export const qrSchema = z.object({
  qrTypeId: objectIdSchema,
  serialNumber: serialNumberSchema,
  customerName: z.string().optional(),
  mobileNumber: mobileNumberSchema.optional(),
  altMobileNumber: mobileNumberSchema.optional(),
  email: emailSchema.optional(),
  address: addressSchema.optional(),
  vehicleNumber: vehicleNumberSchema.optional(),
  gstNumber: gstNumberSchema.optional(),
  createdBy: objectIdSchema.optional(),
  createdFor: objectIdSchema.optional(),
  deliveryType: z.nativeEnum(DeliveryType).optional(),
  qrStatus: z.nativeEnum(QRStatus).default(QRStatus.INACTIVE),
  shippingDetails: addressSchema.optional(),
  visibleInfoFields: z.array(z.string()).optional(),
});

export const qrUpdateSchema = z.object({
  serialNumber: serialNumberSchema,
  customerName: z.string(),
  mobileNumber: mobileNumberSchema,
  altMobileNumber: mobileNumberSchema.optional(),
  email: emailSchema,
  address: addressSchema.optional(),
  vehicleNumber: vehicleNumberSchema.optional(),
  gstNumber: gstNumberSchema.optional(),
  visibleInfoFields: z.array(z.string()).optional(),
  qrStatus: z.nativeEnum(QRStatus),
  textMessagesAllowed: z.boolean().optional(),
  voiceCallsAllowed: z.boolean().optional(),
  videoCallsAllowed: z.boolean().optional(),
});

export type IQRSchema = z.infer<typeof qrSchema>;
export type IQRUpdateSchema = z.infer<typeof qrUpdateSchema>;
