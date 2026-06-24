import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { gamificationService } from '../services/gamificationService';
import i18n from '../i18n/i18n';

const STORAGE_KEY = 'njerka_user';

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  subscriptionTier?: string;
  googleId?: string;
  isEmailVerified?: boolean;
  estimatedSteps?: number;
  preferences?: {
    notifications?: boolean;
    weeklySummary?: boolean;
    mealReminders?: boolean;
    autoGenerateMeals?: boolean;
    isFasting?: boolean;
    familyPlan?: boolean;
    repeatMealsEveryDay?: boolean;
    manualPrompt?: string;
  }
  familyMembers?: number, 
  createdAt?: string,
  updatedAt?: string,
  subscription?: {
    status: string,
    planId: string,
    currentPeriodEnd: string,
    cancelAtPeriodEnd: boolean,
    subscriptionTier: string,
    cardLast4: string,
    subscriptionStartDate: string,
    planName: string,
    planPrice: number,
  }
  dietaryRestrictions?: string[];
  allergies?: string[];
  language?: 'en' | 'ar';
  [key: string]: unknown;
}

export interface Credentials {
  email: string;
  password: string;
  name?: string;
}

export interface OnboardingData {
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  allergies?: string[];
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  religion: 'muslim' | 'christian';
  dietaryRestrictions?: string[];
  userGoal: 'lose_weight' | 'gain_weight' | 'maintain_weight';
  targetWeight: number;
  fitnessGoal: string;
  goalDate?: string;
  language?: 'en' | 'ar';
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGoogleUser: boolean;
  login: (credentials: Credentials) => Promise<{ needsOnboarding: boolean }>;
  register: (credentials: Credentials) => Promise<{ needsOnboarding: boolean }>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface MeResponse {
  user: AuthUser;
}

interface AuthLoginResponse {
  success: boolean;
  user: AuthUser;
  redirect: string;
}

interface OnboardingResponse {
  message: string;
  redirect: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const syncLanguage = (user: AuthUser) => {
  if (user.language) {
    i18n.changeLanguage(user.language);
  }
};

const saveUserToStorage = (user: AuthUser) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage errors
  }
};

const removeUserFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};

const getUserFromStorage = (): AuthUser | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    removeUserFromStorage();
  }, []);

  const loadSession = useCallback(async () => {
    // First try to load from localStorage for immediate UI
    const storedUser = getUserFromStorage();
    if (storedUser) {
      setUser(storedUser);
      syncLanguage(storedUser);
    }

    // Then verify with backend (parallel: user fetch + check-in)
    try {
      const [response] = await Promise.all([
        api.get<MeResponse>('/users/me'),
        gamificationService.checkIn().catch(() => {}),
      ]);
      setUser(response.user);
      saveUserToStorage(response.user);
      syncLanguage(response.user);
    } catch (error) {
      // Only clear session on explicit auth failures, not transient network errors
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
      } else {
        console.warn('Session load failed (keeping cached user):', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<MeResponse>('/users/me');
      setUser(response.user);
      saveUserToStorage(response.user);
      syncLanguage(response.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
      } else {
        console.warn('Refresh user failed (keeping cached user):', error);
      }
    }
  }, [clearSession]);

  const login = useCallback(async (credentials: Credentials) => {
    const response = await api.post<AuthLoginResponse>('/auth/login', credentials, { skipAuthRefresh: true });
    setUser(response.user);
    saveUserToStorage(response.user);
    syncLanguage(response.user);
    
    gamificationService.checkIn().catch(() => {});
    
    return { needsOnboarding: !response.user.onboardingCompleted };
  }, []);

  const register = useCallback(async (credentials: Credentials) => {
    const response = await api.post<AuthLoginResponse>('/auth/register', credentials, { skipAuthRefresh: true });
    setUser(response.user);
    saveUserToStorage(response.user);
    syncLanguage(response.user);
    
    gamificationService.checkIn().catch(() => {});
    
    return { needsOnboarding: !response.user.onboardingCompleted };
  }, []);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    await api.post<OnboardingResponse>('/auth/onboarding', data);
    setUser(prev => {
      const updated = prev ? { ...prev, onboardingCompleted: true, language: data.language || prev.language } : null;
      if (updated) {
        saveUserToStorage(updated);
        syncLanguage(updated);
      }
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', undefined, { skipAuthRefresh: true });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('njerka:unauthorized', handleUnauthorized);

    return () => window.removeEventListener('njerka:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const isGoogleUser = Boolean(user?.googleId);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    isGoogleUser,
    login,
    register,
    completeOnboarding,
    logout,
    refreshUser,
  }), [completeOnboarding, isLoading, isGoogleUser, login, logout, refreshUser, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};