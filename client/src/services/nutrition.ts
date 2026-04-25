import api from '../lib/api'
import {
  USE_MOCK,
  mockNutritionPlans,
  type NutritionPlan as NutritionPlanType
} from './mockData'

export type { Meal } from './mockData'
export type NutritionPlan = NutritionPlanType
export interface GenerateMealPlanData {
  calories: number
  startDate: string
}

export interface RefineMealData {
  refinement: string
  dayIndex: number
}

export const nutritionService = {
  async getCurrent(date?: string): Promise<{ nutritionPlan: NutritionPlan }> {
    if (USE_MOCK) {
      return { nutritionPlan: mockNutritionPlans[0] }
    }
    const params = date ? `?date=${date}` : ''
    const { data } = await api.get<{ nutritionPlan: NutritionPlan }>(`/nutrition/current${params}`)
    return data
  },

  async getWeek(startDate?: string, userId?: string): Promise<{ nutritionPlans: NutritionPlan[] }> {
    if (USE_MOCK) {
      if (userId) {
        const userPlan = mockNutritionPlans.find(p => p.userId === userId)
        if (userPlan) {
          return { nutritionPlans: [userPlan] }
        }
      }
      return { nutritionPlans: mockNutritionPlans }
    }
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (userId) params.append('userId', userId)
    const query = params.toString() ? `?${params.toString()}` : ''
    const { data } = await api.get<{ nutritionPlans: NutritionPlan[] }>(`/nutrition/week${query}`)
    return data
  },

  async getCurrentForUser(date: string, userId: string): Promise<{ nutritionPlan: NutritionPlan }> {
    if (USE_MOCK) {
      const plan = mockNutritionPlans.find(p => p.userId === userId)
      return { nutritionPlan: plan || mockNutritionPlans[0] }
    }
    const params = `?date=${date}&userId=${userId}`
    const { data } = await api.get<{ nutritionPlan: NutritionPlan }>(`/nutrition/current${params}`)
    return data
  },

  async generate(data: GenerateMealPlanData, targetUserId?: string): Promise<{ nutritionPlan: NutritionPlan }> {
    if (USE_MOCK) {
      const targetPlan = mockNutritionPlans.find(p => p.userId === (targetUserId || 'user-123'))
      return { nutritionPlan: targetPlan || mockNutritionPlans[0] }
    }
    const payload = targetUserId ? { ...data, userId: targetUserId } : data
    const { data: response } = await api.post<{ nutritionPlan: NutritionPlan }>('/nutrition/generate', payload)
    return response
  },

  async refine(mealId: string, data: RefineMealData): Promise<{ nutritionPlan: NutritionPlan }> {
    if (USE_MOCK) {
      return { nutritionPlan: mockNutritionPlans[0] }
    }
    const { data: response } = await api.post<{ nutritionPlan: NutritionPlan }>(`/nutrition/refine/${mealId}`, data)
    return response
  },
}