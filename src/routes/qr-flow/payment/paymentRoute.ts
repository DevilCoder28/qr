import express from 'express';
import {
  authenticate,
  authorize,
} from '../../../middlewares/jwtAuthenticationMiddleware';
import { UserRoles } from '../../../enums/enums';
import {
  initiatePayment,
  paymentStatusHandler,
  paymentCallBackHandler,
} from '../../../controllers/payment/paymentController';
import { User } from '../../../models/auth/user';

export const paymentRoute = express.Router();

paymentRoute.post(
  '/initiate',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  initiatePayment,
);

paymentRoute.get(
  '/verify-payment',
  // authenticate,
  // authorize([UserRoles.BASIC_USER]),
  paymentCallBackHandler,
);

paymentRoute.get(
  '/payment-status',
  // authenticate,
  // authorize([UserRoles.BASIC_USER]),
  paymentStatusHandler,
);
