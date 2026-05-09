import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const STORAGE_KEY = 'njerka_user';

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  subscriptionTier?: string;
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
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  religion: 'muslim' | 'christian';
  dietaryRestrictions?: string[];
  userGoal: 'lose_weight' | 'gain_weight' | 'maintain_weight';
  targetWeight: number;
  fitnessGoal: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
    }

    // Then verify with backend
    try {
      const response = await api.get<MeResponse>('/users/me');
      setUser(response.user);
      saveUserToStorage(response.user);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<MeResponse>('/users/me');
      setUser(response.user);
      saveUserToStorage(response.user);
    } catch {
      clearSession();
    }
  }, [clearSession]);

  const login = useCallback(async (credentials: Credentials) => {
    const response = await api.post<AuthLoginResponse>('/auth/login', credentials, { skipAuthRefresh: true });
    setUser(response.user);
    saveUserToStorage(response.user);
    return { needsOnboarding: !response.user.onboardingCompleted };
  }, []);

  const register = useCallback(async (credentials: Credentials) => {
    const response = await api.post<AuthLoginResponse>('/auth/register', credentials, { skipAuthRefresh: true });
    setUser(response.user);
    saveUserToStorage(response.user);
    return { needsOnboarding: true };
  }, []);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    await api.post<OnboardingResponse>('/auth/onboarding', data);
    setUser(prev => {
      const updated = prev ? { ...prev, onboardingCompleted: true } : null;
      if (updated) saveUserToStorage(updated);
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

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    completeOnboarding,
    logout,
    refreshUser,
  }), [completeOnboarding, isLoading, login, logout, refreshUser, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};