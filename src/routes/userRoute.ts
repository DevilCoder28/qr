import express from 'express';
import { userProfile } from '../controllers/userController';

import {
  authenticate,
  authorize,
} from '../middlewares/jwtAuthenticationMiddleware';
import { UserRoles } from '../enums/enums';
import { registerDeviceToken, unregisterDeviceToken } from '../controllers/userController';

export const userRoute = express.Router();

userRoute.get(
  '/',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  userProfile,
);

userRoute.post(
  '/register-device',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  registerDeviceToken,
);

userRoute.post(
  '/unregister-device',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  unregisterDeviceToken,
);