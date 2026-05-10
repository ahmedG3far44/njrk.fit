import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageCircle, Share2, Trophy, Users, Medal, Search, UserPlus, Check, TrendingUp, Target, Flame, Loader2, X, Image, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthProvider';
import { communityService, Post, Comment, LeaderboardEntry } from '../services/communityService';

export const Social: React.FC = () => {
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
      toast.error('Failed to load posts');
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

  // Fetch leaderboard when tab is active
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      setLoadingLeaderboard(true);
      communityService.getLeaderboard()
        .then((data) => {
          setLeaderboardData(data.leaderboard);
          setCurrentUserRank(data.currentUser);
          setLeaderboardStats({ percentile: data.percentile, totalUsers: data.totalUsers });
        })
        .catch((error) => {
          console.error('Failed to fetch leaderboard:', error);
          toast.error('Failed to load leaderboard');
        })
        .finally(() => {
          setLoadingLeaderboard(false);
        });
    }
  }, [activeTab]);

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
      toast.error('Failed to update like');
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      await communityService.deletePost(postId);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
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
        toast.error('Failed to load comments');
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
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
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
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Create post
  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error('Please write something to post');
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
      toast.success('Post created!');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
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
    <div className="space-y-6">
      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Create Post</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Share your progress..."
                  className="w-full h-32 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none resize-none text-sm"
                />

                {mediaPreview && (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      onClick={removeMedia}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer">
                    <Image className="w-5 h-5" />
                    <span>Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleCreatePost}
                  disabled={posting || !postContent.trim()}
                  className="w-full bg-gradient-to-r from-green-800 to-green-700 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {posting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Community Hub</h1>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'feed' ? 'bg-green-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-green-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{searchResults.length} user{searchResults.length > 1 ? 's' : ''} found</p>
            </div>
            <div className="divide-y divide-slate-50">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {user.avatarUrl && (
                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                    <div className="font-mono text-xs text-green-700">{user.username}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleInvite(user.username, 'team')}
                      className="flex items-center gap-1.5 text-xs bg-green-700 text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-green-800 transition-colors"
                    >
                      <Trophy className="w-3 h-3" /> Invite to Team
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === 'feed' ? (
          <>
            {/* Feed */}
            <div className="lg:col-span-2 space-y-5">
              {/* Create Post Card */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex gap-4">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Share your progress..."
                  onClick={() => setShowCreateModal(true)}
                  readOnly
                  className="flex-1 bg-slate-50 rounded-xl px-4 outline-none focus:ring-2 focus:ring-green-100 transition-all text-sm cursor-pointer"
                />
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-700 text-white px-6 rounded-xl font-bold hover:bg-green-800 transition-colors text-sm"
                >
                  Post
                </button>
              </div>

              {/* Posts */}
              {loading ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-600" />
                  <p className="text-slate-500">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getUserAvatar(post.userId) ? (
                          <img src={getUserAvatar(post.userId)!} alt={getUserName(post.userId)} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{getUserName(post.userId)}</h3>
                          <p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      {isPostOwner(post) && (
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-slate-700 mb-4 leading-relaxed text-sm whitespace-pre-wrap">{post.content}</p>

                    {post.mediaUrl && (
                      <div className="rounded-2xl overflow-hidden mb-4">
                        <img src={post.mediaUrl} alt="Post" className="w-full object-cover h-48" />
                      </div>
                    )}

                    <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                      >
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{post.likeCount}</span>
                      </button>
                      <button
                        onClick={() => handleToggleComments(post._id)}
                        className={`flex items-center gap-2 transition-colors ${expandedPostId === post._id ? 'text-green-600' : 'text-slate-500 hover:text-green-600'}`}
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.commentCount}</span>
                      </button>
                      <button className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {expandedPostId === post._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-slate-100"
                        >
                          {/* Add Comment Input */}
                          <div className="flex gap-2 mb-4">
                            <input
                              type="text"
                              value={newComment[post._id] || ''}
                              onChange={e => setNewComment(prev => ({ ...prev, [post._id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleAddComment(post._id)}
                              placeholder="Write a comment..."
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 outline-none text-sm"
                            />
                            <button
                              onClick={() => handleAddComment(post._id)}
                              disabled={!newComment[post._id]?.trim()}
                              className="bg-green-700 text-white p-2 rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Comments List */}
                          {loadingComments[post._id] ? (
                            <div className="text-center py-4">
                              <Loader2 className="w-5 h-5 mx-auto animate-spin text-slate-400" />
                            </div>
                          ) : comments[post._id]?.length > 0 ? (
                            <div className="space-y-3">
                              {comments[post._id].map(comment => (
                                <div key={comment._id} className="flex gap-2">
                                  {comment.userId && typeof comment.userId === 'object' && comment.userId.avatarUrl ? (
                                    <img src={comment.userId.avatarUrl} alt={typeof comment.userId === 'object' ? comment.userId.name || '' : ''} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                      <Users className="w-4 h-4 text-slate-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-sm text-slate-900">
                                        {comment.userId && typeof comment.userId === 'object' ? comment.userId.name || 'User' : 'User'}
                                      </span>
                                      {isCommentOwner(comment) && (
                                        <button
                                          onClick={() => handleDeleteComment(post._id, comment._id)}
                                          className="text-slate-400 hover:text-red-500 p-1"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-600">{comment.content}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>
                                      <button className="text-xs font-medium text-slate-500 hover:text-red-500 flex items-center gap-1">
                                        <Heart className="w-3 h-3" /> Like
                                      </button>
                                      <button className="text-xs font-medium text-slate-500 hover:text-green-600 flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" /> Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 text-center py-2">No comments yet. Be the first to comment!</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No posts yet</p>
                  <p className="text-sm">Be the first to share your progress!</p>
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
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-800 to-green-700 p-6 rounded-3xl text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Your Squad</h3>
                </div>
                <p className="text-green-200 text-sm mb-5">Join a team to compete with others!</p>
                <div className="flex items-center justify-center h-10 mb-5">
                  <span className="text-green-300 text-sm">No active team</span>
                </div>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2.5 rounded-xl text-sm font-bold transition-colors">
                  Find a Team
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Trending Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['#MorningRun', '#HealthyEating', '#YogaLife', '#Keto', '#MarathonPrep', '#Njerka30Day'].map(tag => (
                    <span key={tag} className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors">
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 bg-gradient-to-r from-green-900 to-green-800 text-center text-white">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400 fill-current" />
                <h2 className="text-3xl font-bold mb-2">Global Leaderboard</h2>
                <p className="text-green-200">Ranked by Streak Score & Goal Adherence</p>
              </div>

              {/* Current User Stats */}
              {currentUserRank && (
                <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentUserRank.avatarUrl}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        alt={currentUserRank.name}
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{currentUserRank.name}</p>
                        <p className="text-xs text-green-600 font-medium">Your Rank: #{currentUserRank.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-green-700">{leaderboardStats.percentile}%</p>
                      <p className="text-xs text-slate-500">Top {leaderboardStats.percentile}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Filter */}
              <div className="px-6 py-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={leaderboardSearch}
                    onChange={(e) => setLeaderboardSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none text-sm"
                  />
                  {leaderboardSearch && (
                    <button
                      onClick={() => setLeaderboardSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex-1">Rank / User</span>
                <span className="w-24 text-center flex items-center gap-1 justify-center"><Flame className="w-3.5 h-3.5 text-orange-500" /> Streak</span>
                <span className="w-28 text-center flex items-center gap-1 justify-center"><Target className="w-3.5 h-3.5 text-green-500" /> Goal %</span>
                <span className="w-24 text-center flex items-center gap-1 justify-center"><TrendingUp className="w-3.5 h-3.5 text-green-500" /> Points</span>
              </div>

              {loadingLeaderboard ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-600" />
                  <p className="text-slate-500">Loading leaderboard...</p>
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="p-4 space-y-1">
                  {(() => {
                    const filteredData = leaderboardSearch
                      ? leaderboardData.filter(user =>
                        user.name.toLowerCase().includes(leaderboardSearch.toLowerCase())
                      )
                      : leaderboardData;

                    if (filteredData.length === 0 && leaderboardSearch) {
                      return (
                        <div className="p-8 text-center text-slate-400">
                          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No users found</p>
                          <p className="text-sm">Try a different search term</p>
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
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${isCurrentUser ? 'bg-green-50 border-2 border-green-200' : 'hover:bg-slate-50'
                            }`}
                        >
                          <div className="w-8 font-bold text-lg text-slate-400 flex justify-center flex-shrink-0">
                            {user.rank === 1 && <Medal className="w-7 h-7 text-yellow-500 fill-current" />}
                            {user.rank === 2 && <Medal className="w-7 h-7 text-slate-400 fill-current" />}
                            {user.rank === 3 && <Medal className="w-7 h-7 text-orange-400 fill-current" />}
                            {user.rank > 3 && <span className="text-slate-400">{user.rank}</span>}
                          </div>

                          {user.avatarUrl && (
                            <img
                              src={user.avatarUrl}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                              alt={user.name}
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-sm ${isCurrentUser ? 'text-green-800' : 'text-slate-900'}`}>
                              {user.name}
                              {isCurrentUser && <span className="ml-2 text-xs text-green-600">(You)</span>}
                            </h4>
                            <div className="text-xs text-slate-400">Global League</div>
                          </div>

                          <div className="w-24 text-center flex-shrink-0">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-lg">🔥</span>
                              <span className="font-bold text-slate-900">{user.streak}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">day streak</div>
                          </div>

                          <div className="w-28 flex-shrink-0">
                            <div className="flex items-between mb-1">
                              <span className="text-xs font-bold text-slate-900">{user.goalAdherence}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${user.goalAdherence >= 90 ? 'bg-green-500' : user.goalAdherence >= 75 ? 'bg-green-400' : 'bg-orange-500'}`}
                                style={{ width: `${user.goalAdherence}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">goal adherence</div>
                          </div>

                          <div className="w-24 text-right flex-shrink-0">
                            <div className="font-bold text-green-700 text-lg">{user.points.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">pts</div>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No leaderboard data</p>
                  <p className="text-sm">Start earning points to appear here!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};