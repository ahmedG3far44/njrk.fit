import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFamilyInvitation extends Document {
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

const FamilyInvitationSchema = new Schema<IFamilyInvitation>({
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
});

FamilyInvitationSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export default mongoose.model<IFamilyInvitation>('FamilyInvitation', FamilyInvitationSchema);