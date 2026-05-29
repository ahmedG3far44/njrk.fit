import { useEffect, useState } from 'react';
import {
  Users,
  DollarSign,
  Activity,
  CreditCard,
} from 'lucide-react';
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
} from 'recharts';
import { adminApi } from '../lib/adminApi';
import { KpiCard } from '../components/KpiCard';
import { SkeletonChart } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { BarChart3 } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers30d: number;
  blockedUsers: number;
  totalSalesPeriod: number;
  totalSalesAllTime: number;
  totalRevenue: number;
  totalPlans: Record<string, number>;
  churnRate: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  sales: number;
}

interface GrowthDataPoint {
  date: string;
  count: number;
}

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, growthRes] = await Promise.all([
          adminApi.get<DashboardStats>('/admin/analytics/dashboard'),
          adminApi.get<RevenueDataPoint[]>('/admin/analytics/revenue?days=30'),
          adminApi.get<GrowthDataPoint[]>('/admin/analytics/users/growth?days=30'),
        ]);
        setStats(statsRes);
        setRevenueData(revenueRes);
        setGrowthData(growthRes);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-6 h-6" />}
        title="Failed to load dashboard"
        description={error}
        action={{ label: 'Retry', onClick: () => window.location.reload() }}
      />
    );
  }

  const kpis = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="w-5 h-5" />,
      trend: stats ? { value: `${stats.newUsers30d} new`, positive: true } : undefined,
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers ?? 0,
      icon: <Activity className="w-5 h-5" />,
    },
    {
      label: 'Revenue (30d)',
      value: stats ? `$${stats.totalRevenue.toLocaleString()}` : '$0',
      icon: <DollarSign className="w-5 h-5" />,
      trend: stats ? { value: `${stats.totalSalesPeriod} sales`, positive: true } : undefined,
    },
    {
      label: 'Total Plans',
      value: stats ? Object.values(stats.totalPlans).reduce((a, b) => a + b, 0) : 0,
      icon: <CreditCard className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-title text-summit-black">Dashboard</h1>
        <p className="text-body text-gravel mt-1">Platform overview at a glance</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            loading={loading}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-peak-white rounded-card border border-limestone p-5">
          <h3 className="text-heading text-summit-black mb-1">Revenue</h3>
          <p className="text-label text-gravel mb-4">Last 30 days</p>
          {loading ? (
            <SkeletonChart />
          ) : revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-body text-dust">No revenue data yet</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#15803d" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#15803d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#15803d"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* User Growth Chart */}
        <div className="bg-peak-white rounded-card border border-limestone p-5">
          <h3 className="text-heading text-summit-black mb-1">User Growth</h3>
          <p className="text-label text-gravel mb-4">New users per day</p>
          {loading ? (
            <SkeletonChart />
          ) : growthData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-body text-dust">No growth data yet</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#15803d"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#15803d' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
