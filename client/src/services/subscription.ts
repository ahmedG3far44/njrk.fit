import api from '../lib/api'
import { USE_MOCK, mockUser } from './mockData'

export interface Subscription {
  status: 'active' | 'canceled' | 'expired' | 'past_due' | 'none'
  planId?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  subscriptionTier?: 'BASIC' | 'PRO' | 'FAMILY'
}

export const subscriptionService = {
  async getStatus(): Promise<Subscription> {
    if (USE_MOCK) {
      return {
        status: 'active',
        planId: mockUser.subscription?.planId || 'plan_pro',
        subscriptionTier: (mockUser.subscriptionTier as 'BASIC' | 'PRO' | 'FAMILY') || 'PRO',
        currentPeriodEnd: mockUser.subscription?.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: false,
      }
    }
    const { data } = await api.get<Subscription>('/subscriptions/status')
    return data
  },

  async create(planId: string): Promise<{ subscriptionId: string; status: string; prorated?: boolean }> {
    if (USE_MOCK) {
      return {
        subscriptionId: `sub_${Date.now()}`,
        status: 'active',
        prorated: false,
      }
    }
    const { data } = await api.post<{ subscriptionId: string; status: string; prerated?: boolean }>('/subscriptions/create', {
      planId,
    })
    return data
  },

  async cancel(): Promise<{ message: string }> {
    if (USE_MOCK) {
      return { message: 'Your subscription will be canceled at the end of the billing period.' }
    }
    const { data } = await api.post<{ message: string }>('/subscriptions/cancel')
    return data
  },

  async createPortalSession(): Promise<{ url: string }> {
    if (USE_MOCK) {
      return { url: 'https://billing.stripe.com/p/session/test' }
    }
    const { data } = await api.post<{ url: string }>('/subscriptions/portal')
    return data
  },
}