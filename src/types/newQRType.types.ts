import { DeliveryType, qrFormatType } from '../config/constants';

export interface IBaseProfession {
  name: string;
  logoUrl: string;
}

export interface INewQRType extends Document {
  qrName: string;
  qrDescription: string;
  qrUseCases: string[];
  originalPrice: number;
  discountedPrice: number;
  includeGST?: boolean;
  professionBased?: boolean;
  professionsAllowed?: IBaseProfession[];
  qrBackgroundImage?: string;
  qrIcon?: string;
  productImage?: string;
  qrFormatType?: qrFormatType;
  pdfTemplate?: string;
  deliveryType?: DeliveryType[];
  stockCount: number;
}
