import { api } from '../lib/api';
import { User } from './authService';

export interface UpdateProfileData {
  name?: string;
  height?: number;
  weight?: number;
  age?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessGoals?: string[];
  dietaryRestrictions?: string[];
  equipment?: string[];
  preferences?: {
    notifications?: boolean;
    weeklySummary?: boolean;
    mealReminders?: boolean;
  };
}

export interface AvatarUploadResponse {
  user: User;
  avatarUrl: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

export const userService = {
  async getProfile(): Promise<{ user: User }> {
    return api.get<{ user: User }>('/users/me');
  },

  async updateProfile(data: UpdateProfileData): Promise<{ user: User }> {
    return api.patch<{ user: User }>('/users/me', data);
  },

  async deleteAccount(): Promise<DeleteAccountResponse> {
    return api.delete<DeleteAccountResponse>('/users/me');
  },

  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.post<AvatarUploadResponse>('/users/me/avatar', formData);
  },
};