import { UserRoles } from '../enums/enums';

export interface IUser {
  avatar? : string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  altMobileNumber?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  about?: string;
  roles: UserRoles[];
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  digitalWalletCoins? : Number;
  totalNumberOfQRsGenerated? : Number
}
