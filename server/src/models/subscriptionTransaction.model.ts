import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubscriptionTransaction extends Document {
  userId: Types.ObjectId;
  email: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  planTier: 'BASIC' | 'PRO' | 'FAMILY';
  stripeEventId?: string;
  stripeSubscriptionId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionTransactionSchema = new Schema<ISubscriptionTransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'refunded'],
    default: 'completed',
  },
  planTier: {
    type: String,
    enum: ['BASIC', 'PRO', 'FAMILY'],
    required: true,
  },
  stripeEventId: { type: String, sparse: true, unique: true },
  stripeSubscriptionId: { type: String },
  description: { type: String },
}, { timestamps: true });

SubscriptionTransactionSchema.index({ createdAt: -1 });
SubscriptionTransactionSchema.index({ status: 1, createdAt: -1 });
SubscriptionTransactionSchema.index({ stripeEventId: 1 }, { sparse: true });

export default mongoose.model<ISubscriptionTransaction>('SubscriptionTransaction', SubscriptionTransactionSchema);
