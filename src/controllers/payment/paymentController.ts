import expressAsyncHandler from 'express-async-handler';
import { AuthenticatedRequest } from '../../types/AuthenticatedRequest';
import { Response } from 'express';
import { QRMetaData } from '../../models/qr-flow/newQRTypeModel';
import { ApiResponse } from '../../config/ApiResponse';
import { PaymentTransaction } from '../../models/transaction/paymentTransaction';
import { PaymentTransactionStatus } from '../../config/constants';
import  { Request } from "express";

import {
  BACKEND_BASE_URL,
  BACKEND_PROD_URL,
  EKQR_API_KEY,
  FRONTEND_BASE_URL_DEV,
  FRONTEND_BASE_URL_PROD_DOMAIN,
  NODE_ENV,
} from '../../secrets';
import {
  PhonePePaymentInit,
  verifyPhonePeTransactionStatus,
} from '../../utils/phonePeUtils';
import { createAndSaveQR } from '../qr-flow/createNewQRTypeController';
import axios from 'axios';
import { User } from '../../models/auth/user';
import mongoose, { Mongoose } from 'mongoose';
import logger from '../../config/logger';

export const initiatePayment = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {

    let { items, createdFor, shippingAddress = {}, deliveryType } = req.body;
    console.log("Items : ", items)
    const createdBy = req.data?.userId;

    if (!createdFor) 
      createdFor = req.data?.userId;

    let totalAmount = 0;

    for (const item of items) {
      console.log('Item is : ', item);
      const qrType = await QRMetaData.findById(item.qrTypeId);

      console.log('QR Type is : ', qrType);
      if (!qrType)
        return ApiResponse(res, 400, 'QR Type Not Found!', false, null);

      totalAmount = totalAmount + item.quantity * qrType.discountedPrice;
    }

    const transactionId = new mongoose.Types.ObjectId();

    await PaymentTransaction.create({
      transactionId,
      items,
      createdBy,
      createdFor,
      deliveryType: deliveryType,
      shippingAddress,
      amount: totalAmount,
      status: PaymentTransactionStatus.INITIATED,
    });

    // const backendUrl = NODE_ENV === 'dev' ? BACKEND_BASE_URL : BACKEND_PROD_URL;
    const backendUrl = "https://digipahchan-qr.onrender.com";
    const redirectUrl = `${backendUrl}/api/qr-flow/payment/verify-payment`;

    console.log('Backend Base URL : ', backendUrl);
    console.log('Redirection URL : ', redirectUrl);

    const user = await User.findById(createdFor || req.data?.userId!);

    try {
      const ekqrPayload = {
        key: EKQR_API_KEY,
        client_txn_id: transactionId.toString(),
        amount: totalAmount.toString(),
        p_info: 'QR Purchase',
        customer_name: (user?.firstName ?? '' + user?.lastName) || 'Customer',
        customer_email: user?.email || 'customer@example.com',
        customer_mobile: '9999999999',
        redirect_url: redirectUrl,
      };

      console.log("Payment Payload : ", ekqrPayload)
      const response = await axios.post(
        'https://api.ekqr.in/api/create_order',
        ekqrPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      console.log("Response is : ", response);

      const ekqrResponse = response.data;
      logger.info('EKQR Response', ekqrResponse);

      if (ekqrResponse.status && ekqrResponse.data?.payment_url) {
        return ApiResponse(res,200,'Payment initiated',true,ekqrResponse.data.payment_url,);
      } 
      else {
        logger.error('eKQR API Error:', ekqrResponse);
        return ApiResponse(res,500,'Failed to initiate payment with eKQR',false,null,);
      }
    } catch (error: any) {
      logger.error('Error initiating eKQR payment:', error.message);
      return ApiResponse(res, 500, 'Payment initiation failed', false, null);
    }
  },
);

export const paymentCallBackHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { client_txn_id: transactionId } = req.query;

    if (!transactionId)
      return ApiResponse(res, 400, 'Missing Txn ID', false, null);

    let isPaymentSuccess = false;
    let paymentStatusMessage = 'Payment unfulfilled';

    const transaction = await PaymentTransaction.findOne({ transactionId });

    const transactionDate = transaction!.createdAt;
    const year = transactionDate!.getFullYear();
    const month = (transactionDate!.getMonth() + 1).toString().padStart(2, '0');
    const day = transactionDate!.getDate().toString().padStart(2, '0');

    const formattedTxnDate = `${day}-${month}-${year}`;
    try {

      const statusCheckPayload = {
        key: EKQR_API_KEY,
        client_txn_id: transactionId,
        txn_date: formattedTxnDate,
      };

      const statusCheckResponse = await axios.post(
        'https://api.ekqr.in/api/check_order_status',
        statusCheckPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const ekqrStatusData = statusCheckResponse.data;
      console.log('eKQR Status Check Response:', ekqrStatusData);
      if (ekqrStatusData.status === true &&ekqrStatusData.data?.status === 'success'){
        isPaymentSuccess = true;
        paymentStatusMessage = 'Payment successful';
      } 
      else {
        paymentStatusMessage = ekqrStatusData.data?.status_message || 'Payment failed or pending';
      }
    }

    catch (error: any) {
      logger.error('Error verifying eKQR payment status:', error.message);
      paymentStatusMessage = 'Failed to verify payment status with gateway.';
    }

    if (transaction && isPaymentSuccess) {
      transaction.status = PaymentTransactionStatus.PAID;

      let transactionDocumentId = transaction._id;
      let items = transaction.items;
      console.log('Items : ', items);
      let createdBy = transaction.createdBy;
      let createdFor = transaction.createdFor;

      for (const item of items) {
        await createAndSaveQR({
          qrTypeId: item.qrTypeId,
          createdBy: createdBy,
          createdFor: createdFor,
          transactionId: transactionDocumentId,
          shippingAddress: transaction?.shippingAddress,
          deliveryType: transaction.deliveryType,
          currentUserIdLoggedIn : createdFor?.toString()!
        });
      }

      await transaction.save();

      //TODO : Here we will send the pdfs on email.
    } 
    else if (transaction) {
      transaction.status = PaymentTransactionStatus.FAILED;
      await transaction.save();
    }

    const frontendBaseUrl =
      NODE_ENV == 'dev' ? FRONTEND_BASE_URL_DEV : FRONTEND_BASE_URL_PROD_DOMAIN;

    const redirectFrontendUrl = `${frontendBaseUrl}/payment-status?transactionId=${transactionId}`;

    // return ApiResponse(res,200, 'Phone Pe Payment completed!', true, redirectFrontendUrl);
    return res.redirect(redirectFrontendUrl);
  },
);


export const paymentStatusHandler = expressAsyncHandler(
  async (req: Request, res: Response) => {

    const { transactionId } = req.query;
    console.log("TID : ", transactionId);
    const transaction = await PaymentTransaction.findOne({transactionId});

    if (!transaction)
      return ApiResponse(res, 400, 'No transaction found!', false, null);

    return ApiResponse(res, 200, 'Payment information fetched successfully', true,{
        paymentStatus: transaction.status,
        items: transaction.items,
        amount: transaction.amount,
      },
    );
  },
);
