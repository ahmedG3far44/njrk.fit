import { useEffect, useState } from 'react';
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminApi } from '../lib/adminApi';
import { KpiCard } from '../components/KpiCard';
import { SkeletonChart, SkeletonTable } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface SubscriptionTransaction {
  _id: string;
  userId: { _id: string; name: string; email: string };
  amount: number;
  currency: string;
  status: string;
  planTier: string;
  description?: string;
  createdAt: string;
}

interface RevenuePoint { date: string; revenue: number; sales: number }

export const AdminSubscriptionsPage = () => {
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txns, rev] = await Promise.all([
          adminApi.get<SubscriptionTransaction[]>('/admin/analytics/transactions?limit=100'),
          adminApi.get<RevenuePoint[]>('/admin/analytics/revenue?days=90'),
        ]);
        setTransactions(txns);
        setRevenueData(rev);
      } catch {
        setError('Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeSubs = transactions.filter(t => t.status === 'completed').length;

  if (error) {
    return (
      <EmptyState
        icon={<CreditCard className="w-6 h-6" />}
        title="Failed to load subscriptions"
        description={error}
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-title text-summit-black font-extrabold">Subscriptions & Revenue Management</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          label="Completed Sales"
          value={activeSubs}
          icon={<TrendingUp className="w-5 h-5" />}
          loading={loading}
        />
        <KpiCard
          label="Total Transactions"
          value={transactions.length}
          icon={<CreditCard className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-peak-white rounded-card border border-limestone p-5">
        <h3 className="text-heading text-summit-black mb-1">Revenue (90 days)</h3>
        <p className="text-label text-gravel mb-4">Daily revenue trend</p>
        {loading ? <SkeletonChart /> : revenueData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-body text-dust">No revenue data</div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#15803d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-peak-white rounded-card border border-limestone overflow-hidden">
        <div className="px-5 py-4 border-b border-limestone">
          <h3 className="text-heading text-summit-black">Recent Transactions</h3>
        </div>
        {loading ? (
          <SkeletonTable rows={8} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No transactions"
            description="Subscription transactions will appear here when users subscribe."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-limestone">
                    <th className="text-left px-4 py-3 text-label text-dust">User</th>
                    <th className="text-left px-4 py-3 text-label text-dust">Plan</th>
                    <th className="text-left px-4 py-3 text-label text-dust">Amount</th>
                    <th className="text-left px-4 py-3 text-label text-dust">Status</th>
                    <th className="text-left px-4 py-3 text-label text-dust">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-limestone last:border-0 hover:bg-stone/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-forest-floor flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-forest-canopy">
                              {tx.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-summit-black truncate max-w-[160px]">
                              {tx.userId?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gravel truncate max-w-[180px]">
                              {tx.userId?.email || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-label font-semibold bg-forest-floor text-forest-canopy">
                          {tx.planTier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-summit-black">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-label font-semibold ${
                          tx.status === 'completed' ? 'bg-forest-floor text-forest-canopy' :
                          tx.status === 'failed' ? 'bg-ember/5 text-ember' :
                          'bg-stone text-trail-gray'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gravel">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-limestone">
              {transactions.map((tx) => (
                <div key={tx._id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-forest-floor flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-forest-canopy">
                          {tx.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-summit-black">{tx.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gravel">{tx.userId?.email || ''}</p>
                      </div>
                    </div>
                    <span className="font-bold text-summit-black">${tx.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-0.5 rounded-pill font-semibold bg-forest-floor text-forest-canopy">
                      {tx.planTier}
                    </span>
                    <span className={`px-2 py-0.5 rounded-pill font-semibold ${
                      tx.status === 'completed' ? 'bg-forest-floor text-forest-canopy' :
                      tx.status === 'failed' ? 'bg-ember/5 text-ember' : 'bg-stone text-trail-gray'
                    }`}>
                      {tx.status}
                    </span>
                    <span className="text-gravel">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
