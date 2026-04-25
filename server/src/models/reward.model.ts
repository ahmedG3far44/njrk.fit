import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReward {
  rewardId: string;
  name: string;
  description: string;
  requiredStreak: number;
  pointsReward: number;
  badgeIcon: string;
}

export interface IUserReward extends Document {
  userId: Types.ObjectId;
  rewardId: string;
  claimedAt: Date;
  idempotencyKey: string;
}

const REWARD_CATALOG: IReward[] = [
  {
    rewardId: 'streak_7',
    name: 'Week Warrior',
    description: 'Check in for 7 days straight',
    requiredStreak: 7,
    pointsReward: 100,
    badgeIcon: 'shield',
  },
  {
    rewardId: 'streak_14',
    name: 'Fortnight Fighter',
    description: 'Check in for 14 days straight',
    requiredStreak: 14,
    pointsReward: 250,
    badgeIcon: 'medal',
  },
  {
    rewardId: 'streak_30',
    name: 'Monthly Master',
    description: 'Check in for 30 days straight',
    requiredStreak: 30,
    pointsReward: 500,
    badgeIcon: 'trophy',
  },
  {
    rewardId: 'streak_50',
    name: 'Half Century',
    description: 'Check in for 50 days straight',
    requiredStreak: 50,
    pointsReward: 750,
    badgeIcon: 'crown',
  },
  {
    rewardId: 'streak_100',
    name: 'Centurion',
    description: 'Check in for 100 days straight',
    requiredStreak: 100,
    pointsReward: 1500,
    badgeIcon: 'star',
  },
];

export const getRewardCatalog = (): IReward[] => REWARD_CATALOG;

export const getRewardById = (rewardId: string): IReward | undefined => 
  REWARD_CATALOG.find(r => r.rewardId === rewardId);

const UserRewardSchema = new Schema<IUserReward>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rewardId: { type: String, required: true },
  claimedAt: { type: Date, default: Date.now },
  idempotencyKey: { type: String, required: true, unique: true },
}, { timestamps: true });

UserRewardSchema.index({ userId: 1, rewardId: 1 }, { unique: true });

export default mongoose.model<IUserReward>('UserReward', UserRewardSchema);