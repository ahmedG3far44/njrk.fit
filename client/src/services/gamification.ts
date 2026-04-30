import { api } from '../lib/fetchApi'
import { 
  // USE_MOCK,   
  // mockGamificationStatus, 
  // mockActivityHistory, 
  // mockRewards,
  type GamificationStatus as GamificationStatusType,
  type ActivityHistory,
  type Reward 
} from './mockData'

export type GamificationStatus = GamificationStatusType
export type { Reward }

export interface Insights {
  currentStreak: number
  longestStreak: number
  totalPoints: number
  pointsToRedeem: number
  pointsToNextBadge?: number
  estimatedSteps: number
  estimatedSleepHours: number
  estimatedWaterOz: number
}

export interface RewardsResponse {
  rewards: Reward[]
}

const getTimezoneOffset = (): number => -new Date().getTimezoneOffset()

export const gamificationService = {
  async getStatus(): Promise<GamificationStatus> {
    // if (USE_MOCK) return mockGamificationStatus
    const data = await api.get<GamificationStatus>('/gamification/status')
    return data
  },

  async getInsights(): Promise<Insights> {
    // if (USE_MOCK) {
    //   return {
    //     currentStreak: 15,
    //     longestStreak: 45,
    //     totalPoints: 3500,
    //     pointsToRedeem: 2800,
    //     estimatedSteps: 8500,
    //     estimatedSleepHours: 7.5,
    //     estimatedWaterOz: 64,
    //   }
    // }
    const data = await api.get<Insights>('/gamification/insights')
    return data
  },

  async getActivity(month?: number, year?: number): Promise<ActivityHistory> {
    // if (USE_MOCK) {
    //   const currentYear = year || new Date().getFullYear()
    //   const currentMonth = month !== undefined ? month : new Date().getMonth()
      
    //   const activities = mockActivityHistory.activities.filter(a => {
    //     const date = new Date(a.date)
    //     return date.getFullYear() === currentYear && date.getMonth() === currentMonth
    //   })
      
    //   return {
    //     activities,
    //     totalCheckIns: activities.length,
    //   }
    // }
    const params = new URLSearchParams()
    params.append('timezoneOffset', String(getTimezoneOffset()))
    if (month !== undefined) params.append('month', String(month))
    if (year !== undefined) params.append('year', String(year))
    
    const data = await api.get<ActivityHistory>(`/gamification/activity?${params}`)
    return data
  },

  async getRewards(): Promise<RewardsResponse> {
    // if (USE_MOCK) {
    //   return { rewards: mockRewards }
    // }
    const data = await api.get<RewardsResponse>('/gamification/rewards')
    return data
  },

  async checkIn(): Promise<{
    currentStreak: number
    longestStreak: number
    availableFreezes: number
    isFirstCheckIn: boolean
    isFrozen: boolean
    message: string
  }> {
    // if (USE_MOCK) {
    //   return {
    //     currentStreak: mockGamificationStatus.currentStreak + 1,
    //     longestStreak: mockGamificationStatus.longestStreak,
    //     availableFreezes: mockGamificationStatus.availableFreezes,
    //     isFirstCheckIn: false,
    //     isFrozen: false,
    //     message: 'Great job! You checked in!',
    //   }
    // }
    const timezoneOffset = getTimezoneOffset()
    const data = await api.post<{
      currentStreak: number
      longestStreak: number
      availableFreezes: number
      isFirstCheckIn: boolean
      isFrozen: boolean
      message: string
    }>('/gamification/check-in', { timezoneOffset })
    return data
  },

  async freeze(): Promise<{ success: boolean; availableFreezes: number; message: string }> {
    // if (USE_MOCK) {
    //   return {
    //     success: true,
    //     availableFreezes: mockGamificationStatus.availableFreezes - 1,
    //     message: 'Streak frozen!',
    //   }
    // }
    const timezoneOffset = getTimezoneOffset()
    const data = await api.post<{
      success: boolean
      availableFreezes: number
      message: string
    }>('/gamification/freeze', { timezoneOffset })
    return data
  },

  async claimReward(rewardId: string): Promise<{
    success: boolean
    message: string
    pointsAwarded?: number
  }> {
    // if (USE_MOCK) {
    //   const reward = mockRewards.find(r => r.rewardId === rewardId)
    //   if (reward) {
    //     reward.isClaimed = true
    //   }
    //   return {
    //     success: true,
    //     message: 'Reward claimed!',
    //     pointsAwarded: reward?.pointsReward,
    //   }
    // }
    const data = await api.post<{
      success: boolean
      message: string
      pointsAwarded?: number
    }>('/gamification/rewards/claim', { rewardId })
    return data
  },
}