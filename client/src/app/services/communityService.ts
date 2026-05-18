import { api } from '../lib/api';

export interface PostUser {
  name: string;
  avatarUrl?: string;
}

export interface CommentUser {
  name: string;
  avatarUrl?: string;
}

export interface Post {
  _id: string;
  userId: PostUser | string;
  content: string;
  mediaUrl?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: CommentUser | string;
  content: string;
  createdAt: string;
}

export interface CreatePostData {
  media?: File;
  content: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AddCommentData {
  content: string;
}

export const communityService = {
  async createPost(data: CreatePostData): Promise<{ post: Post }> {
    const formData = new FormData();
    if (data.media) formData.append('media', data.media);
    formData.append('content', data.content);
    return api.post<{ post: Post }>('/community/posts', formData);
  },

  async getFeed(params?: { page?: number; limit?: number }): Promise<{ posts: Post[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString();
    return api.get<{ posts: Post[]; pagination: Pagination }>(`/community/feed${query ? `?${query}` : ''}`, { skipAuthRefresh: true });
  },

  async deletePost(postId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/community/posts/${postId}`);
  },

  async toggleLike(postId: string): Promise<{ success: boolean; message: string; count: number }> {
    return api.put<{ success: boolean; message: string; count: number }>(`/community/posts/${postId}/like`);
  },

  async getComments(postId: string): Promise<{ comments: Comment[] }> {
    return api.get<{ comments: Comment[] }>(`/community/posts/${postId}/comments`);
  },

  async addComment(postId: string, data: AddCommentData): Promise<{ comment: Comment }> {
    return api.post<{ comment: Comment }>(`/community/posts/${postId}/comment`, data);
  },

  async deleteComment(postId: string, commentId: string): Promise<{ comment: Comment }> {
    return api.delete<{ comment: Comment }>(`/community/posts/${postId}/comment/${commentId}`);
  },

  async getLeaderboard(scope?: string): Promise<{
    leaderboard: LeaderboardEntry[];
    currentUser: LeaderboardEntry;
    percentile: number;
    totalUsers: number;
  }> {
    const query = scope && scope !== 'global' ? `?scope=${scope}` : '';
    return api.get<{
      leaderboard: LeaderboardEntry[];
      currentUser: LeaderboardEntry;
      percentile: number;
      totalUsers: number;
    }>(`/leaderboard${query}`);
  },
};

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string;
  points: number;
  streak: number;
  goalAdherence: number;
}