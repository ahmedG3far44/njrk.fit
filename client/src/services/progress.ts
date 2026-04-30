import { api } from '../lib/fetchApi'
import {
  // mockProgressLogs,
  type ProgressLog as ProgressLogType
} from './mockData'

export type ProgressLog = ProgressLogType

export interface ProgressWeight {
  _id: string
  weightKg: number
  createdAt: string
}

export interface WeightTrend {
  _id: string
  weightKg: number
  logs: ProgressLog[]
}

export interface StepData {
  _id: string
  steps: number
}

export interface ProgressDashboard {
  timeframe: string
  weightTrend: WeightTrend[]
  stepData?: StepData[]
  latestWeight: number
  totalLogs: number
  totalWorkouts?: number
  weightLost?: number
  avgProtein?: number
  streakDays?: number
}

export interface ProgressPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ExtractedInBody {
  weightKg: number
  bodyFatPercentage: number
  muscleMass: number
}

export interface FeelingsLog {
  date: string
  tags: string[]
  notes: string
}

export const progressService = {
  async getDashboard(timeframe = '7days'): Promise<ProgressDashboard> {
    // if (USE_MOCK) {
    //   const latestWeight = mockProgressLogs[mockProgressLogs.length - 1]?.weightKg || 70
    //   const firstWeight = mockProgressLogs[0]?.weightKg || 75
    //   return {
    //     timeframe,
    //     weightTrend: [
    //       {
    //         _id: 'trend-1',
    //         weightKg: latestWeight,
    //         logs: mockProgressLogs,
    //       },
    //     ],
    //     stepData: mockProgressLogs.map((log, i) => ({
    //       _id: `step-${i}`,
    //       steps: log.dailySteps || 8000,
    //     })),
    //     latestWeight,
    //     totalLogs: mockProgressLogs.length,
    //     totalWorkouts: 24,
    //     weightLost: firstWeight - latestWeight,
    //     avgProtein: 120,
    //     streakDays: 15,
    //   }
    // }
    const data = await api.get<ProgressDashboard>(`/progress/dashboard?timeframe=${timeframe}`)
    return data
  },

  async getHistory(page = 1, limit = 10): Promise<{ logs: ProgressLog[]; pagination: ProgressPagination }> {
      // if (USE_MOCK) {
      //   const start = (page - 1) * limit
      //   const logs = mockProgressLogs.slice(start, start + limit)
      //   return {
      //     logs,
      //     pagination: {
      //       page,
      //       limit,
      //       total: mockProgressLogs.length,
      //       totalPages: Math.ceil(mockProgressLogs.length / limit),
      //     },
      //   }
      // }
    const data = await api.get<{ logs: ProgressLog[]; pagination: ProgressPagination }>(`/progress/history?page=${page}&limit=${limit}`)
    return data
  },

  async extractInBody(file: File): Promise<{ extracted: ExtractedInBody }> {
    // if (USE_MOCK) {
    //   return {
    //     extracted: {
    //       weightKg: 70,
    //       bodyFatPercentage: 12,
    //       muscleMass: 38,
    //     },
    //   }
    // }
    const formData = new FormData()
    formData.append('scanFile', file)
    const data = await api.postFormData<{ extracted: ExtractedInBody }>('/progress/extract-inbody', formData)
    return data
  },

  async getFeelings(days = 7): Promise<{ feelings: FeelingsLog[]}> {
    // if (USE_MOCK) {
    //   return {
    //     feelings: [
    //       { date: '2026-04-23', tags: ['great', ' energetic'], notes: 'Feeling amazing today!' },
    //       { date: '2026-04-22', tags: ['good', ' focused'], notes: 'Great workout session' },
    //       { date: '2026-04-21', tags: ['okay'], notes: 'Rest day' },
    //       { date: '2026-04-20', tags: ['tired'], notes: 'Long day at work' },
    //       { date: '2026-04-19', tags: ['good', ' strong'], notes: 'Hit new PR!' },
    //       { date: '2026-04-18', tags: ['great'], notes: 'Perfect training day' },
    //       { date: '2026-04-17', tags: ['good', ' sore'], notes: 'Leg day killed me' },
    //     ].slice(0, days),
    //   }
    // }
    const data = await api.get<{ feelings: FeelingsLog[] }>(`/progress/feelings?days=${days}`)
    return data
  },

  async logProgress(data: {
    weightKg?: number
    bodyFatPercentage?: number
    muscleMass?: number
    dailySteps?: number
    tags?: string[]
    notes?: string
    scanFile?: File
  }): Promise<{ progressLog: ProgressLog }> {
    // if (USE_MOCK) {
    //   const newLog: ProgressLog = {
    //     _id: `log-${Date.now()}`,
    //     userId: 'user-123',
    //     weightKg: data.weightKg,
    //     bodyFatPercentage: data.bodyFatPercentage,
    //     muscleMass: data.muscleMass,
    //     dailySteps: data.dailySteps,
    //     tags: data.tags,
    //     notes: data.notes,
    //     createdAt: new Date().toISOString(),
    //   }
    //   mockProgressLogs.push(newLog)
    //   return { progressLog: newLog }
    // }
    const formData = new FormData()
    if (data.weightKg) formData.append('weightKg', String(data.weightKg))
    if (data.bodyFatPercentage) formData.append('bodyFatPercentage', String(data.bodyFatPercentage))
    if (data.muscleMass) formData.append('muscleMass', String(data.muscleMass))
    if (data.dailySteps) formData.append('dailySteps', String(data.dailySteps))
    if (data.tags) formData.append('tags', JSON.stringify(data.tags))
    if (data.notes) formData.append('notes', data.notes)
    if (data.scanFile) formData.append('scanFile', data.scanFile)
    const response = await api.postFormData<{ progressLog: ProgressLog }>('/progress/log', formData)
    return response
  },
}