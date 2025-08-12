import nodemailer from 'nodemailer';
import {
  NODEMAILER_HOST,
  NODEMAILER_PORT,
  NODEMAILER_SENDER_ADDRESS,
  NODEMAILER_GMAIL_APP_PASSWORD,
  SEND_EMAIL_RETRIES,
} from '../secrets';
import logger from './logger';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch'; // If not installed: npm install node-fetch

const transport = nodemailer.createTransport({
  host: NODEMAILER_HOST,
  port: Number(NODEMAILER_PORT),
  secure: true,
  auth: {
    user: NODEMAILER_SENDER_ADDRESS,
    pass: NODEMAILER_GMAIL_APP_PASSWORD,
  },
});

const isURL = (str: string): boolean => /^https?:\/\//.test(str);

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string,
  attachmentPaths: string[] = [],
): Promise<void> => {
  const delay = 2000;
  const sendEmailRetries = SEND_EMAIL_RETRIES;

  const attachments = await Promise.all(
    attachmentPaths.map(async (filePath) => {
      if (isURL(filePath)) {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to download attachment: ${filePath}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);

        return {
          filename: path.basename(filePath.split('?')[0]),
          content: pdfBuffer,
          contentType: 'application/pdf',
        };
      } else {
        return {
          filename: path.basename(filePath),
          content: fs.readFileSync(filePath),
          contentType: 'application/pdf',
        };
      }
    }),
  );

  const mailOptions = {
    from: NODEMAILER_SENDER_ADDRESS,
    to,
    subject,
    text,
    html,
    ...(attachments.length > 0 && { attachments }),
  };

  let attempts = 0;
  while (attempts < sendEmailRetries) {
    try {
      const info = await transport.sendMail(mailOptions);
      logger.info(`Mail sent successfully: ${info.response}`);
      return;
    } catch (err) {
      attempts++;
      logger.error(`Attempt ${attempts}: Error in sending email - ${err}`);

      if (attempts < sendEmailRetries) {
        logger.info(`Retrying... Attempt ${attempts + 1} in ${delay / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error('Max retry attempts reached. Could not send email.');
      }
    }
  }
};
