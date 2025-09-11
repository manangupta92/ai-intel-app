import mongoose from 'mongoose';
import { Schema, model, models, Model } from 'mongoose';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Use existing model or create new one
export const User: Model<IUser> = models.User || model<IUser>('User', userSchema);
