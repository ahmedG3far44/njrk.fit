import api from '../lib/api'
import { USE_MOCK, mockFamilyMembers, type FamilyMember } from './mockData'

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

// 🌟 الواجهات (Interfaces) الجديدة للوحة الصدارة والنشاطات
export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatarUrl?: string;
  points: number;
  level: number;
}

export interface ActivityFeedItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  action: string;
  date: string;
  likesCount: number;
}

export const familyService = {
  async getFamily(): Promise<FamilyResponse> {
    if (USE_MOCK) {
      return {
        familyMembers: [...mockFamilyMembers],
        pendingInvitations: [],
      }
    }
    const { data } = await api.get<FamilyResponse>('/family')
    return data
  },

  // 🏆 الخدمة الجديدة: جلب لوحة الصدارة
  async getLeaderboard(): Promise<{ leaderboard: LeaderboardUser[] }> {
    if (USE_MOCK) {
      // بيانات وهمية للوحة الصدارة عشان التصميم
      const mockLeaderboard: LeaderboardUser[] = mockFamilyMembers.map((m, index) => ({
        id: m.id,
        rank: index + 1,
        name: m.name,
        avatarUrl: m.avatarUrl,
        points: 1000 - (index * 150), // أرقام وهمية للتجربة
        level: 5 - index > 0 ? 5 - index : 1
      }));
      return { leaderboard: mockLeaderboard };
    }
    const { data } = await api.get<{ leaderboard: LeaderboardUser[] }>('/family/leaderboard');
    return data;
  },

  // 📰 الخدمة الجديدة: جلب شريط النشاطات
  async getFeed(): Promise<{ feed: ActivityFeedItem[] }> {
    if (USE_MOCK) {
      // بيانات وهمية لشريط النشاطات
      const mockFeed: ActivityFeedItem[] = [
        {
          id: '1',
          user: { id: mockFamilyMembers[0]?.id || '1', name: mockFamilyMembers[0]?.name || 'User 1', avatarUrl: mockFamilyMembers[0]?.avatarUrl },
          action: 'سجل إنجاز جديد 🎯',
          date: new Date().toISOString(),
          likesCount: 2
        },
        {
          id: '2',
          user: { id: mockFamilyMembers[1]?.id || '2', name: mockFamilyMembers[1]?.name || 'User 2', avatarUrl: mockFamilyMembers[1]?.avatarUrl },
          action: 'حطم الرقم القياسي في المشي! 🏃‍♂️🔥',
          date: new Date(Date.now() - 86400000).toISOString(), // أمس
          likesCount: 5
        }
      ];
      return { feed: mockFeed };
    }
    const { data } = await api.get<{ feed: ActivityFeedItem[] }>('/family/feed');
    return data;
  },

  async searchUsers(query: string): Promise<{ results: UserSearchResult[] }> {
    if (USE_MOCK) {
      const results: UserSearchResult[] = mockFamilyMembers
        .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
        .map(m => ({
          id: m.id,
          name: m.name,
          avatarUrl: m.avatarUrl,
          username: m.email?.split('@')[0] || '',
        }))
      return { results }
    }
    const { data } = await api.get<{ results: UserSearchResult[] }>('/family/search', {
      params: { q: query },
    })
    return data
  },

  async removeMember(memberId: string): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK) {
      return { success: true, message: 'Member removed successfully' }
    }
    // تقدر تستخدم api.delete أو api.post على حسب وش كاتب في الباك إند
    const { data } = await api.post<{ success: boolean; message: string }>('/family/remove', {
      memberId,
    })
    return data
  },

  async inviteUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK) {
      return { success: true, message: 'Invitation sent successfully' }
    }
    const { data } = await api.post<{ success: boolean; message: string }>('/family/invite', {
      targetUserId,
    })
    return data
  },

  async respondToInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true }
    }
    const { data } = await api.post<{ success: boolean }>('/family/respond', {
      invitationId,
      action,
    })
    return data
  },

  // إلغاء دعوة أرسلتها لشخص بس لسه ما قبلها
  async cancelInvitation(invitationId: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return { success: true }
    }
    const { data } = await api.post<{ success: boolean }>('/family/cancel-invite', {
      invitationId,
    })
    return data
  },
}