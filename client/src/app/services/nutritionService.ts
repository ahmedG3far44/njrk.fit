import { api } from '../lib/api';

export interface MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealItem {
  quantity: number;
  unit: string;
  name: string;
  _id?: string;
}

export interface Meal {
  _id: string;
  day?: string;
  name: string;
  time: string;
  macros: MealMacros;
  ingredients?: MealItem[];
  instructions?: string[];
  isCompleted?: boolean;
}

export interface NutritionPlan {
  _id: string;
  userId: string;
  date: string;
  targetMacros: MealMacros;
  meals: Meal[];
}

export interface GenerateNutritionData {
  calories?: number;
  startDate?: string;
  userId?: string;
}

export interface RefineMealData {
  refinement: string;
  dayIndex?: number;
}

export interface LogMealResponse {
  message: string;
}

export interface MealResponse {
  meals: Meal[];
  targetMacros: MealMacros;
}

export interface GenerateResponse {
  plan: NutritionPlan;
}

export const nutritionService = {
  async generate(data: GenerateNutritionData): Promise<{ plan: NutritionPlan }> {
    return api.post<{ plan: NutritionPlan }>('/nutrition/generate', data);
  },

  async replace(mealId: string): Promise<{ meal: Meal }> {
    return api.post<{ meal: Meal }>(`/nutrition/replace/${mealId}`);
  },

  async refine(mealId: string, data: RefineMealData): Promise<{ meal: Meal }> {
    return api.post<{ meal: Meal }>(`/nutrition/refine/${mealId}`, data);
  },

  async getCurrent(params?: { userId?: string; date?: 'today' | 'week' }): Promise<{ meals: Meal[]; targetMacros: MealMacros }> {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.date) searchParams.append('date', params.date);
    const query = searchParams.toString();
    return api.get<{ meals: Meal[]; targetMacros: MealMacros }>(`/nutrition/current${query ? `?${query}` : ''}`);
  },

  async getWeek(params?: { userId?: string; startDate?: string }): Promise<{ nutritionPlans: NutritionPlan[] }> {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    const query = searchParams.toString();
    return api.get<{ nutritionPlans: NutritionPlan[] }>(`/nutrition/week${query ? `?${query}` : ''}`);
  },

  async logMeal(mealName: string): Promise<LogMealResponse> {
    return api.post<LogMealResponse>('/nutrition/log-meal', { mealName });
  },
};