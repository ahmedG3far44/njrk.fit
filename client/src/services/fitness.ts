import { api } from '../lib/fetchApi'
import {
  // USE_MOCK, 
  // mockWorkoutPlan, 
  type Exercise as ExerciseType,
  type WorkoutSession as WorkoutSessionType,
  type WorkoutPlan as WorkoutPlanType
} from './mockData'

export type Exercise = ExerciseType
export type WorkoutSession = WorkoutSessionType
export type WorkoutPlan = WorkoutPlanType

export interface GenerateWorkoutData {
  duration: number
  equipment: string[]
  startDate: string
}

export interface CompleteSessionData {
  exerciseIndices?: number[]
}

export const fitnessService = {
  async getCurrent(date?: "week" | "today"): Promise<{ workoutPlan: WorkoutPlan }> {
    // if (USE_MOCK) {
    //   return { workoutPlan: mockWorkoutPlan }
    // }
    // if (!date) {
    //   return { workoutPlan: mockWorkoutPlan }
    // }
    const params = date ? `?date=${date}` : ''
    const data = await api.get<{ workoutPlan: WorkoutPlan }>(`/fitness/current${params}`)
    return data
  },

  async generate(generateWorkoutData: GenerateWorkoutData): Promise<{ workoutPlan: WorkoutPlan }> {
    // if (USE_MOCK) {
    //   return { workoutPlan: mockWorkoutPlan }
    // }
    const data = await api.post<{ workoutPlan: WorkoutPlan }>('/fitness/generate', generateWorkoutData)
    return data
  },

  async completeSession(
    sessionId: string,
    data?: CompleteSessionData
  ): Promise<{ workoutPlan: WorkoutPlan; sessionCompleted: { isCompleted: boolean } }> {
    // if (USE_MOCK) {
    //   return { 
    //     workoutPlan: mockWorkoutPlan, 
    //     sessionCompleted: { isCompleted: true } 
    //   }
    // }
    const response = await api.patch<{
      workoutPlan: WorkoutPlan
      sessionCompleted: { isCompleted: boolean }
    }>(`/fitness/session/${sessionId}/complete`, data)
    return response
  },
}