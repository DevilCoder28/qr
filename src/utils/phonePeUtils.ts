import crypto, { sign } from 'crypto';
import {
  PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_INDEX,
  PHONEPE_SALT_KEY,
} from '../secrets';
import axios from 'axios';

interface PhonePeInitProps {
  amount: number; //In Paise
  transactionId: string;
  redirectUrl: string;
  merchantUserId: string;
}

export const PhonePePaymentInit = async ({
  amount,
  transactionId,
  redirectUrl,
  merchantUserId,
}: PhonePeInitProps) => {
  const merchantId = PHONEPE_MERCHANT_ID;
  const saltKey = PHONEPE_SALT_KEY;
  const saltIndex = PHONEPE_SALT_INDEX;

  const payload = {
    merchantId,
    transactionId,
    merchantUserId: merchantUserId,
    amount,
    redirectUrl,
    redirectMode: 'POST',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };
  console.log('Payload is : ', payload);

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

  console.log('Base 64 Payload is : ', base64Payload);

  const signature = crypto
    .createHash('sha256')
    .update(base64Payload + '/pg/v1/pay' + saltKey)
    .digest('hex');

  console.log('Signature is : ', signature);

  const fullSignature = `${signature}###${saltIndex}`;

  console.log('Phone Pe Merchant ID : ', PHONEPE_MERCHANT_ID);
  try {
    console.log({
      merchantId: typeof PHONEPE_MERCHANT_ID,
      saltKey: typeof PHONEPE_SALT_KEY,
      saltIndex: typeof PHONEPE_SALT_INDEX,
      values: {
        merchantId: PHONEPE_MERCHANT_ID,
        saltKey: PHONEPE_SALT_KEY,
        saltIndex: PHONEPE_SALT_INDEX,
      },
    });

    const response = await axios.post(
      'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay',
      { request: base64Payload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': fullSignature,
          'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
        },
      },
    );
    return response.data.data.instrumentResponse.redirectInfo.url;
  } catch (error: any) {
    console.log('error : ', error);
    console.log('Error occurred', error.message);
  }
};

export const verifyPhonePeTransactionStatus = async (transactionId: string) => {
  const merchantId = PHONEPE_MERCHANT_ID;
  const saltKey = PHONEPE_SALT_KEY;
  const saltIndex = PHONEPE_SALT_INDEX;

  const urlPath = `/pg/v1/status/${merchantId}/${transactionId}`;
  const baseUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox';

  const fullUrl = `${baseUrl}${urlPath}`;

  const xVerify =
    crypto
      .createHash('sha256')
      .update(urlPath + saltKey)
      .digest('hex') + `###${saltIndex}`;

  try {
    const response = await axios.get(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': merchantId,
      },
    });

    return response.data.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
