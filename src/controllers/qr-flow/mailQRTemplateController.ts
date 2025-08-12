import expressAsyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { Response } from 'express';
import { generateQRPDFAndUploadToCloudinary } from '../../helpers/generateQRPDF';
import { ApiResponse } from '../../config/ApiResponse';
import { User } from '../../models/auth/user';
import { sendEmail } from '../../config/mailer';
import path from 'path';
import {
  FRONTEND_BASE_URL_DEV,
  FRONTEND_BASE_URL_PROD_DOMAIN,
  NODE_ENV,
} from '../../secrets';
import { renderTemplate } from '../../utils/templateRenderer';
import { MailTemplate } from '../../enums/enums';
import { APP_NAME, PDF_NAME } from '../../config/constants';

export const mailQRTemplate = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { serialNumber, qrUrl } = req.body;

    const isMailSent = await mailQR(serialNumber, qrUrl, req.data?.userId!);

    return ApiResponse(
      res,
      200,
      'QR Code Generation is completed and Email is Sent',
      true,
      isMailSent,
    );
  },
);

export const mailQR = async (
  serialNumber: string,
  qrUrl: string,
  userId: string,
) => {
  try {
    const isPDFGenerated = await generateQRPDFAndUploadToCloudinary(serialNumber, qrUrl, '/qrcode-pdfs');

    console.log("Is PDF generated : ", isPDFGenerated);
    if (isPDFGenerated) {
      // console.log(req.data);
      // const userId = req.data?.userId;
      console.log('User ID : ', userId);
      const user = await User.findById(userId);

      if (user && user.email) {
        const attachmentPath = isPDFGenerated

        const feUrl =
          NODE_ENV == 'dev'
            ? FRONTEND_BASE_URL_DEV
            : FRONTEND_BASE_URL_PROD_DOMAIN;

        const activationLink = `${feUrl}/qr/check-validity`;

        const emailContent = {
          user_name: user.firstName,
          serial_number: serialNumber,
          download_link: qrUrl,
          activation_link: activationLink,
          app_name: APP_NAME,
        };

        const { html, text } = await renderTemplate(
          MailTemplate.QR_CODE,
          emailContent,
        );

        await sendEmail(user.email, 'Your QR Code PDF is Ready', text, html, [
          isPDFGenerated,
        ]);
      }
    }
    return true;
  } 
  catch (error: any) {
    console.log('Error occurred in mailing PDF!');
    console.log('Error is : ', error.message);
    return false;
  }
};
