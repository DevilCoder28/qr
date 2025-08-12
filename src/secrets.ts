require('dotenv').config();

export const PORT = process.env.PORT!;
export const MONGODB_DATABASE_NAME = process.env.MONGODB_DATABASE_NAME!;
export const MONGODB_DATABASE_URL = process.env.MONGODB_DATABASE_URL!;
export const MAX_RETRIES = process.env.DB_MAX_RETRIES!;
export const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES!);
export const NODEMAILER_HOST = process.env.NODEMAILER_HOST!;
export const NODEMAILER_PORT = process.env.NODEMAILER_PORT!;
export const NODEMAILER_SENDER_ADDRESS = process.env.NODEMAILER_SENDER_ADDRESS!;
export const NODEMAILER_GMAIL_APP_PASSWORD =
  process.env.NODEMAILER_GMAIL_APP_PASSWORD!;
export const SEND_EMAIL_RETRIES = parseInt(process.env.SEND_EMAIL_RETRIES!);
export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN!;
export const FRONTEND_URL = process.env.FRONTEND_URL!;
export const FRONTEND_BASE_URL_DEV = process.env.FRONTEND_BASE_URL_DEV!;
export const FRONTEND_BASE_URL_PROD_VERCEL =
  process.env.FRONTEND_BASE_URL_PROD_VERCEL!;
export const FRONTEND_BASE_URL_PROD_DOMAIN =
  process.env.FRONTEND_BASE_URL_PROD_DOMAIN!;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY!;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
export const NODE_ENV = process.env.NODE_ENV!;
export const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL!;
export const BACKEND_PROD_URL = process.env.BACKEND_PROD_URL!;
export const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX!;
export const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY!;
export const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID!;
export const EKQR_API_KEY = process.env.EQR_API_KEY!
export const FRONTEND_SIGNUP_URL = process.env.FRONTEND_SIGNUP_URL!
export const HASH_ID_SECRET_SALT = process.env.HASH_ID_SECRET_SALT!
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!
export const RTOAPI = process.env.RTOAPI!;
export const RTO_TOKEN =process.env.RTO_TOKEN!;
export const salessquared_api_key=process.env.salessquared_api_key!;
export const CLOUD_PHONE=process.env.CLOUD_PHONE!;