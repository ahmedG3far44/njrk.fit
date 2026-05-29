import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import { SkeletonChart } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface RevenuePoint { date: string; revenue: number; sales: number }
interface GrowthPoint { date: string; count: number }
interface SubDistribution { tier: string; count: number; percentage: number }

const COLORS = ['#15803d', '#16a34a', '#4ade80', '#86efac'];

export const AdminAnalyticsPage = () => {
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [growthData, setGrowthData] = useState<GrowthPoint[]>([]);
  const [distribution, setDistribution] = useState<SubDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [rev, grow, dist] = await Promise.all([
          adminApi.get<RevenuePoint[]>(`/admin/analytics/revenue?days=${days}`),
          adminApi.get<GrowthPoint[]>(`/admin/analytics/users/growth?days=${days}`),
          adminApi.get<SubDistribution[]>('/admin/analytics/subscriptions/distribution'),
        ]);
        setRevenueData(rev);
        setGrowthData(grow);
        setDistribution(dist);
      } catch {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (error) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-6 h-6" />}
        title="Failed to load analytics"
        description={error}
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-summit-black">Analytics</h1>
          <p className="text-body text-gravel mt-1">Detailed platform metrics</p>
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="h-10 px-3 pr-8 rounded-field bg-pebble border border-limestone text-sm text-trail-gray appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest-mist"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue over time */}
        <div className="bg-peak-white rounded-card border border-limestone p-5">
          <h3 className="text-heading text-summit-black mb-1">Revenue</h3>
          <p className="text-label text-gravel mb-4">Over time</p>
          {loading ? <SkeletonChart /> : revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-body text-dust">No revenue data</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15803d" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#15803d" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* User growth */}
        <div className="bg-peak-white rounded-card border border-limestone p-5">
          <h3 className="text-heading text-summit-black mb-1">User Growth</h3>
          <p className="text-label text-gravel mb-4">New users per day</p>
          {loading ? <SkeletonChart /> : growthData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-body text-dust">No growth data</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Bar dataKey="count" fill="#15803d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Subscription Distribution */}
        <div className="bg-peak-white rounded-card border border-limestone p-5">
          <h3 className="text-heading text-summit-black mb-1">Subscription Distribution</h3>
          <p className="text-label text-gravel mb-4">Plan breakdown</p>
          {loading ? <SkeletonChart /> : distribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-body text-dust">No subscription data</div>
          ) : (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="count"
                    nameKey="tier"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {distribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 shrink-0">
                {distribution.map((d, i) => (
                  <div key={d.tier} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-semibold text-trail-gray">{d.tier}</span>
                    <span className="text-xs text-gravel">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sales count chart */}
        <div className="bg-peak-white rounded-card border border-limestone p-5">
          <h3 className="text-heading text-summit-black mb-1">Sales</h3>
          <p className="text-label text-gravel mb-4">Completed subscriptions</p>
          {loading ? <SkeletonChart /> : revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-body text-dust">No sales data</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
