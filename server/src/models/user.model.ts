import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  Gender, WeightUnit, HeightUnit, Religion, Goal, ActivityLevel
} from '../types';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  googleId?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
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
  fitnessGoals: string;
  goalDate?: string;
  dietaryRestrictions: string[];
  equipment?: string[];
  trainingProgram?: string;
  trainingDays?: number;
  allergies?: string[];
  familyMembers: Types.ObjectId[];
  subscription: {
    planTier?: string;
    planId?: string;
    status: 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    subscriptionTier: 'BASIC' | 'PRO' | 'FAMILY';
    paidPriceId?: string;
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
  lastStatsUpdate?: Date;
  preferences: {
    notifications: boolean;
    weeklySummary: boolean;
    mealReminders: boolean;
    autoGenerateMeals: boolean;
    isFasting: boolean;
    familyPlan: boolean;
    repeatMealsEveryDay: boolean;
    manualPrompt?: string;
    reminderTime?: string;
    reminderTypes?: string[];
  };
  medicalCondition?: string;
  isBlocked?: boolean;
  blockedAt?: Date;
  blockedReason?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, lowercase: true, unique: true },
  passwordHash: { type: String },
  googleId: { type: String, sparse: true, unique: true },
  googleRefreshToken: { type: String, select: false },
  googleTokenExpiry: { type: Date },
  appleId: { type: String, sparse: true, unique: true },
  name: { type: String, required: true },
  avatarUrl: { type: String },
  height: { type: Number },
  weight: { type: Number },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female'] },
  weightUnit: { type: String, enum: ['kg', 'lb'], default: 'kg' },
  heightUnit: { type: String, enum: ['cm', 'in'], default: 'cm' },
  religion: { type: String, enum: ['muslim', 'christian'], default: 'muslim' },
  goal: {
    type: String,
    enum: ['lose_weight', 'gain_weight', 'maintain_weight'],
    default: 'lose_weight'
  },
  targetWeight: { type: Number },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  fitnessGoals: { type: String },
  goalDate: { type: String },
  dietaryRestrictions: [{ type: String }],
  equipment: [{ type: String }],
  trainingProgram: { type: String, default: 'full_body' },
  trainingDays: { type: Number, default: 3 },

  familyMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  subscription: {
    planTier: { type: String },
    planId: { type: String },
    status: { type: String, enum: ['active', 'trialing', 'canceled', 'expired', 'past_due'] },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    currentPeriodEnd: { type: Date },
    paidPriceId: { type: String },
    subscriptionTier: {
      type: String,
      enum: ['BASIC', 'PRO', 'FAMILY'],
      default: 'BASIC'
    },
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
  lastStatsUpdate: { type: Date },
  preferences: {
    notifications: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    mealReminders: { type: Boolean, default: true },
    autoGenerateMeals: { type: Boolean, default: false },
    isFasting: { type: Boolean, default: false },
    familyPlan: { type: Boolean, default: false },
    repeatMealsEveryDay: { type: Boolean, default: false },
    manualPrompt: { type: String },
    reminderTime: { type: String },
    reminderTypes: [{ type: String }],
  },
  medicalCondition: { type: String },
  allergies: [{ type: String }],
  isBlocked: { type: Boolean, default: false },
  blockedAt: { type: Date },
  blockedReason: { type: String },
}, { timestamps: true });

// UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ totalPoints: -1 });
UserSchema.index({ currentStreak: -1 });

export default mongoose.model<IUser>('User', UserSchema);