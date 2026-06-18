import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Trophy, Users, Medal, Search, TrendingUp, Flame, Loader2, X, Image, Send, Trash2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthProvider';
import { communityService, Post, Comment, LeaderboardEntry } from '../services/communityService';

export const Social: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults] = useState<{ id: string; name: string; username: string; avatarUrl: string }[]>([]);
  const [invitesSent, setInvitesSent] = useState<Record<string, string>>({});

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Image lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Create post modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Comments state - track which post's comments are expanded
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  // Infinite scroll ref
  const observerRef = useRef<HTMLDivElement>(null);

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [leaderboardStats, setLeaderboardStats] = useState({ percentile: 0, totalUsers: 0 });
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [leaderboardScope, setLeaderboardScope] = useState<'global' | 'family'>('global');

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await communityService.getFeed({ page: pageNum, limit: 10 });

      if (append) {
        setPosts(prev => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }

      setHasMore(response.pagination.page < response.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error(t('community.commentsFailed'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (activeTab === 'feed') {
      fetchPosts(1);
    }
  }, [activeTab, fetchPosts]);

  // Fetch leaderboard when tab or scope changes
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      setLoadingLeaderboard(true);
      setLeaderboardSearch('');
      communityService.getLeaderboard(leaderboardScope)
        .then((data) => {
          setLeaderboardData(data.leaderboard);
          setCurrentUserRank(data.currentUser);
          setLeaderboardStats({ percentile: data.percentile, totalUsers: data.totalUsers });
        })
        .catch((error) => {
          console.error('Failed to fetch leaderboard:', error);
          toast.error(t('community.commentsFailed'));
        })
        .finally(() => {
          setLoadingLeaderboard(false);
        });
    }
  }, [activeTab, leaderboardScope]);

  // Infinite scroll observer
  useEffect(() => {
    if (activeTab !== 'feed' || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab, hasMore, loadingMore, page, fetchPosts]);

  // Handle like
  const handleLike = async (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;

    // Optimistic update
    const wasLiked = post.isLiked;
    const prevPosts = [...posts];
    setPosts(posts.map(p =>
      p._id === postId
        ? { ...p, isLiked: !wasLiked, likeCount: wasLiked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ));

    try {
      await communityService.toggleLike(postId);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setPosts(prevPosts);
      toast.error(t('community.likeFailed'));
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      await communityService.deletePost(postId);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success(t('community.postDeleted'));
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(t('community.postDeleteFailed'));
    }
  };

  // Load comments when expanding
  const handleToggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    setExpandedPostId(postId);

    if (!comments[postId]) {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const response = await communityService.getComments(postId);
        setComments(prev => ({ ...prev, [postId]: response.comments }));
      } catch (error) {
        console.error('Failed to load comments:', error);
        toast.error(t('community.commentsFailed'));
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  // Add comment
  const handleAddComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      const response = await communityService.addComment(postId, { content });
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.comment]
      }));
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      // Update comment count
      setPosts(posts.map(p =>
        p._id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      ));
      toast.success(t('community.commentAdded'));
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error(t('community.commentFailed'));
    }
  };

  // Delete comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await communityService.deleteComment(postId, commentId);
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c._id !== commentId)
      }));
      // Update comment count
      setPosts(posts.map(p =>
        p._id === postId ? { ...p, commentCount: p.commentCount - 1 } : p
      ));
      toast.success(t('community.commentDeleted'));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(t('community.commentDeleteFailed'));
    }
  };

  // Create post
  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error(t('community.writeSomething'));
      return;
    }

    setPosting(true);
    try {
      const response = await communityService.createPost({
        content: postContent,
        media: postMedia || undefined
      });
      setPosts([response.post, ...posts]);
      setShowCreateModal(false);
      setPostContent('');
      setPostMedia(null);
      setMediaPreview(null);
      toast.success(t('community.postCreated'));
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error(t('community.postFailed'));
    } finally {
      setPosting(false);
    }
  };

  // Handle media selection
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  // Remove media preview
  const removeMedia = () => {
    setPostMedia(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Get user name from post
  const getUserName = (userId: Post['userId']) => {
    if (!userId) return 'Unknown';
    if (typeof userId === 'object') return userId.name || 'Unknown';
    return 'Unknown';
  };

  // Get user avatar from post
  const getUserAvatar = (userId: Post['userId']) => {
    if (!userId) return null;
    if (typeof userId === 'object') return userId.avatarUrl || null;
    return null;
  };

  // Check if current user owns the post
  const isPostOwner = (post: Post) => {
    if (!post.userId) return false;
    if (typeof post.userId === 'object') return false;
    return post.userId === user?._id;
  };

  // Check if current user owns the comment
  const isCommentOwner = (comment: Comment) => {
    if (!comment.userId) return false;
    if (typeof comment.userId === 'object') return false;
    return comment.userId === user?._id;
  };

  const handleInvite = (username: string, type: 'team' | 'family') => {
    setInvitesSent(prev => ({ ...prev, [username + type]: type }));
    setTimeout(() => {
      setInvitesSent(prev => {
        const next = { ...prev };
        delete next[username + type];
        return next;
      });
    }, 4000);
  };

  const leaderboard: { rank: number; name: string; points: number; streak: number; goalAdherence: number; avatar: string; change: 'up' | 'down' | 'same' }[] = [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Create Post Modal */}
      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed start-0 top-0 w-full h-full z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Post"
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 end-3 bg-black/50 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed w-full h-full start-0 top-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 16, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-card w-full h-full sm:max-w-lg sm:h-auto sm:rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-card-foreground text-base sm:text-lg">{t('community.createPost')}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateModal(false)}
                  disabled={posting}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <div className={`px-4 sm:px-6 pb-4 space-y-4 flex-1 overflow-y-auto ${posting ? 'pointer-events-none opacity-50' : ''}`}>
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder={t('community.postPlaceholder')}
                  disabled={posting}
                  className="w-full h-24 sm:h-28 p-3 rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none resize-none text-xs sm:text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />

                {mediaPreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-border">
                    <img src={mediaPreview} alt="Preview" className="w-full h-40 sm:h-48 object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeMedia}
                      disabled={posting}
                      className="absolute top-2.5 right-2.5 bg-black/50 text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                <label className={`flex items-center gap-2 w-fit px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl border border-border text-xs sm:text-sm font-medium text-muted-foreground hover:bg-muted hover:border-foreground/20 cursor-pointer transition-colors ${posting ? 'pointer-events-none opacity-50' : ''}`}>
                  <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{t('community.addPhoto')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMediaSelect}
                    disabled={posting}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex-shrink-0">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleCreatePost}
                  disabled={posting || !postContent.trim()}
                >
                  {posting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      {t('community.posting')}
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      {t('community.post')}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold text-card-foreground leading-tight">{t('community.title')}</h1>
        <div className="flex bg-card p-1 rounded-xl border border-border w-fit">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('feed')}
            className={`${activeTab === 'feed' ? 'bg-green-500/20 text-green-400 shadow-sm' : 'text-muted-foreground hover:text-card-foreground'}`}
          >
            {t('community.feed')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('leaderboard')}
            className={`${activeTab === 'leaderboard' ? 'bg-green-500/20 text-green-400 shadow-sm' : 'text-muted-foreground hover:text-card-foreground'}`}
          >
            {t('community.leaderboard')}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-lg overflow-hidden"
          >
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-border bg-muted">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{searchResults.length} {t('community.usersFound')}</p>
            </div>
            <div className="divide-y divide-border">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-muted transition-colors">
                  {user.avatarUrl && (
                    <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-card-foreground text-xs sm:text-sm">{user.name}</div>
                    <div className="font-mono text-[10px] sm:text-xs text-green-400">{user.username}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleInvite(user.username, 'team')}
                    >
                      <Trophy className="w-3 h-3 flex-shrink-0" /> {t('community.inviteToTeam')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {activeTab === 'feed' ? (
          <>
            {/* Feed */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">
              {/* Create Post Card */}
              <div className="bg-card p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-border shadow-sm flex flex-wrap gap-2.5 sm:gap-4">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                  </div>
                )}
                <input
                  type="text"
                  placeholder={t('community.postPlaceholder')}
                  onClick={() => setShowCreateModal(true)}
                  readOnly
                  className="flex-1 bg-muted rounded-lg sm:rounded-xl px-3 sm:px-4 outline-none focus:ring-2 focus:ring-green-600/50 transition-all text-xs sm:text-sm cursor-pointer"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  {t('community.post')}
                </Button>
              </div>

              {/* Posts */}
              {loading ? (
                <div className="bg-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-border shadow-sm text-center">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 animate-spin text-green-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm">{t('community.loadingPosts')}</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        {getUserAvatar(post.userId) ? (
                          <img src={getUserAvatar(post.userId)!} alt={getUserName(post.userId)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-card-foreground text-xs sm:text-sm">{getUserName(post.userId)}</h3>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      {isPostOwner(post) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePost(post._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-card-foreground mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">{post.content}</p>

                    {post.mediaUrl && (
                      <div className="rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 bg-muted relative group cursor-pointer h-72 sm:h-96" onClick={() => setLightboxImage(post.mediaUrl!)}>
                        <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white p-2 rounded-full">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post._id)}
                        className={`${post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                      >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs sm:text-sm font-medium">{post.likeCount}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComments(post._id)}
                        className={`${expandedPostId === post._id ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'}`}
                      >
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-xs sm:text-sm font-medium">{post.commentCount}</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {expandedPostId === post._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border"
                        >
                          {/* Add Comment Input */}
                          <div className="flex gap-2 mb-3.5 sm:mb-4">
                            <input
                              type="text"
                              value={newComment[post._id] || ''}
                              onChange={e => setNewComment(prev => ({ ...prev, [post._id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleAddComment(post._id)}
                              placeholder={t('community.commentPlaceholder')}
                              className="flex-1 px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border focus:ring-2 focus:ring-green-600 outline-none text-xs sm:text-sm"
                            />
                            <Button
                              variant="primary"
                              size="icon"
                              onClick={() => handleAddComment(post._id)}
                              disabled={!newComment[post._id]?.trim()}
                            >
                              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </div>

                          {/* Comments List */}
                          {loadingComments[post._id] ? (
                            <div className="text-center py-3">
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mx-auto animate-spin text-muted-foreground" />
                            </div>
                          ) : comments[post._id]?.length > 0 ? (
                            <div className="space-y-2.5 sm:space-y-3">
                              {comments[post._id].map(comment => (
                                <div key={comment._id} className="flex gap-2">
                                  {comment.userId && typeof comment.userId === 'object' && comment.userId.avatarUrl ? (
                                    <img src={comment.userId.avatarUrl} alt={typeof comment.userId === 'object' ? comment.userId.name || '' : ''} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 bg-muted rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-xs sm:text-sm text-card-foreground">
                                        {comment.userId && typeof comment.userId === 'object' ? comment.userId.name || 'User' : 'User'}
                                      </span>
                                      {isCommentOwner(comment) && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteComment(post._id, comment._id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-normal">{comment.content}</p>
                                    <div className="flex items-center gap-2.5 sm:gap-3 mt-1 flex-wrap">
                                      <span className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">{t('community.noComments')}</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="bg-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-border shadow-sm text-center text-muted-foreground">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                  <p className="font-medium text-sm sm:text-base">{t('community.noPosts')}</p>
                  <p className="text-xs sm:text-sm">{t('community.beFirst')}</p>
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              {hasMore && posts.length > 0 && (
                <div ref={observerRef} className="py-4 text-center">
                  {loadingMore && (
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-green-600" />
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-800 border border-green-500/20 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-gray-200">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  <h3 className="font-bold text-base sm:text-lg">{t('community.yourSquad')}</h3>
                </div>
                <p className="text-green-400 text-xs sm:text-sm mb-4 sm:mb-5">{t('community.squadDesc')}</p>
                <div className="flex items-center justify-center h-8 sm:h-10 mb-4 sm:mb-5">
                  <span className="text-green-400 text-xs sm:text-sm">{t('community.noActiveTeam')}</span>
                </div>
                <Button variant="secondary" size="sm" className="w-full">
                  {t('community.findATeam')}
                </Button>
              </div>

              <div className="bg-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-sm">
                <h3 className="font-bold text-card-foreground text-sm sm:text-base mb-3 sm:mb-4">{t('community.trendingTopics')}</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {['#MorningRun', '#HealthyEating', '#YogaLife', '#Keto', '#MarathonPrep', '#Njerka30Day'].map(tag => (
                    <span key={tag} className="text-[10px] sm:text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full hover:bg-green-500/10 hover:text-green-400 cursor-pointer transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Leaderboard Tab */
          <div className="lg:col-span-3">
            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 sm:p-8 bg-gray-900 border-b border-green-500/20 text-center text-gray-200">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-yellow-400 fill-current" />
                <h2 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('community.leaderboardTitle')}</h2>
                <p className="text-green-400 text-xs sm:text-sm">{t('community.leaderboardSubtitle')}</p>
                {/* Scope Toggle */}
                <div className="flex bg-green-800/30 p-1 rounded-lg sm:rounded-xl border border-white/10 w-fit mx-auto mt-3 sm:mt-4">
                  {(['global', 'family'] as const).map((s) => (
                    <Button
                      key={s}
                      variant="ghost"
                      size="sm"
                      onClick={() => setLeaderboardScope(s)}
                      className={`capitalize ${
                        leaderboardScope === s
                          ? 'bg-card text-green-400 shadow-sm'
                          : 'text-green-400 hover:text-white'
                      }`}
                    >
                      {s === 'family' ? t('community.family') : t('community.global')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Current User Stats */}
              {currentUserRank && (
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-green-500/10 border-b border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <img
                        src={currentUserRank.avatarUrl}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-green-500/30 shadow-sm flex-shrink-0"
                        alt={currentUserRank.name}
                      />
                      <div>
                        <p className="font-bold text-card-foreground text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{currentUserRank.name}</p>
                        <p className="text-[10px] sm:text-xs text-green-400 font-medium">{t('community.yourRank')}{currentUserRank.rank}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-lg sm:text-2xl font-black text-green-400 leading-none">{leaderboardStats.percentile}%</p>
                      <p className="text-[9px] sm:text-xs text-muted-foreground mt-1">{t('community.topPercent')} {leaderboardStats.percentile}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Filter */}
              <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('community.searchPlaceholder')}
                    value={leaderboardSearch}
                    onChange={(e) => setLeaderboardSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-border focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-xs sm:text-sm"
                  />
                  {leaderboardSearch && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLeaderboardSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="px-3 py-2.5 sm:px-6 sm:py-3 bg-muted border-b border-border flex items-center gap-3 sm:gap-6 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex-1">{t('community.rankUser')}</span>
                <span className="w-16 sm:w-28 text-center flex items-center gap-1 justify-center"><Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" /> {t('community.streak')}</span>
                <span className="w-16 sm:w-28 text-center flex items-center gap-1 justify-center"><TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500" /> {t('community.points')}</span>
              </div>

              {loadingLeaderboard ? (
                <div className="p-8 sm:p-12 text-center">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 animate-spin text-green-600" />
                  <p className="text-muted-foreground text-xs sm:text-sm">{t('community.loadingLeaderboard')}</p>
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="p-2 sm:p-4 space-y-1">
                  {(() => {
                    const filteredData = leaderboardSearch
                      ? leaderboardData.filter(user =>
                        user.name.toLowerCase().includes(leaderboardSearch.toLowerCase())
                      )
                      : leaderboardData;

                    if (filteredData.length === 0 && leaderboardSearch) {
                      return (
                        <div className="p-8 text-center text-muted-foreground">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-medium text-sm">{t('community.noUsersFound')}</p>
                          <p className="text-xs">{t('community.tryDifferentSearch')}</p>
                        </div>
                      );
                    }

                    return filteredData.map((user) => {
                      const isCurrentUser = currentUserRank && user.id === currentUserRank.id;
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: user.rank * 0.08 }}
                          className={`flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all ${isCurrentUser ? 'bg-green-500/10 border-2 border-green-500/30' : 'hover:bg-muted'
                            }`}
                        >
                          <div className="w-6 font-bold text-sm sm:text-lg text-muted-foreground flex justify-center flex-shrink-0">
                            {user.rank === 1 && <Medal className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-yellow-500 fill-current" />}
                            {user.rank === 2 && <Medal className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-muted-foreground fill-current" />}
                            {user.rank === 3 && <Medal className="w-5.5 h-5.5 sm:w-7 sm:h-7 text-orange-400 fill-current" />}
                            {user.rank > 3 && <span className="text-muted-foreground">{user.rank}</span>}
                          </div>

                          {user.avatarUrl && (
                            <img
                              src={user.avatarUrl}
                              className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm flex-shrink-0"
                              alt={user.name}
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-xs sm:text-sm truncate ${isCurrentUser ? 'text-green-400' : 'text-card-foreground'}`}>
                              {user.name}
                              {isCurrentUser && <span className="ms-1 text-[10px] sm:text-xs text-green-400">{t('community.you')}</span>}
                            </h4>
                            <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {leaderboardScope === 'family' ? t('community.familyLeague') : t('community.globalLeague')}
                            </div>
                          </div>

                          <div className="w-16 sm:w-28 text-center flex-shrink-0">
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                              <span className="text-sm sm:text-lg leading-none">🔥</span>
                              <span className="font-bold text-card-foreground text-xs sm:text-base leading-none">{user.streak}</span>
                            </div>
                            <div className="text-[8px] sm:text-[10px] text-muted-foreground leading-tight">{t('community.streakValue')}</div>
                          </div>

                          <div className="w-16 sm:w-28 text-end flex-shrink-0">
                            <div className="font-bold text-green-400 text-xs sm:text-lg leading-none">{user.points.toLocaleString()}</div>
                            <div className="text-[9px] sm:text-xs text-muted-foreground leading-normal">pts</div>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center text-muted-foreground">
                  <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                  {leaderboardScope === 'family' ? (
                    <>
                      <p className="font-medium text-sm">{t('community.noFamilyMembers')}</p>
                      <p className="text-xs">{t('community.familyPlanUpgrade')}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm">{t('community.noLeaderboardData')}</p>
                      <p className="text-xs">{t('community.startEarningPoints')}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};