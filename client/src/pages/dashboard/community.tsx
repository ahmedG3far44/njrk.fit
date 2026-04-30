import { useState, useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { communityService } from '../../services/community'
import { Loader2, MessageCircle, Search, Trophy, Flame, Users, TrendingUp, Share2 } from 'lucide-react'
import PostComposer from '../../components/PostComposer'
import LikeButton from '../../components/LikeButton'
import Comments from '../../components/Comments'

type ViewMode = 'feed' | 'leaderboard'

const PostCard = ({ post }: { post: any }) => (
  <div className="bg-white rounded-lg shadow-sm p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
        {post.userId?.name?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div>
        <p className="font-medium">{post.userId?.name || 'User'}</p>
        <p className="text-sm text-gray-500">
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
    <p className="mb-3">{post.content}</p>
    {post.mediaUrl && (
      <img src={post.mediaUrl} alt="" className="rounded-lg w-full h-48 object-cover mb-3" />
    )}
    <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
      <LikeButton postId={post._id} isLiked={post.isLiked} likeCount={post.likeCount} />
      <Comments postId={post._id} />
      <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
        <Share2 className="w-4 h-4" />
        <span className="text-sm">Share</span>
      </button>
    </div>
  </div>
)

const LeaderboardRow = ({ user, isCurrentUser }: { user: any; isCurrentUser: boolean }) => {
  const getTrophyIcon = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>
    if (rank === 2) return <span className="text-2xl">🥈</span>
    if (rank === 3) return <span className="text-2xl">🥉</span>
    return <span className="text-gray-500 font-medium w-6 text-center">{rank}</span>
  }

  return (
    <div className={`flex items-center gap-4 p-3 ${isCurrentUser ? 'bg-purple-50 border-l-4 border-purple-600 font-semibold' : ''}`}>
      <div className="w-8">{getTrophyIcon(user.rank)}</div>
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium">
        {user.name?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm">{user.name}</p>
      </div>
      <div className="flex items-center gap-1 text-orange-500">
        <Flame className="w-4 h-4" />
        <span className="text-sm">{user.streak || 0}</span>
      </div>
      <div className="w-24">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${user.goalAdherence || 0}%` }} />
        </div>
      </div>
      <div className="w-16 text-right">
        <span className="font-bold text-purple-600">{user.points || 0}</span>
      </div>
    </div>
  )
}

const SquadCard = () => (
  <div className="bg-purple-600 rounded-lg p-4 text-white">
    <div className="flex items-center gap-2 mb-3">
      <Users className="w-5 h-5" />
      <h3 className="font-semibold">Your Squad</h3>
    </div>
    <div className="flex -space-x-2 mb-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-8 h-8 rounded-full bg-purple-300 border-2 border-purple-600 flex items-center justify-center text-xs">
          {String.fromCharCode(64 + i)}
        </div>
      ))}
    </div>
    <button className="w-full py-2 bg-white text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50">
      Cheer Team
    </button>
  </div>
)

const TrendingCard = () => (
  <div className="bg-white rounded-lg p-4">
    <div className="flex items-center gap-2 mb-3">
      <TrendingUp className="w-5 h-5 text-purple-600" />
      <h3 className="font-semibold">Trending Topics</h3>
    </div>
    <div className="flex flex-wrap gap-2">
      {['#MorningRun', '#HealthyEats', '#FitFam', '#YogaTime', '#MarathonTraining'].map((tag) => (
        <span key={tag} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
          {tag}
        </span>
      ))}
    </div>
  </div>
)

const InfiniteScrollSentinel = ({ onIntersect }: { onIntersect: () => void }) => {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect()
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [onIntersect])

  return <div ref={sentinelRef} className="h-4" />
}

const CommunityPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('feed')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['community'],
    queryFn: ({ pageParam = 1 }) => communityService.getFeed(pageParam),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage
      if (pagination.page >= pagination.totalPages) return undefined
      return pagination.page + 1
    },
    initialPageParam: 1,
  })

  const { data: leaderboardData, isLoading: lbLoading } = useInfiniteQuery({
    queryKey: ['leaderboard'],
    queryFn: () => communityService.getLeaderboard(),
    getNextPageParam: () => undefined,
    initialPageParam: 1,
    enabled: viewMode === 'leaderboard',
  })

  const allPosts = feedData?.pages?.flatMap((page) => page.posts) || []
  const leaderboard = leaderboardData?.pages?.[0]?.leaderboard || []
  const currentUser = leaderboardData?.pages?.[0]?.currentUser

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Community Hub</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('feed')}
            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'feed'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Feed
          </button>
          <button
            onClick={() => setViewMode('leaderboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'leaderboard'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search posts, users, or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {viewMode === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            <PostComposer onPosted={() => refetch()} />

            {feedLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : allPosts.length ? (
              <>
                {allPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
                {hasNextPage && (
                  <InfiniteScrollSentinel onIntersect={fetchNextPage} />
                )}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No posts yet</p>
                <p className="text-sm text-gray-400">Be the first to share your progress!</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-4 max-sm:hidden ">
            <div className="sticky top-4 space-y-4">
              <SquadCard />
              <TrendingCard />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-purple-600 rounded-xl p-6 text-white text-center">
            <Trophy className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Global Leaderboard</h2>
            <p className="text-purple-200">
              You're in the top {leaderboardData?.pages?.[0]?.percentile || 0}% of all users
            </p>
          </div>

          <div className="flex items-center gap-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-500">
            <div className="w-8">RANK</div>
            <div className="w-8">USER</div>
            <div className="flex-1" />
            <div className="w-16 text-center">STREAK</div>
            <div className="w-24 text-center">GOAL %</div>
            <div className="w-16 text-right">POINTS</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
            {lbLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : leaderboard.length ? (
              <>
                {leaderboard.map((user) => (
                  <LeaderboardRow
                    key={user.id}
                    user={user}
                    isCurrentUser={user.id === currentUser?.id}
                  />
                ))}
                {currentUser && !leaderboard.find(u => u.id === currentUser.id) && (
                  <LeaderboardRow user={currentUser} isCurrentUser={true} />
                )}
              </>
            ) : (
              <p className="text-center py-8 text-gray-500">No users on leaderboard yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CommunityPage