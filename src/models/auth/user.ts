import mongoose, { Schema } from 'mongoose';
import { COLLECTION_NAMES } from '../../config/constants';
import { UserRoles } from '../../enums/enums';
import { IUser } from '../../types/user.types';

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    avatar : {
      type : String
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    altMobileNumber: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    about:{
      type: String,
      default: 'hello, I am using QR Project',
    },
    roles: {
      type: [String],
      enum: Object.values(UserRoles),
      default: [UserRoles.BASIC_USER],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpiry: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordTokenExpiry: {
      type: Date,
    },
    vehicleNumber: {
      type: String,
    },
    vehicleType: {
      type: String,
    },
    totalNumberOfQRsGenerated : {
      type : Number,
      default : 0
    },
    digitalWalletCoins : {
      type : Number,
      default : 0
    },
    deviceTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUserDocument>(
  COLLECTION_NAMES.USER,
  userSchema,
);