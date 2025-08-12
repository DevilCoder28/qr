import { z } from 'zod';
import { mobileNumberSchema } from '../../common/schemas';

export const signUpSchema = z.object({
  firstName: z
    .string()
    .regex(/^[A-Za-z]+$/, { message: 'First name must contain only alphabets' })
    .nonempty({ message: 'First Name cannot be empty!' }),
  lastName: z
    .string()
    .regex(/^[A-Za-z]+$/, { message: 'Last name must contain only alphabets' })
    .nonempty({ message: 'Last Name cannot be empty!' }),
  email: z.string().email({ message: 'Invalid email format' }),
  // phoneNumber : mobileNumberSchema,
  password: z
    .string()
    .min(6, { message: 'Password should have 6 or more characters' })
    .nonempty({ message: 'Password cannot be empty' }),
    _tk : z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z
    .string()
    .min(6, { message: 'Password should have 6 or more characters' })
    .nonempty({ message: 'Password cannot be empty' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(6, { message: 'Password should have 6 or more characters' })
    .nonempty({ message: 'Password cannot be empty' }),
});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

export const resendVerificationEmailSchema = z.object({
  email: z.string(),
});

export type ISignUpSchema = z.infer<typeof signUpSchema>;
export type ILoginSchema = z.infer<typeof loginSchema>;
export type IForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type IResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type IVerifyEmailSchema = z.infer<typeof verifyEmailSchema>;
export type IResendVerificationEmailSchema = z.infer<
  typeof resendVerificationEmailSchema
>;
