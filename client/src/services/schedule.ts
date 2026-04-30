import { api } from '../lib/fetchApi'
import { type ScheduleItem as ScheduleItemType, type Schedule as ScheduleType } from './mockData'

export type ScheduleItem = ScheduleItemType
export type Schedule = ScheduleType

export interface TimelineEvent {
  id: string
  type: 'meal' | 'workout'
  time: string
  title: string
  metadata: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    durationMin?: number
    exerciseType?: string
    exerciseCount?: number
  }
  isCompleted: boolean
}

export const scheduleService = {
  async getSchedule(date?: string): Promise<Schedule> {
    // if (USE_MOCK) {
    //   if (date) {
    //     return { ...mockSchedule, date }
    //   }
    //   return { ...mockSchedule }
    // }
    const params = date ? `?date=${date}` : ''
    const data = await api.get<Schedule>(`/schedule${params}`)
    console.log(data)
    return data
  },

  async toggleComplete(itemId: string, isCompleted: boolean): Promise<{ success: boolean }> {
    // if (USE_MOCK) {
    //   return { success: true }
    // }
    const data = await api.patch<{ success: boolean }>(`/schedule/${itemId}/complete`, {
      isCompleted,
    })
    return data
  },
}