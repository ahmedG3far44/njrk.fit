import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivity extends Document {
  userId: Types.ObjectId;
  date: Date;
  timezoneOffset: number;
  type: 'check-in' | 'freeze' | 'reward-claimed';
  metadata?: Record<string, any>;
}

const ActivitySchema = new Schema<IActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true, index: true },
  timezoneOffset: { type: Number, default: 0 },
  type: { 
    type: String, 
    enum: ['check-in', 'freeze', 'reward-claimed'], 
    required: true 
  },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

ActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IActivity>('Activity', ActivitySchema);