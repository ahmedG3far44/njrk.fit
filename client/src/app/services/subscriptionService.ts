import { api } from '../lib/api';

export interface CreateSubscriptionData {
  planTier: string | "BASIC" | "PRO" | "FAMILY";
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  status: string;
  checkoutUrl?: string;
}

export interface CancelSubscriptionResponse {
  message: string;
}

export interface SubscriptionStatus {
  status: string;
  planTier?: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  subscriptionTier: string;
  cardLast4?: string;
  subscriptionStartDate?: string;
  planName?: string;
  planPrice?: number;
}

export const subscriptionService = {
  async create(data: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
    return api.post<CreateSubscriptionResponse>('/subscriptions/create', data);
  },
  async cancel(): Promise<CancelSubscriptionResponse> {
    return api.post<CancelSubscriptionResponse>('/subscriptions/cancel');
  },

  async getStatus(): Promise<SubscriptionStatus> {
    return api.get<SubscriptionStatus>('/subscriptions/status');
  },

  async getPortal(): Promise<{ url: string }> {
    return api.post<{ url: string }>('/subscriptions/portal');
  },
};