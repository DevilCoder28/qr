import express from 'express';
import {
  authenticate,
  authorize,
} from '../../middlewares/jwtAuthenticationMiddleware';
import { UserRoles } from '../../enums/enums';
import { upload } from '../../config/multerConfig';
import { createNewQRType } from '../../controllers/qr-flow/createNewQRTypeController';
import { fetchTypesOfQRBasedOnDelivery } from '../../controllers/qr-flow/qrController';
import { paymentRoute } from './payment/paymentRoute';
import { User } from '../../models/auth/user';
import {
  checkQRValidity,
  updateQRBySerialNumberHandler,
} from '../../controllers/qr-flow/activateQRController';
import { scanQrHandler } from '../../controllers/qr-flow/qrScanController';
import { mailQRTemplate } from '../../controllers/qr-flow/mailQRTemplateController';
import { uploadLocalPDF } from '../../helpers/generateQRPDF';
import { getQRTypeQuestions } from '../../controllers/qr-flow/qrQuestionsController';

export const qrFlowRoute = express.Router();

qrFlowRoute.post(
  '/create-new-type',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  upload.any(),
  createNewQRType,
);

qrFlowRoute.post(
  '/fetch-types',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  fetchTypesOfQRBasedOnDelivery,
);

qrFlowRoute.post(
  '/check-validity',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  checkQRValidity,
);

qrFlowRoute.post(
  '/update-qr',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  updateQRBySerialNumberHandler,
);

qrFlowRoute.get(
  '/scan/:qrId',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  scanQrHandler,
);

qrFlowRoute.post(
  '/send-qr-pdf',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  mailQRTemplate,
);

qrFlowRoute.post('/upload', uploadLocalPDF);

qrFlowRoute.post(
  '/get-questions',
  authenticate,
  authorize([UserRoles.BASIC_USER]),
  getQRTypeQuestions,
);

qrFlowRoute.use('/payment', paymentRoute);
