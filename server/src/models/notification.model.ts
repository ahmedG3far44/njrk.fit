import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'invite' | 'reminder' | 'system' | 'social';
  message: string;
  isRead: boolean;
  actionUrl?: string; // Frontend route to redirect to (e.g., "/community")
}


const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['invite', 'reminder', 'system', 'social'], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String },
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);