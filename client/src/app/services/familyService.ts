import { api } from '../lib/api';
import { NutritionPlan } from './nutritionService';

export interface FamilyMember {
  id: string;
  name: string;
  avatarUrl?: string;
  email: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface PendingInvitation {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface FamilyResponse {
  familyMembers: FamilyMember[];
  pendingInvitations: PendingInvitation[];
}

export interface SearchResult {
  id: string;
  name: string;
  avatarUrl?: string;
  username: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface InviteResponse {
  success: boolean;
  message: string;
}

export interface RespondResponse {
  success: boolean;
}



export const familyService = {
  async getFamily(): Promise<FamilyResponse> {
    return api.get<FamilyResponse>('/family');
  },

  async getFamilyMemberNutritionPlan(memberId: string): Promise<NutritionPlan> {
    return api.get<NutritionPlan>(`/family/plan/member/${memberId}`);
  },

  async searchUsers(query: string): Promise<SearchResponse> {
    return api.get<SearchResponse>(`/family/search?q=${encodeURIComponent(query)}`);
  },

  async invite(targetUserId: string): Promise<InviteResponse> {
    return api.post<InviteResponse>('/family/invite', { targetUserId });
  },

  async respondToInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<RespondResponse> {
    return api.post<RespondResponse>('/family/respond', { invitationId, action });
  },
};