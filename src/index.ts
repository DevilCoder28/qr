import express from 'express';
import { apiRouter } from './route';
import {
  FRONTEND_BASE_URL_DEV,
  FRONTEND_BASE_URL_PROD_DOMAIN,
  FRONTEND_BASE_URL_PROD_VERCEL,
  MAX_RETRIES,
  PORT,
  RTOAPI,
} from './secrets';
import { connectToDatabase } from './config/database';
import logger from './config/logger';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { qrFlowRoute } from './routes/qr-flow/qrFlowRoute';

import twilio from 'twilio';


const app = express();

const allowedOrigins = [
  FRONTEND_BASE_URL_DEV,
  FRONTEND_BASE_URL_PROD_DOMAIN,
  FRONTEND_BASE_URL_PROD_VERCEL,
  RTOAPI,
  '*'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Enable credentials
}));

app.use(express.json());
app.use(cookieParser());
connectToDatabase(parseInt(MAX_RETRIES));

export const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

app.use('/api', apiRouter);

app.listen(PORT, () => {
  logger.info(`Started Your Application on Port ${PORT}`);
});
