import { api } from '../lib/api';

export interface CreateSubscriptionData {
  planId: string;
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
  planId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  subscriptionTier: string;
}

export const subscriptionService = {
  async create(data: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
    return api.post<CreateSubscriptionResponse>('/subscriptions/create', data);
  },

  async createPortalSession(): Promise<{ url: string }> {
    return api.post<{ url: string }>('/subscriptions/create-portal-session');
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