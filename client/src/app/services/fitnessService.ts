import { api } from '../lib/api';

export interface Exercise {
  _id: string;
  name: string;
  sets: number;
  reps: number;
  durationMin?: number;
  restSeconds?: number;
  equipment?: string;
  muscleGroup?: string;
  gifUrl?: string;
  exerciseId?: string;
}

export interface WorkoutSession {
  _id: string;
  dayOfWeek: string;
  name: string;
  type: string;
  durationMin: number;
  exercises: Exercise[];
  isCompleted: boolean;
}

export interface WorkoutPlan {
  _id: string;
  userId: string;
  startDate: string;
  endDate: string;
  sessionsCompleted: number;
  sessions: WorkoutSession[];
}

export interface GenerateFitnessData {
  duration: number;        // 15-120, default 60
  trainingDays: number;   // 1-7, default 3
  trainingProgram: 'push_pull_legs' | 'upper_lower' | 'anterior_posterior' | 'arnold_split' | 'full_body';
  startDate?: string;       // ISO date string
}

export interface CompleteSessionData {
  exerciseIndices?: number[];
}

export interface CompleteSessionResponse {
  workoutPlan: WorkoutPlan;
  sessionCompleted: WorkoutSession;
}

export const fitnessService = {
  async generate(data: GenerateFitnessData): Promise<{ workoutPlan: WorkoutPlan }> {
    return api.post<{ workoutPlan: WorkoutPlan }>('/fitness/generate', data);
  },

  async completeSession(sessionId: string, data?: CompleteSessionData): Promise<CompleteSessionResponse> {
    return api.patch<CompleteSessionResponse>(`/fitness/session/${sessionId}/complete`, data ?? {});
  },

  async getCurrent(params: { date: 'today' | 'week' }): Promise<{ data: WorkoutSession[]; planEndDate?: string }> {
    return api.get<{ data: WorkoutSession[]; planEndDate?: string }>(`/fitness/current?date=${params.date}`);
  },
};