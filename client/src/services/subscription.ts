import { api } from '../lib/fetchApi'

export interface Subscription {
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'none'
  planId?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  subscriptionTier?: 'BASIC' | 'PRO' | 'FAMILY'
}

export const subscriptionService = {
  async getStatus(): Promise<Subscription> {
    const data = await api.get<Subscription>('/subscriptions/status')
    return data
  },
  async manageSubscriptionPortal(): Promise<{ url: string }> {
    const data = await api.post<{ url: string }>('/subscriptions/create-portal-session')
    console.log(data.url)
    return data
  },

  async create(planId: string): Promise<{ planId: string; status: string; prorated?: boolean }> {
    const data = await api.post<{ planId: string; status: string; prorated?: boolean }>(`/subscriptions/create/${planId}`)
    return data
  },

  async cancel(): Promise<{ message: string }> {
    const data = await api.post<{ message: string }>('/subscriptions/cancel')
    return data
  }
}