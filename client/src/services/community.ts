import { api } from '../lib/fetchApi'
// import { USE_MOCK } from './mockData'

export interface Comment {
  _id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
}

export interface Post {
  _id: string
  userId: {
    _id: string
    name: string
    avatarUrl?: string
  }
  content: string
  mediaUrl?: string
  likeCount: number
  isLiked: boolean
  commentCount: number
  createdAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface LeaderboardUser {
  rank: number
  id: string
  name: string
  avatarUrl?: string
  points: number
  streak: number
  goalAdherence: number
}

export interface LeaderboardData {
  leaderboard: LeaderboardUser[]
  currentUser: LeaderboardUser
  percentile: number
  totalUsers: number
}

// const generateMockPosts = (): any[] => {
//   const users = [
//     { _id: 'u1', name: 'Sarah Chen' },
//     { _id: 'u2', name: 'Mike Johnson' },
//     { _id: 'u3', name: 'Emma Wilson' },
//     { _id: 'u4', name: 'Alex Rivera' },
//     { _id: 'u5', name: 'Jordan Park' },
//     { _id: 'u6', name: 'Taylor Kim' },
//     { _id: 'u7', name: 'Chris Lee' },
//     { _id: 'u8', name: 'Sam Davis' },
//     { _id: 'u9', name: 'Morgan Wright' },
//     { _id: 'u10', name: 'Casey Brown' },
//   ]

//   const contents = [
//     'Just completed my first 5K run! So proud of myself for sticking with this training plan. #MorningRun #FitFam',
//     'Week 3 of my marathon training is done! Feeling stronger every day.',
//     'Found an amazing healthy meal prep recipe - grilled chicken with roasted veggies. #HealthyEats',
//     '30 day yoga streak! Who knew I could stick with something for this long? #YogaTime',
//     'Hit a new personal best on my deadlifts today! 225 lbs!',
//     'Early morning workout done! The sunrise was incredible this morning.',
//     'Rest day but feeling guilty about skipping the gym. Tomorrow is a new day!',
//     'Completed my first triathlon! So exhausted but so happy.',
//     'Consistency is key. Day 50 of working out every single day!',
//     'Learned that recovery is just as important as the workout.',
//     'Finally hit my goal weight! All that hard work paid off.',
//     'Running with friends is so much better than running alone.',
//     'Tried a new healthy recipe - cauliflower rice stir fry. Delicious!',
//     'My sleep quality has improved so much since I started exercising.',
//     'Flexibility is slowly improving. Baby steps!',
//   ]

//   const posts: any[] = []
//   for (let i = 0; i < 50; i++) {
//     const user = users[i % users.length]
//     posts.push({
//       _id: `post-${i + 1}`,
//       content: contents[i % contents.length],
//       userId: { _id: user._id, name: user.name, avatarUrl: '' },
//       mediaUrl: i % 5 === 0 ? 'https://picsum.photos/seed/' + i + '/400/300' : '',
//       likeCount: Math.floor(Math.random() * 50) + 5,
//       commentCount: Math.floor(Math.random() * 15),
//       isLiked: Math.random() > 0.7,
//       createdAt: new Date(Date.now() - i * 3600000).toISOString(),
//     })
//   }
//   return posts
// }

// const mockPosts = generateMockPosts()

// const mockLeaderboard: LeaderboardUser[] = [
//   { rank: 1, id: 'u100', name: 'Diana Prince', points: 12500, streak: 45, goalAdherence: 98 },
//   { rank: 2, id: 'u101', name: 'Barry Allen', points: 11200, streak: 38, goalAdherence: 92 },
//   { rank: 3, id: 'u102', name: 'Clark Kent', points: 10800, streak: 42, goalAdherence: 88 },
//   { rank: 4, id: 'u103', name: 'Bruce Wayne', points: 9500, streak: 30, goalAdherence: 95 },
//   { rank: 5, id: 'u104', name: 'Tony Stark', points: 8900, streak: 25, goalAdherence: 82 },
//   { rank: 6, id: 'u105', name: 'Steve Rogers', points: 8200, streak: 35, goalAdherence: 78 },
//   { rank: 7, id: 'u106', name: 'Natasha Romanoff', points: 7800, streak: 28, goalAdherence: 90 },
//   { rank: 8, id: 'u107', name: 'Wanda Maximoff', points: 7200, streak: 22, goalAdherence: 85 },
//   { rank: 9, id: 'u108', name: 'Peter Parker', points: 6800, streak: 18, goalAdherence: 76 },
//   { rank: 10, id: 'u109', name: 'Stephen Strange', points: 6200, streak: 15, goalAdherence: 72 },
//   { rank: 11, id: 'u110', name: 'Thor Odinson', points: 5800, streak: 20, goalAdherence: 68 },
//   { rank: 12, id: 'u111', name: 'Loki Laufeyson', points: 5400, streak: 12, goalAdherence: 65 },
//   { rank: 13, id: 'u112', name: 'Clint Barton', points: 5000, streak: 16, goalAdherence: 62 },
//   { rank: 14, id: 'u113', name: 'Sam Wilson', points: 4600, streak: 14, goalAdherence: 58 },
//   { rank: 15, id: 'u114', name: 'Bucky Barnes', points: 4200, streak: 10, goalAdherence: 55 },
// ]

// const mockCurrentUser: LeaderboardUser = {
//   rank: 42,
//   id: 'current-user',
//   name: 'You',
//   points: 3200,
//   streak: 12,
//   goalAdherence: 65,
// }

// const mockComments: Comment[] = [
//   { _id: 'c1', userId: 'u1', userName: 'Sarah', content: 'Amazing work! Keep it up!', createdAt: new Date().toISOString() },
//   { _id: 'c2', userId: 'u2', userName: 'Mike', content: 'We should run together sometime!', createdAt: new Date().toISOString() },
//   { _id: 'c3', userId: 'u3', userName: 'Emma', content: 'This is so inspiring!', createdAt: new Date().toISOString() },
// ]

export const communityService = {
  async getFeed(page = 1, limit = 10): Promise<{ posts: Post[]; pagination: Pagination }> {
    const data = await api.get<{ posts: Post[]; pagination: Pagination }>(`/community/feed?page=${page}&limit=${limit}`)
    return data
  },

  async createPost(content: string, media?: File): Promise<{ post: Post }> {

    const formData = new FormData()
    formData.append('content', content)
    if (media) formData.append('media', media)
    const data = await api.postFormData<{ post: Post }>('/community/posts', formData)
    return data
  },

  async toggleLike(postId: string): Promise<{ success: boolean; liked: boolean; likeCount: number }> {

    const data = await api.put<{ success: boolean; liked: boolean; likeCount: number }>(`/community/posts/${postId}/like`)
    return data
  },

  async commentPost(postId: string, content: string): Promise<{ comment: Comment }> {
    // if (USE_MOCK) {
    //   const newComment: Comment = {
    //     _id: 'c' + Date.now(),
    //     userId: 'current-user',
    //     userName: 'You',
    //     content,
    //     createdAt: new Date().toISOString(),
    //   }
    //   return { comment: newComment }
    // }
    const data = await api.post<{ comment: Comment }>(`/community/posts/${postId}/comment`, {
      content,
    })
    return data
  },

  async getComments(postId: string): Promise<{ comments: Comment[] }> {
    // if (USE_MOCK) {
    //   return { comments: mockComments }
    // }
    const data = await api.get<{ comments: Comment[] }>(`/community/posts/${postId}/comments`)
    return data
  },

  async getLeaderboard(limit = 50): Promise<LeaderboardData> {
    // if (USE_MOCK) {
    //    return {
    //     leaderboard: mockLeaderboard.slice(0, limit),
    //     currentUser: mockCurrentUser,
    //     percentile: 78,
    //     totalUsers: mockLeaderboard.length + 1,
    //   }
    // }
    const data = await api.get<LeaderboardData>('/leaderboard?limit=' + limit)
    return data
  },
}