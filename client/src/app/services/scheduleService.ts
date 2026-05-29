import { api } from '../lib/api';

export interface ScheduleItem {
  type: 'meal' | 'snack' | 'workout';
  id: string;
  name: string;
  time: string;
  details: ScheduleDetails;
}

export interface ScheduleDetails {
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients?: string[];
  instructions?: string[];
  type?: string;
  durationMin?: number;
  estimatedCaloriesBurn?: number;
  mealType?: 'meal' | 'snack';
  exercises?: Array<{
    name: string;
    sets?: number;
    reps?: number;
    durationMin?: number;
  }>;
  isCompleted?: boolean;
}

export interface ScheduleResponse {
  date: string;
  timeline: ScheduleItem[];
}

export interface CompleteItemData {
  isCompleted: boolean;
}

export const scheduleService = {
  async getTimeline(date?: string): Promise<ScheduleResponse> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return api.get<ScheduleResponse>(`/schedule${query}`);
  },

  async completeItem(itemId: string, data: CompleteItemData): Promise<{ success: boolean }> {
    return api.patch<{ success: boolean }>(`/schedule/${itemId}/complete`, data);
  },
};