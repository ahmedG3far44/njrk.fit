import { api } from '../lib/api';

export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  subscriptionTier: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  fitnessGoals?: string[];
  dietaryRestrictions?: string[];
  equipment?: string[];
  preferences?: {
    notifications?: boolean;
    weeklySummary?: boolean;
    mealReminders?: boolean;
  };
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken?: string;
  refreshToken?: string;
  redirect?: string;
}

export interface OnboardingData {
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  allergies?: string[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  religion: 'muslim' | 'christian';
  dietaryRestrictions?: string[];
  medicalDocuments?: string[];
  userGoal: 'lose_weight' | 'gain_weight' | 'maintain_weight';
  targetWeight: number;
  fitnessGoal: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export const authService = {
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', credentials, { skipAuthRefresh: true });
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', credentials, { skipAuthRefresh: true });
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    return api.post<{ accessToken: string }>('/auth/refresh-token', undefined, { skipAuthRefresh: true });
  },

  async logout(): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/auth/logout', undefined, { skipAuthRefresh: true });
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return api.post<ForgotPasswordResponse>('/auth/forgot-password', { email }, { skipAuthRefresh: true });
  },

  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>('/auth/reset-password', data, { skipAuthRefresh: true });
  },

  async completeOnboarding(profile: OnboardingData): Promise<{ message: string; redirect: string }> {
    return api.post<{ message: string; redirect: string }>('/auth/onboarding', profile);
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return api.get<{ user: User }>('/auth/me');
  },

  async resendVerification(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/resend-verification');
  },
};