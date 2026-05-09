import { api } from '../lib/api';

export interface CheckInResponse {
  currentStreak: number;
  longestStreak: number;
  availableFreezes: number;
  isFirstCheckIn: boolean;
  isFrozen: boolean;
  message: string;
}

export interface FreezeData {
  timezoneOffset?: number;
}

export interface FreezeResponse {
  success: boolean;
  availableFreezes?: number;
  currentStreak?: number;
  message: string;
}

export interface GamificationStatus {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string;
  availableFreezes: number;
  totalPoints: number;
  pointsToRedeem: number;
}

export interface Reward {
  _id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: string;
}

export interface ClaimRewardData {
  rewardId: string;
}

export interface ActivityParams {
  timezoneOffset?: number;
  month?: number;
  year?: number;
}

export const gamificationService = {
  async checkIn(): Promise<CheckInResponse> {
    return api.post<CheckInResponse>('/gamification/check-in');
  },

  async useFreeze(data?: FreezeData): Promise<FreezeResponse> {
    return api.post<FreezeResponse>('/gamification/freeze', data ?? {});
  },

  async applyFreeze(): Promise<FreezeResponse> {
    return api.post<FreezeResponse>('/gamification/apply-freeze');
  },

  async getStatus(): Promise<GamificationStatus> {
    return api.get<GamificationStatus>('/gamification/status');
  },

  async getInsights(): Promise<unknown> {
    return api.get('/gamification/insights');
  },

  async getActivity(params?: ActivityParams): Promise<unknown> {
    const searchParams = new URLSearchParams();
    if (params?.timezoneOffset !== undefined) searchParams.append('timezoneOffset', String(params.timezoneOffset));
    if (params?.month !== undefined) searchParams.append('month', String(params.month));
    if (params?.year !== undefined) searchParams.append('year', String(params.year));
    const query = searchParams.toString();
    return api.get(`/gamification/activity${query ? `?${query}` : ''}`);
  },

  async getRewards(): Promise<{ rewards: Reward[] }> {
    return api.get<{ rewards: Reward[] }>('/gamification/rewards');
  },

  async claimReward(data: ClaimRewardData): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/gamification/rewards/claim', data);
  },
};