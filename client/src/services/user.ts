import api from '../lib/api'
import { USE_MOCK, mockUser, type User, type UpdateUserData } from './mockData'

export type { UpdateUserData }

let currentUser: User = { ...mockUser }

export const userService = {
  async getProfile(): Promise<{ user: User }> {
    if (USE_MOCK) {
      return { user: currentUser }
    }
    const { data } = await api.get<{ user: User }>('/users/me')
    return data
  },

  async updateProfile(updates: UpdateUserData): Promise<{ user: User }> {
    if (USE_MOCK) {
      currentUser = { ...currentUser, ...updates } as User
      return { user: currentUser }
    }
    const { data } = await api.patch<{ user: User }>('/users/me', updates)
    return data
  },

  async deleteAccount(): Promise<{ message: string }> {
    if (USE_MOCK) {
      currentUser = { ...mockUser }
      return { message: 'Account deleted successfully' }
    }
    const { data } = await api.delete<{ message: string }>('/users/me')
    return data
  },

  async uploadAvatar(file: File): Promise<{ user: User; avatarUrl: string }> {
    if (USE_MOCK) {
      const url = URL.createObjectURL(file)
      currentUser.avatarUrl = url
      return { user: currentUser, avatarUrl: url }
    }
    const formData = new FormData()
    formData.append('avatar', file)
    const { data } = await api.post<{ user: User; avatarUrl: string }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}