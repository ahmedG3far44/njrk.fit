import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProgressLog extends Document {
  userId: Types.ObjectId;
  date: Date;
  weightKg?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  dailySteps?: number;
  tags: string[]; // e.g., ["Lost some weight", "Feeling strong"]
  notes?: string;
  scanFileUrl?: string; // S3 URL for InBody scans
  source: 'manual' | 'inbody_scan';
}

const ProgressLogSchema = new Schema<IProgressLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true },
  weightKg: { type: Number },
  bodyFatPercentage: { type: Number },
  muscleMass: { type: Number },
  dailySteps: { type: Number },
  tags: [{ type: String }],
  notes: { type: String },
  scanFileUrl: { type: String },
  source: { type: String, enum: ['manual', 'inbody_scan'], default: 'manual' },
}, { timestamps: true });

export default mongoose.model<IProgressLog>('ProgressLog', ProgressLogSchema);