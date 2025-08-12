import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, { message: 'Invalid ObjectId format' });

export const serialNumberSchema = z.string().regex(/^DIGI\d{10}$/, {
  message: "Serial number must start with 'DIGI' followed by 10 digits",
});

export const mobileNumberSchema = z.string().regex(/^\+\d{1,3}\s\d{10}$/, {
  message: "Mobile number must be in format '+<country-code> 1234567890'",
});

export const emailSchema = z.string().email({
  message: 'Invalid email address',
});

const pinCodeSchema = z.string().regex(/^\d{6}$/, {
  message: 'PIN code must be exactly 6 digits',
});

export const addressSchema = z.object({
  houseNumber: z.string().optional(),
  locality: z.string().optional(),
  nearByAreaName: z.string().optional(),
  pincode: pinCodeSchema.optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export const vehicleNumberSchema = z
  .string()
  .regex(/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/, {
    message: "Vehicle number must be in format 'XX00XX0000' without spaces",
  });

export const gstNumberSchema = z
  .string()
  .regex(/^[0-3][0-9][A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/, {
    message: 'Invalid GST Number format',
  });
