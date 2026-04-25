import api from '../lib/api'
import { USE_MOCK, mockUser, type User } from './mockData'

export type { User }

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (USE_MOCK) {
      const loggedInUser: User = {
        ...mockUser,
        email: credentials.email,
      }
      localStorage.setItem('accessToken', 'mock-token')
      localStorage.setItem('refreshToken', 'mock-refresh')
      return { user: loggedInUser, accessToken: 'mock-token', refreshToken: 'mock-refresh' }
    }
    const { data } = await api.post<AuthResponse>('/auth/login', credentials)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    if (USE_MOCK) {
      const newUser: User = {
        ...mockUser,
        _id: 'user-new',
        email: userData.email,
        name: userData.name,
        subscriptionTier: undefined,
        subscription: undefined,
      }
      localStorage.setItem('accessToken', 'mock-token')
      localStorage.setItem('refreshToken', 'mock-refresh')
      return { user: newUser, accessToken: 'mock-token', refreshToken: 'mock-refresh' }
    }
    const { data } = await api.post<AuthResponse>('/auth/register', userData)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  },

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken')
    const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh-token',
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    )
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    })
    return data
  },

  getGoogleAuthUrl(): string {
    return `${import.meta.env.VITE_API_URL || '/api'}/auth/google`
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  },
}