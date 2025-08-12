import express from 'express';
import {
  forgotPassword,
  generateReferralLink,
  getUserFromUserId,
  login,
  logout,
  resendVerificationLink,
  resetPassword,
  signUp,
  updateUserProfile,
  resetUserProfile,
  verifyEmail,
} from '../../controllers/auth/authController';
import {
  authenticate,
  authorize,
} from '../../middlewares/jwtAuthenticationMiddleware';
import { UserRoles } from '../../enums/enums';
import { upload } from '../../config/multerConfig';

export const authRoute = express.Router();

authRoute.post('/signup', signUp);
authRoute.post('/login', login);
authRoute.get('/verify-email', verifyEmail);
authRoute.post('/resend-verification', resendVerificationLink);
authRoute.post('/forgot-password', forgotPassword);
authRoute.post('/reset-password', resetPassword);
authRoute.get('/logout', authenticate, logout);
authRoute.get('/referral-link', authenticate, authorize([UserRoles.BASIC_USER]), generateReferralLink);
authRoute.get('/profile', authenticate, authorize([UserRoles.BASIC_USER]), getUserFromUserId);
authRoute.put('/profile', authenticate, authorize([UserRoles.BASIC_USER]), upload.single('avatar'), updateUserProfile);
authRoute.put('/profile/reset',authenticate, authorize([UserRoles.BASIC_USER]), resetUserProfile);