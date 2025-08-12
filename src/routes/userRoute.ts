import express from 'express';
import { userProfile } from '../controllers/userController';

import {
  authenticate,
  authorize,
} from '../middlewares/jwtAuthenticationMiddleware';
import { UserRoles } from '../enums/enums';

export const userRoute = express.Router();

userRoute.get(
  '/',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  userProfile,
);
