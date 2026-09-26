import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  orderId: string;
  paymentId?: string;
  userEmail?: string;
  planId: string;
  amount: number;
  currency: string;
  credits: number;
  status: 'created' | 'verified' | 'failed';
  createdAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, index: true },
    userEmail: { type: String, index: true },
    planId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    credits: { type: Number, default: 999 },
    status: { type: String, enum: ['created', 'verified', 'failed'], default: 'created' },
  },
  { timestamps: true }
);

const PaymentModel: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default PaymentModel;
