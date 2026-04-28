import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  Gender, WeightUnit, HeightUnit, Religion, Goal, ActivityLevel
} from '../types';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  googleId?: string;
  appleId?: string;
  name: string;
  avatarUrl?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: Gender;
  weightUnit?: WeightUnit;
  heightUnit?: HeightUnit;
  religion?: Religion;
  goal?: Goal;
  targetWeight?: number;
  activityLevel?: ActivityLevel;
  fitnessGoals: string[];
  dietaryRestrictions: string[];
  equipment: string[];
  subscriptionTier: 'BASIC' | 'PRO' | 'FAMILY';
  familyMembers: Types.ObjectId[];
  subscription?: {
    planId: string;
    status: 'active' | 'canceled' | 'expired' | 'past_due';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  };
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate?: Date;
  availableFreezes: number;
  totalPoints: number;
  pointsToRedeem: number;
  estimatedSteps: number;
  estimatedSleepHours: number;
  estimatedWaterOz: number;
  onboardingCompleted: boolean;
  preferences: {
    notifications: boolean;
    weeklySummary: boolean;
    mealReminders: boolean;
    autoGenerateMeals: boolean;
    isFasting: boolean;
    reminderTime?: string;
    reminderTypes?: string[];
  };
  medicalCondition?: string;
  allergies?: string[];
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, lowercase: true, unique: true },
  passwordHash: { type: String },
  googleId: { type: String, sparse: true, unique: true },
  appleId: { type: String, sparse: true, unique: true },
  name: { type: String, required: true },
  avatarUrl: { type: String },
  height: { type: Number },
  weight: { type: Number },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female'] },
  weightUnit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
  heightUnit: { type: String, enum: ['cm', 'in'], default: 'cm' },
  religion: { type: String, enum: ['muslim', 'christian'] },
  goal: {
    type: String,
    enum: ['lose_weight', 'gain_weight', 'maintain_weight'],
    default: 'maintain_weight'
  },
  targetWeight: { type: Number },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  fitnessGoals: [{ type: String }],
  dietaryRestrictions: [{ type: String }],
  equipment: [{ type: String }],
  subscriptionTier: {
    type: String,
    enum: ['BASIC', 'PRO', 'FAMILY'],
    default: 'BASIC'
  },
  familyMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscription: {
    planId: { type: String },
    status: { type: String, enum: ['active', 'cancelled', 'expired'] },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    currentPeriodEnd: { type: Date },
    paidPriceId: { type: String },
  },
  onboardingCompleted: { type: Boolean, default: false },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCheckInDate: { type: Date },
  availableFreezes: { type: Number, default: 2 },
  totalPoints: { type: Number, default: 0 },
  pointsToRedeem: { type: Number, default: 0 },
  estimatedSteps: { type: Number, default: 5000 },
  estimatedSleepHours: { type: Number, default: 7.5 },
  estimatedWaterOz: { type: Number, default: 64 },
  preferences: {
    notifications: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    mealReminders: { type: Boolean, default: true },
    autoGenerateMeals: { type: Boolean, default: false },
    fasting: { type: Boolean, default: false },
    reminderTime: { type: String },
    reminderTypes: [{ type: String }],
  },
  medicalCondition: { type: String },
  allergies: [{ type: String }],
}, { timestamps: true });

// UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ totalPoints: -1 });
UserSchema.index({ currentStreak: -1 });

export default mongoose.model<IUser>('User', UserSchema);