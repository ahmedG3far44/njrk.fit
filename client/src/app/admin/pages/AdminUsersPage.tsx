import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  ChevronDown,
  Ban,
  CheckCircle,
  Trash2,
  UserX,
  Pencil,
  ShieldCheck,
  ShieldX,
  Globe,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminApi } from '../lib/adminApi';
import { SkeletonTable } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  subscription?: { subscriptionTier?: string; status?: string };
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  isEmailVerified?: boolean;
  googleId?: string;
  language?: string;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const tierColors: Record<string, string> = {
  BASIC: 'bg-stone text-trail-gray',
  PRO: 'bg-forest-floor text-forest-canopy',
  FAMILY: 'bg-amber-50 text-amber-700',
};

const TierBadge = ({ tier }: { tier?: string }) => {
  if (!tier) return null;
  const colorClass = tierColors[tier] || 'bg-stone text-trail-gray';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-label font-semibold ${colorClass}`}>
      {tier}
    </span>
  );
};

export const AdminUsersPage = () => {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('');
  const [filterProvider, setFilterProvider] = useState<'email' | 'google' | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'blocked' | 'all'>('active');
  const [page, setPage] = useState(1);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editLanguage, setEditLanguage] = useState<'en' | 'ar'>('en');
  const [editLoading, setEditLoading] = useState(false);
  const [tierUser, setTierUser] = useState<User | null>(null);
  const [tierValue, setTierValue] = useState<string>('BASIC');
  const [tierLoading, setTierLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      params.set('status', filterStatus);
      params.set('provider', filterProvider);
      if (search) params.set('search', search);
      if (filterTier) params.set('tier', filterTier);

      const res = await adminApi.get<UsersResponse>(`/admin/users?${params.toString()}`);
      setData(res);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterTier, filterProvider, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, filterTier, filterProvider, filterStatus]);

  const handleAction = async () => {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      if (actionType === 'block') {
        await adminApi.patch(`/admin/users/${actionUser._id}/block`, { reason: blockReason || 'No reason provided' });
      } else if (actionType === 'unblock') {
        await adminApi.patch(`/admin/users/${actionUser._id}/unblock`);
      } else if (actionType === 'delete') {
        await adminApi.delete(`/admin/users/${actionUser._id}`);
      }
      setActionUser(null);
      setActionType(null);
      setBlockReason('');
      fetchUsers();
    } catch {
      setError('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditLanguage = async () => {
    if (!editUser) return;
    setEditLoading(true);
    try {
      await adminApi.patch(`/admin/users/${editUser._id}`, { language: editLanguage });
      setEditUser(null);
      fetchUsers();
    } catch {
      setError('Failed to update language');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangeTier = async () => {
    if (!tierUser) return;
    setTierLoading(true);
    try {
      await adminApi.patch(`/admin/users/${tierUser._id}`, { subscriptionTier: tierValue });
      setTierUser(null);
      fetchUsers();
    } catch {
      setError('Failed to update subscription tier');
    } finally {
      setTierLoading(false);
    }
  };

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'blocked', label: 'Blocked' },
  ];

  const tierFilters = ['', 'BASIC', 'PRO', 'FAMILY'];
  const tierLabels: Record<string, string> = { '': 'All Tiers', BASIC: 'BASIC', PRO: 'PRO', FAMILY: 'FAMILY' };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-title text-summit-black font-extrabold">Users & Managing Platform Users</h1>
      </div>

      {error && (
        <div className="p-3 rounded-field bg-ember/5 border border-ember/20">
          <p className="text-sm text-ember font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dust" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-9 pr-3 rounded-field bg-pebble border border-limestone text-sm text-summit-black placeholder:text-dust focus:outline-none focus:ring-2 focus:ring-forest-mist transition-shadow"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Tier filter */}
          <div className="relative">
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className="h-10 px-3 pr-8 rounded-field bg-pebble border border-limestone text-sm text-trail-gray appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest-mist"
            >
              {tierFilters.map(t => (
                <option key={t} value={t}>{tierLabels[t]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dust pointer-events-none" />
          </div>

          {/* Provider filter */}
          <div className="flex bg-pebble rounded-field border border-limestone p-0.5">
            <button
              onClick={() => setFilterProvider('all')}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-colors ${
                filterProvider === 'all'
                  ? 'bg-peak-white text-summit-black shadow-sm'
                  : 'text-dust hover:text-trail-gray'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterProvider('email')}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-colors ${
                filterProvider === 'email'
                  ? 'bg-peak-white text-summit-black shadow-sm'
                  : 'text-dust hover:text-trail-gray'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setFilterProvider('google')}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-colors ${
                filterProvider === 'google'
                  ? 'bg-peak-white text-summit-black shadow-sm'
                  : 'text-dust hover:text-trail-gray'
              }`}
            >
              Google
            </button>
          </div>

          {/* Status filter */}
          <div className="flex bg-pebble rounded-field border border-limestone p-0.5">
            {filterTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value as typeof filterStatus)}
                className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-colors ${
                  filterStatus === tab.value
                    ? 'bg-peak-white text-summit-black shadow-sm'
                    : 'text-dust hover:text-trail-gray'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} />
      ) : data && data.users.length > 0 ? (
        <div className="bg-peak-white rounded-card border border-limestone overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-limestone">
                  <th className="text-left px-4 py-3 text-label text-dust font-semibold whitespace-nowrap">User</th>
                  <th className="text-left px-4 py-3 text-label text-dust font-semibold whitespace-nowrap">Email</th>
                  <th className="text-center px-3 py-3 text-label text-dust font-semibold whitespace-nowrap">Auth</th>
                  <th className="text-center px-3 py-3 text-label text-dust font-semibold whitespace-nowrap">Verified</th>
                  <th className="text-center px-3 py-3 text-label text-dust font-semibold whitespace-nowrap">Tier</th>
                  <th className="text-center px-3 py-3 text-label text-dust font-semibold whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-label text-dust font-semibold whitespace-nowrap">Joined</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user._id} className="border-b border-limestone last:border-0 hover:bg-stone/30 transition-colors align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-forest-floor flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-forest-canopy">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-semibold text-summit-black truncate max-w-[160px]">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-trail-gray truncate max-w-[200px]">{user.email}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-stone text-trail-gray whitespace-nowrap">
                        {user.googleId ? <Globe className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {user.googleId ? 'Google' : 'Email'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {user.isEmailVerified ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-forest-floor text-forest-canopy whitespace-nowrap">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-amber-50 text-amber-700 whitespace-nowrap">
                          <ShieldX className="w-3 h-3" />
                          <span>No</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <TierBadge tier={user.subscription?.subscriptionTier} />
                    </td>
                    <td className="px-3 py-3 text-center">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-ember/5 text-ember whitespace-nowrap">
                          <Ban className="w-3 h-3" /> Blocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-forest-floor text-forest-canopy whitespace-nowrap">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gravel whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-0.5 flex-nowrap">
                        <button
                          onClick={() => { setTierUser(user); setTierValue(user.subscription?.subscriptionTier || 'BASIC'); }}
                          className="p-1.5 rounded-lg text-dust hover:bg-forest-floor hover:text-forest-canopy transition-colors shrink-0"
                          title="Change Subscription Tier"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditUser(user); setEditLanguage((user.language || 'en') as 'en' | 'ar'); }}
                          className="p-1.5 rounded-lg text-dust hover:bg-forest-floor hover:text-forest-canopy transition-colors shrink-0"
                          title="Edit Language"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user.isBlocked ? (
                          <button
                            onClick={() => { setActionUser(user); setActionType('unblock'); }}
                            className="p-1.5 rounded-lg text-dust hover:bg-forest-floor hover:text-forest-canopy transition-colors shrink-0"
                            title="Unblock"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setActionUser(user); setActionType('block'); setBlockReason(''); }}
                            className="p-1.5 rounded-lg text-dust hover:bg-ember/5 hover:text-ember transition-colors shrink-0"
                            title="Block"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { setActionUser(user); setActionType('delete'); }}
                          className="p-1.5 rounded-lg text-dust hover:bg-ember/5 hover:text-ember transition-colors shrink-0"
                          title="Delete"
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
            {data.users.map((user) => (
              <div key={user._id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-forest-floor flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-forest-canopy">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-summit-black">{user.name}</p>
                      <p className="text-xs text-gravel">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TierBadge tier={user.subscription?.subscriptionTier} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-stone text-trail-gray">
                    {user.googleId ? <Globe className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                    {user.googleId ? 'Google' : 'Email'}
                  </span>
                  {user.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-forest-floor text-forest-canopy">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-amber-50 text-amber-700">
                      <ShieldX className="w-3 h-3" /> Unverified
                    </span>
                  )}
                  {user.isBlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-ember/5 text-ember">
                      <Ban className="w-3 h-3" /> Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold bg-forest-floor text-forest-canopy">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                  <span className="text-xs text-gravel">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => { setTierUser(user); setTierValue(user.subscription?.subscriptionTier || 'BASIC'); }}
                    className="p-2 rounded-lg text-dust hover:bg-stone transition-colors"
                    title="Change Subscription Tier"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditUser(user); setEditLanguage((user.language || 'en') as 'en' | 'ar'); }}
                    className="p-2 rounded-lg text-dust hover:bg-stone transition-colors"
                    title="Edit Language"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {user.isBlocked ? (
                    <button
                      onClick={() => { setActionUser(user); setActionType('unblock'); }}
                      className="p-2 rounded-lg text-trail-gray hover:bg-stone transition-colors"
                      title="Unblock"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setActionUser(user); setActionType('block'); setBlockReason(''); }}
                      className="p-2 rounded-lg text-dust hover:bg-stone transition-colors"
                      title="Block"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setActionUser(user); setActionType('delete'); }}
                    className="p-2 rounded-lg text-dust hover:bg-ember/5 hover:text-ember transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
          icon={<Users className="w-6 h-6" />}
          title="No users found"
          description={search ? 'Try a different search term' : 'No users have registered yet'}
        />
      )}

      {/* Block reason dialog */}
      <ConfirmDialog
        open={actionType === 'block'}
        onClose={() => { setActionType(null); setActionUser(null); }}
        onConfirm={handleAction}
        title="Block User"
        description="This user will lose access to the platform. Provide a reason:"
        confirmLabel="Block"
        confirmVariant="danger"
        loading={actionLoading}
        icon={<Ban className="w-6 h-6 text-ember" />}
      >
        <div className="mb-4">
          <textarea
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
            placeholder="Reason for blocking..."
            className="w-full h-20 px-3 py-2 rounded-field bg-pebble border border-limestone text-sm text-summit-black placeholder:text-dust resize-none focus:outline-none focus:ring-2 focus:ring-forest-mist"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={actionType === 'unblock'}
        onClose={() => { setActionType(null); setActionUser(null); }}
        onConfirm={handleAction}
        title="Unblock User"
        description="This user will regain access to the platform."
        confirmLabel="Unblock"
        confirmVariant="primary"
        loading={actionLoading}
        icon={<CheckCircle className="w-6 h-6 text-forest-canopy" />}
      />

      <ConfirmDialog
        open={actionType === 'delete'}
        onClose={() => { setActionType(null); setActionUser(null); }}
        onConfirm={handleAction}
        title="Delete User"
        description="This action is permanent. All user data will be removed."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={actionLoading}
        icon={<Trash2 className="w-6 h-6 text-ember" />}
      />

      {/* Edit Language Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setEditUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-peak-white rounded-container p-6 max-w-sm w-full shadow-modal"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-forest-floor">
                <Pencil className="w-6 h-6 text-forest-canopy" />
              </div>
              <h3 className="text-heading text-summit-black text-center mb-2">Edit User Language</h3>
              <p className="text-body text-trail-gray text-center mb-4">
                Change the app language for <strong>{editUser.name}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-trail-gray mb-1.5">Language</label>
                <select
                  value={editLanguage}
                  onChange={e => setEditLanguage(e.target.value as 'en' | 'ar')}
                  className="w-full h-10 px-3 rounded-field bg-pebble border border-limestone text-sm text-summit-black focus:outline-none focus:ring-2 focus:ring-forest-mist"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditUser(null)}
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-button border border-limestone font-semibold text-trail-gray text-sm hover:bg-stone transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditLanguage}
                  disabled={editLoading}
                  className="flex-1 py-2.5 rounded-button font-bold text-sm bg-forest-canopy text-peak-white hover:bg-forest-deep transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editLoading && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Tier Modal */}
      <AnimatePresence>
        {tierUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setTierUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-peak-white rounded-container p-6 max-w-sm w-full shadow-modal"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-forest-floor">
                <RefreshCw className="w-6 h-6 text-forest-canopy" />
              </div>
              <h3 className="text-heading text-summit-black text-center mb-2">Change Subscription Tier</h3>
              <p className="text-body text-trail-gray text-center mb-4">
                Update subscription plan for <strong>{tierUser.name}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-trail-gray mb-1.5">Plan Tier</label>
                <select
                  value={tierValue}
                  onChange={e => setTierValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-field bg-pebble border border-limestone text-sm text-summit-black focus:outline-none focus:ring-2 focus:ring-forest-mist"
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PRO">PRO</option>
                  <option value="FAMILY">FAMILY</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setTierUser(null)}
                  disabled={tierLoading}
                  className="flex-1 py-2.5 rounded-button border border-limestone font-semibold text-trail-gray text-sm hover:bg-stone transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeTier}
                  disabled={tierLoading}
                  className="flex-1 py-2.5 rounded-button font-bold text-sm bg-forest-canopy text-peak-white hover:bg-forest-deep transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {tierLoading && (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
