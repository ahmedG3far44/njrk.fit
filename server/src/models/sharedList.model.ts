import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISharedListItem {
  name: string;
  category: string;
  quantity: string;
  isPurchased: boolean;
}

export interface ISharedList extends Document {
  token: string;
  userId: Types.ObjectId;
  items: ISharedListItem[];
  expiresAt: Date;
}

const SharedListItemSchema = new Schema<ISharedListItem>({
  name: { type: String, required: true },
  category: { type: String, default: 'Other' },
  quantity: { type: String },
  isPurchased: { type: Boolean, default: false },
});

const SharedListSchema = new Schema<ISharedList>({
  token: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [SharedListItemSchema],
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

SharedListSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISharedList>('SharedList', SharedListSchema);