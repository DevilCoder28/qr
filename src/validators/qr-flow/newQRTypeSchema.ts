import { z } from 'zod';
import { DeliveryType, qrFormatType } from '../../config/constants';

export const baseProfessionSchema = z.object({
  name: z.string().min(1, 'Profession name is required').max(100).optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
});

export const newQRTypeSchema = z.object({
  qrName: z
    .string()
    .min(3, 'QR name must be at least 3 characters')
    .max(100, 'Name cannot be more than 100 characters long'),
  qrDescription: z.string().min(10, 'Description is too short'),
  qrUseCases: z
    .array(z.string().min(1))
    .min(1, 'At least one use case is required'),
  originalPrice: z.number().nonnegative('Price must be 0 or more'),
  discountedPrice: z.number().nonnegative('Discounted price must be 0 or more'),
  includeGST: z.boolean().optional().default(false),
  professionBased: z.boolean().optional().default(false),
  professionsAllowed: z.array(baseProfessionSchema).optional(),
  qrBackgroundImage: z.string().url().optional(),
  qrIcon: z.string().url().optional(),
  productImage: z.string().url().optional(),
  qrFormatType: z
    .nativeEnum(qrFormatType)
    .optional()
    .default(qrFormatType.SQUARE),
  pdfTemplate: z.string().url().optional(),
  deliveryType: z
    .array(z.nativeEnum(DeliveryType))
    .min(1)
    .optional()
    .default([
      DeliveryType.ETAG,
      DeliveryType.PHYSICAL_SHIP,
      DeliveryType.BULK_GENERATION,
    ]),
  stockCount: z.number().int().min(0).default(0),
});

export type INewQRTypeSchema = z.infer<typeof newQRTypeSchema>;
