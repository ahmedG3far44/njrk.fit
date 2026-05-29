import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminUser } from '../lib/adminApi';

interface AdminCredentials {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  admin: AdminUser;
  token: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AdminCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAdmin(null);
    adminApi.removeToken();
    adminApi.removeAdminUser();
  }, []);

  const loadSession = useCallback(async () => {
    const storedAdmin = adminApi.getAdminUser();
    if (storedAdmin) {
      setAdmin(storedAdmin);
    }

    const token = adminApi.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await adminApi.get<{ admin: AdminUser }>('/admin/auth/me');
      setAdmin(response.admin);
      adminApi.setAdminUser(response.admin);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  const login = useCallback(async (credentials: AdminCredentials) => {
    const response = await adminApi.post<AdminLoginResponse>('/admin/auth/login', credentials);
    adminApi.setToken(response.token);
    adminApi.setAdminUser(response.admin);
    setAdmin(response.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.post('/admin/auth/logout');
    } catch {
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('njerka:admin-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('njerka:admin-unauthorized', handleUnauthorized);
  }, [clearSession]);

  const value = useMemo<AdminAuthContextValue>(() => ({
    admin,
    isAuthenticated: Boolean(admin),
    isLoading,
    login,
    logout,
  }), [admin, isLoading, login, logout]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return context;
};
