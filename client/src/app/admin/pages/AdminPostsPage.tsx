import { useEffect, useState, useCallback } from 'react';
import {
  MessageCircle,
  Search,
  Trash2,
  Heart,
  MessageSquare,
  ImageIcon,
} from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { SkeletonTable } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface PostUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Post {
  _id: string;
  userId: PostUser;
  content: string;
  mediaUrl?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface PostsResponse {
  posts: Post[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const AdminPostsPage = () => {
  const [data, setData] = useState<PostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deletePost, setDeletePost] = useState<Post | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);

      const res = await adminApi.get<PostsResponse>(`/admin/posts?${params.toString()}`);
      setData(res);
    } catch {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!deletePost) return;
    setActionLoading(true);
    try {
      await adminApi.delete(`/admin/posts/${deletePost._id}`);
      setDeletePost(null);
      fetchPosts();
    } catch {
      setError('Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPosts = data?.posts.filter(post =>
    !search ||
    post.content?.toLowerCase().includes(search.toLowerCase()) ||
    post.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    post.userId?.email?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-title text-summit-black font-extrabold">Posts & Managing Community Content</h1>
      </div>

      {error && (
        <div className="p-3 rounded-field bg-ember/5 border border-ember/20">
          <p className="text-sm text-ember font-medium">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dust" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts by content, name, or email..."
            className="w-full h-10 pl-9 pr-3 rounded-field bg-pebble border border-limestone text-sm text-summit-black placeholder:text-dust focus:outline-none focus:ring-2 focus:ring-forest-mist transition-shadow"
          />
        </div>
        <div className="text-sm text-gravel">
          {data && <span>{data.pagination.total} post{data.pagination.total !== 1 ? 's' : ''} total</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} />
      ) : data && data.posts.length > 0 ? (
        <div className="bg-peak-white rounded-card border border-limestone overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-limestone">
                  <th className="text-left px-4 py-3 text-label text-dust font-semibold whitespace-nowrap">User</th>
                  <th className="text-left px-4 py-3 text-label text-dust font-semibold whitespace-nowrap">Email</th>
                  <th className="text-left px-4 py-3 text-label text-dust font-semibold whitespace-nowrap">Content</th>
                  <th className="text-center px-3 py-3 text-label text-dust font-semibold whitespace-nowrap">Media</th>
                  <th className="text-center px-3 py-3 text-label text-dust font-semibold whitespace-nowrap">Likes</th>
                  <th className="text-center px-3 py-3 text-label text-dust font-semibold whitespace-nowrap">Comments</th>
                  <th className="text-left px-4 py-3 text-label text-dust font-semibold whitespace-nowrap">Posted</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post._id} className="border-b border-limestone last:border-0 hover:bg-stone/30 transition-colors align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {post.userId?.avatarUrl ? (
                          <img src={post.userId.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-forest-floor flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-forest-canopy">
                              {post.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-semibold text-summit-black truncate max-w-[160px]">
                          {post.userId?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-trail-gray truncate max-w-[200px]">
                      {post.userId?.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-trail-gray max-w-[300px]">
                      <p className="truncate">{post.content}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {post.mediaUrl ? (
                        <a
                          href={post.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-stone text-trail-gray hover:bg-limestone transition-colors"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>View</span>
                        </a>
                      ) : (
                        <span className="text-dust text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1 text-sm text-gravel">
                        <Heart className="w-3.5 h-3.5" />
                        {post.likeCount}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1 text-sm text-gravel">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.commentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gravel whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setDeletePost(post)}
                          className="p-1.5 rounded-lg text-dust hover:bg-ember/5 hover:text-ember transition-colors shrink-0"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-limestone">
            {filteredPosts.map((post) => (
              <div key={post._id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {post.userId?.avatarUrl ? (
                      <img src={post.userId.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-forest-floor flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-forest-canopy">
                          {post.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-summit-black truncate">{post.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gravel truncate">{post.userId?.email || ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeletePost(post)}
                    className="p-2 rounded-lg text-dust hover:bg-ember/5 hover:text-ember transition-colors shrink-0"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-trail-gray">{post.content}</p>
                <div className="flex items-center gap-3">
                  {post.mediaUrl && (
                    <a
                      href={post.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-stone text-trail-gray"
                    >
                      <ImageIcon className="w-3 h-3" /> Media
                    </a>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-gravel">
                    <Heart className="w-3 h-3" /> {post.likeCount}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gravel">
                    <MessageSquare className="w-3 h-3" /> {post.commentCount}
                  </span>
                  <span className="text-xs text-gravel ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={data.pagination.page}
            pages={data.pagination.pages}
            total={data.pagination.total}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptyState
          icon={<MessageCircle className="w-6 h-6" />}
          title="No posts found"
          description={search ? 'Try a different search term' : 'No community posts have been created yet'}
        />
      )}

      <ConfirmDialog
        open={!!deletePost}
        onClose={() => setDeletePost(null)}
        onConfirm={handleDelete}
        title="Delete Post"
        description="This action is permanent. The post and all associated likes and comments will be removed."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={actionLoading}
        icon={<Trash2 className="w-6 h-6 text-ember" />}
      />
    </div>
  );
};
