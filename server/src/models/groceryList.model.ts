import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGroceryItem {
  _id?: Types.ObjectId;
  name: string;
  category: 'Proteins' | 'Vegetables' | 'Dairy' | 'Grains' | 'Fruits' | 'Spices' | 'Other';
  totalQuantity: number;
  unit: string;
  isPurchased: boolean;
  consumers: Types.ObjectId[];
}

export interface IGroceryList extends Document {
  userId: Types.ObjectId;
  items: IGroceryItem[];
  lastSyncedAt: Date;
  syncedFrom: Date;
}

const GroceryItemSchema = new Schema<IGroceryItem>({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Proteins', 'Vegetables', 'Dairy', 'Grains', 'Fruits', 'Spices', 'Other'],
    default: 'Other'
  },
  totalQuantity: { type: Number, default: 0 },
  unit: { type: String, default: 'g' },
  isPurchased: { type: Boolean, default: false },
  consumers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

const GroceryListSchema = new Schema<IGroceryList>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [GroceryItemSchema],
  lastSyncedAt: { type: Date },
  syncedFrom: { type: Date },
}, { timestamps: true });

// GroceryListSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model<IGroceryList>('GroceryList', GroceryListSchema);