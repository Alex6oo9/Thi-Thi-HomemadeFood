import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessSettings extends Document {
  phoneNumber: string;
  viberNumber: string;
  contactEmail: string;
  fbPageUrl: string;
  fbPageName: string;
  kbzPayNumber: string;
  kbzPayName: string;
  bankName: string;
  updatedAt: Date;
}

const BusinessSettingsSchema = new Schema<IBusinessSettings>(
  {
    phoneNumber: { type: String, default: '' },
    viberNumber: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    fbPageUrl: { type: String, default: '' },
    fbPageName: { type: String, default: '' },
    kbzPayNumber: { type: String, default: '' },
    kbzPayName: { type: String, default: '' },
    bankName: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BusinessSettings = mongoose.model<IBusinessSettings>(
  'BusinessSettings',
  BusinessSettingsSchema
);
