import { api } from '../lib/api';

export interface ProgressLog {
  _id: string;
  userId: string;
  date: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  dailySteps?: number;
  tags: string[];
  notes?: string;
  scanFileUrl?: string;
  source: string;
}

export interface WeightTrend {
  _id: string;
  weightKg: number;
  logs: ProgressLog[];
}

export interface LogProgressData {
  scanFile?: File;
  weightKg?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  dailySteps?: number;
  tags?: string[];
  notes?: string;
  source?: 'manual' | 'inbody_scan';
}

export interface ExtractInBodyData {
  scanFile: File;
}

export interface ExtractedData {
  weightKg: number;
  bodyFatPercentage: number;
  muscleMass: number;
}

export interface FeelingLog {
  date: string;
  tags: string[];
  notes?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const progressService = {
  async log(data: LogProgressData): Promise<{ progressLog: ProgressLog }> {
    const formData = new FormData();
    if (data.scanFile) formData.append('scanFile', data.scanFile);
    if (data.weightKg !== undefined) formData.append('weightKg', String(data.weightKg));
    if (data.bodyFatPercentage !== undefined) formData.append('bodyFatPercentage', String(data.bodyFatPercentage));
    if (data.muscleMass !== undefined) formData.append('muscleMass', String(data.muscleMass));
    if (data.dailySteps !== undefined) formData.append('dailySteps', String(data.dailySteps));
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.notes) formData.append('notes', data.notes);
    if (data.source) formData.append('source', data.source);

    return api.post<{ progressLog: ProgressLog }>('/progress/log', formData);
  },

  async getDashboard(params?: { timeframe?: '7days' | '30days' | '7weeks' }): Promise<{
    timeframe: string;
    weightTrend: WeightTrend[];
    latestWeight: number;
    totalLogs: number;
  }> {
    const query = params?.timeframe ? `?timeframe=${params.timeframe}` : '';
    return api.get<{ timeframe: string; weightTrend: WeightTrend[]; latestWeight: number; totalLogs: number }>(`/progress/dashboard${query}`);
  },

  async getHistory(params?: { page?: number; limit?: number }): Promise<{ logs: ProgressLog[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return api.get<{ logs: ProgressLog[]; pagination: Pagination }>(`/progress/history${query ? `?${query}` : ''}`);
  },

  async extractInBody(data: ExtractInBodyData): Promise<{ extracted: ExtractedData }> {
    const formData = new FormData();
    formData.append('scanFile', data.scanFile);
    return api.post<{ extracted: ExtractedData }>('/progress/extract-inbody', formData);
  },

  async getFeelings(params?: { days?: number }): Promise<{ feelings: FeelingLog[] }> {
    const query = params?.days ? `?days=${params.days}` : '';
    return api.get<{ feelings: FeelingLog[] }>(`/progress/feelings${query}`);
  },
};