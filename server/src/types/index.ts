// ============================================================================
// CORE TYPES - Consolidated for Njerka.fit Backend
// ============================================================================

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------

export type Gender = 'male' | 'female';
export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'in';
export type Religion = 'muslim' | 'christian';
export type Goal = 'lose_weight' | 'gain_weight' | 'maintain_weight';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type WorkoutType = 'Strength' | 'Cardio' | 'Yoga' | 'Mixed' | 'Recovery';

// ----------------------------------------------------------------------------
// User Context (used for calorie calculations & LLM prompts)
// ----------------------------------------------------------------------------

export interface UserContext {
  name: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: Gender;
  religion?: Religion;
  weightUnit?: WeightUnit;
  heightUnit?: HeightUnit;
  goal?: Goal;
  targetWeight?: number;
  activityLevel?: ActivityLevel;
  fitnessGoals?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  isFasting?: boolean;
  trainingDays?: number;
  equipment?: string[];
}

// ----------------------------------------------------------------------------
// Macros & Nutrition
// ----------------------------------------------------------------------------

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export interface Meal {
  _id?: string;
  day: string;
  name: string;
  time: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
}

export interface NutritionPlan {
  _id?: string;
  userId: string;
  date: Date;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: Meal[];
}

// ----------------------------------------------------------------------------
// Workout & Fitness
// ----------------------------------------------------------------------------

export interface Exercise {
  _id?: string;
  name: string;
  sets: number;
  reps: string;
  durationMin?: number;
  isCompleted?: boolean;
}

export interface WorkoutSession {
  _id?: string;
  dayOfWeek: string;
  date: Date;
  type: WorkoutType;
  name: string;
  durationMin: number;
  estimatedCaloriesBurn: number;
  isCompleted: boolean;
  exercises: Exercise[];
}

export interface WeeklyFitnessPlan {
  _id?: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  sessionsCompleted: number;
  sessions: WorkoutSession[];
}

// ----------------------------------------------------------------------------
// Progress
// ----------------------------------------------------------------------------

export interface ProgressLog {
  _id?: string;
  userId: string;
  date: Date;
  weightKg?: number;
  tags: string[];
  notes?: string;
  scanFileUrl?: string;
}

// ----------------------------------------------------------------------------
// Community
// ----------------------------------------------------------------------------

export interface Post {
  _id?: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  _id?: string;
  postId: string;
  userId: string;
  content: string;
}

export interface Like {
  _id?: string;
  postId: string;
  userId: string;
}

// ----------------------------------------------------------------------------
// API Response Types
// ----------------------------------------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ----------------------------------------------------------------------------
// Auth Types
// ----------------------------------------------------------------------------

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  _id: string;
  email: string;
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
  subscription?: {
    planId: string;
    status: 'active' | 'cancelled' | 'expired';
  };
  currentStreak: number;
  longestStreak: number;
  availableFreezes: number;
  preferences: {
    notifications: boolean;
    weeklySummary: boolean;
    mealReminders: boolean;
  };
}


export interface Groceries {
  _id: string;
  userId: string;
  date: Date;
  items: string[];

} 