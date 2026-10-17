import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  credits: number;
  isUnlimited: boolean;
  unlimitedExpiry?: Date;
  contributedCount: number;
  potdStreak: number;
  potdLastSolvedDate?: string;
  potdSolvedDates: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String },
    image: { type: String },
    credits: { type: Number, default: 1 },
    isUnlimited: { type: Boolean, default: false },
    unlimitedExpiry: { type: Date },
    contributedCount: { type: Number, default: 0 },
    potdStreak: { type: Number, default: 0 },
    potdLastSolvedDate: { type: String },
    potdSolvedDates: { type: [String], default: [] },
  },
  { timestamps: true }
);

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
