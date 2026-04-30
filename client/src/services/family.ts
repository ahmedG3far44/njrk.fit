import { api } from '../lib/fetchApi'
import {
  // USE_MOCK, 
  mockFamilyMembers,
  type FamilyMember
} from './mockData'

export type { FamilyMember }

export interface PendingInvitation {
  id: string
  user: {
    id: string
    name: string
    avatarUrl?: string
  }
}

export interface FamilyResponse {
  familyMembers: FamilyMember[]
  pendingInvitations: PendingInvitation[]
}

export interface UserSearchResult {
  id: string
  name: string
  avatarUrl?: string
  username: string
}

export const familyService = {
  async getFamily(): Promise<FamilyResponse> {
    // if (USE_MOCK) {
    //   return {
    //     familyMembers: [...mockFamilyMembers],
    //     pendingInvitations: [],
    //   }
    // }
    const data = await api.get<FamilyResponse>('/family')
    return data
  },

  async searchUsers(query: string): Promise<{ results: UserSearchResult[] }> {
    // if (USE_MOCK) {
      // const results: UserSearchResult[] = mockFamilyMembers
      //   .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
      //   .map(m => ({
      //     id: m.id,
      //     name: m.name,
      //     avatarUrl: m.avatarUrl,
      //     username: m.email?.split('@')[0] || '',
      //   }))
      // return { results }
    // }
    const data = await api.get<{ results: UserSearchResult[] }>('/family/search?q=' + query)
    return data
  },

  async inviteUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
    // if (USE_MOCK) {
      // return { success: true, message: 'Invitation sent successfully' }
      // }
    const data = await api.post<{ success: boolean; message: string }>('/family/invite', {
      targetUserId,
    })
    return data
  },

  async respondToInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<{ success: boolean }> {
    // if (USE_MOCK) {
    //   return { success: true }
    // }
    const data = await api.post<{ success: boolean }>('/family/respond', {
      invitationId,
      action,
    })
    return data
  },
}