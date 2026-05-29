import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: Date;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, lowercase: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

export default mongoose.model<IAdmin>('Admin', AdminSchema);
