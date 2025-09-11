import mongoose from 'mongoose';
import { Schema, model, models, Model } from 'mongoose';

export interface IOTP {
  _id: mongoose.Types.ObjectId;
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

otpSchema.index({ email: 1 });

// Use existing model or create new one
export const OTP: Model<IOTP> = models.OTP || model<IOTP>('OTP', otpSchema);
