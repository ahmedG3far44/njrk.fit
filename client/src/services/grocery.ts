import api from '../lib/api'
import { USE_MOCK, mockGroceryList, type GroceryItem as GroceryItemType } from './mockData'

export type GroceryItem = GroceryItemType

export interface SharedListData {
  items: GroceryItem[]
  expiresAt: string
}

export const groceryService = {
  async getGroceries(): Promise<{
    items: GroceryItem[]
    purchasedCount: number
    totalCount: number
    categories: string[]
  }> {
    if (USE_MOCK) {
      const items = mockGroceryList.map(item => ({ ...item }))
      const purchasedCount = items.filter(i => i.checked).length
      const categories = [...new Set(items.map(i => i.category))]
      return { items, purchasedCount, totalCount: items.length, categories }
    }
    const { data } = await api.get('/groceries')
    return data
  },

  async syncFromPlan(daysAhead = 7, isFamily = false): Promise<{
    items: GroceryItem[]
    purchasedCount: number
    totalCount: number
    syncedAt: string
  }> {
    if (USE_MOCK) {
      const items = mockGroceryList.map(item => ({ ...item, checked: false }))
      const purchasedCount = 0
      const syncedAt = new Date().toISOString()
      return { items, purchasedCount, totalCount: items.length, syncedAt }
    }
    const { data } = await api.post('/groceries/sync', {
      daysAhead,
      isFamily,
    })
    return data
  },

  async toggleItem(itemName: string, checked: boolean): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true }
    }
    const { data } = await api.post('/groceries/toggle-item', {
      itemName,
      checked,
    })
    return data
  },

  async addItem(name: string, quantity = '1', category = 'Other'): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true }
    }
    const { data } = await api.post('/groceries/add-item', {
      name,
      quantity,
      category,
    })
    return data
  },

  async createShare(): Promise<{ success: boolean; shareUrl: string }> {
    if (USE_MOCK) {
      return { success: true, shareUrl: 'https://app.fitfam.com/share/abc123' }
    }
    const { data } = await api.post('/groceries/share')
    return data
  },

  async getSharedList(token: string): Promise<SharedListData> {
    if (USE_MOCK) {
      return {
        items: mockGroceryList.map(item => ({ ...item })),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }
    const { data } = await api.get(`/groceries/shared/${token}`)
    return data
  },
}