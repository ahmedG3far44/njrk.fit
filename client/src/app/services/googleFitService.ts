import { api } from '../lib/api';

export interface GoogleFitStepEntry {
  date: string;
  steps: number;
}

export interface GoogleFitWeeklyStepsResponse {
  connected: boolean;
  steps: GoogleFitStepEntry[];
  avgSteps: number;
}

export const googleFitService = {
  async getWeeklySteps(): Promise<GoogleFitWeeklyStepsResponse> {
    return api.get<GoogleFitWeeklyStepsResponse>('/google-fit/weekly-steps');
  },
};
