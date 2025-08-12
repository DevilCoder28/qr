import mongoose, { Schema } from "mongoose";
import { COLLECTION_NAMES } from "../../config/constants";

export interface IQRQuestions extends Document {
  qrId: mongoose.Types.ObjectId;
  questions: string[];
}


export const qrQuestions = new Schema<IQRQuestions>(
  {
    qrId : {
        type: Schema.Types.ObjectId,
        ref : COLLECTION_NAMES.QR_TYPES_META_DATA
    },
    questions : {
        type : [String]
    }
  },
);

export const QRQuestions = mongoose.model<IQRQuestions>(
  COLLECTION_NAMES.QR_QUESTIONS,
  qrQuestions,
);

