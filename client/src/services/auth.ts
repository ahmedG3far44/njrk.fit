import { api } from '../lib/fetchApi'
import { type User } from './mockData'

export type { User }

export interface AuthResponse {
  user: User
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
    const data = await api.post<AuthResponse>('/auth/login', credentials, true)
    localStorage.setItem("user", JSON.stringify(data.user))
    return data
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const data = await api.post<AuthResponse>('/auth/register', userData, true)
    return data
  },
  async getCurrentUser(): Promise<User> {
    const data = await api.get<User>('/user/me')
    console.log("getting current user data...............")
    console.log(data)
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout', {}, true)
  },

  // async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
  //   const data = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', {})
  //   return data
  // },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const data = await api.post<{ message: string }>('/auth/forgot-password', { email }, true)
    return data
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const data = await api.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    })
    return data
  },

  getGoogleAuthUrl(): string {
    return `${import.meta.env.VITE_API_URL || '/api'}/auth/google`
  },
}