import api from '../lib/api'
import { 
  USE_MOCK, 
  mockWorkoutPlan, 
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
  async getCurrent(view: 'day' | 'week' = 'week'): Promise<{ workoutPlan: WorkoutPlan }> {
    if (USE_MOCK) {
      return { workoutPlan: mockWorkoutPlan }
    }
    const { data } = await api.get<{ workoutPlan?: WorkoutPlan; data?: WorkoutSession[] }>(`/fitness/current?date=${view}`)

    if (data.workoutPlan) {
      return data as { workoutPlan: WorkoutPlan }
    }

    const sessions = data.data || []
    return {
      workoutPlan: {
        _id: 'current-workout-plan',
        userId: 'current-user',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        sessionsCompleted: sessions.filter((session) => session.isCompleted).length,
        sessions,
      },
    }
  },

  async generate(data: GenerateWorkoutData): Promise<{ workoutPlan: WorkoutPlan }> {
    if (USE_MOCK) {
      return { workoutPlan: mockWorkoutPlan }
    }
    const { data: response } = await api.post<{ workoutPlan: WorkoutPlan }>('/fitness/generate', data)
    return response
  },

  async completeSession(
    sessionId: string,
    data?: CompleteSessionData
  ): Promise<{ workoutPlan: WorkoutPlan; sessionCompleted: { isCompleted: boolean } }> {
    if (USE_MOCK) {
      return { 
        workoutPlan: mockWorkoutPlan, 
        sessionCompleted: { isCompleted: true } 
      }
    }
    const { data: response } = await api.patch<{
      workoutPlan: WorkoutPlan
      sessionCompleted: { isCompleted: boolean }
    }>(`/fitness/session/${sessionId}/complete`, data)
    return response
  },

  async exportPdf(view: 'day' | 'week'): Promise<Blob> {
    if (USE_MOCK) {
      return new Blob(['Mock fitness PDF'], { type: 'application/pdf' })
    }
    const { data } = await api.get(`/fitness/export/pdf?view=${view}`, {
      responseType: 'blob',
    })
    return data
  },
}
