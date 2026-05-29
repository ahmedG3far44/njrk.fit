import { type ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  loading?: boolean;
}

export const KpiCard = ({ label, value, icon, trend, loading }: KpiCardProps) => {
  if (loading) {
    return (
      <div className="bg-peak-white rounded-card border border-limestone p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-20 h-4 bg-stone rounded animate-pulse" />
          <div className="w-10 h-10 rounded-xl bg-stone animate-pulse" />
        </div>
        <div className="w-16 h-8 bg-stone rounded animate-pulse" />
        {trend && <div className="w-24 h-3 mt-3 bg-stone rounded animate-pulse" />}
      </div>
    );
  }

  return (
    <div className="bg-peak-white rounded-card border border-limestone p-5 transition-colors hover:border-dust/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label text-gravel uppercase tracking-wider">{label}</span>
        <div className="w-10 h-10 rounded-xl bg-forest-floor flex items-center justify-center">
          <div className="text-forest-canopy">{icon}</div>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-summit-black tracking-tight">{value}</span>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`text-xs font-semibold ${
              trend.positive ? 'text-forest-canopy' : 'text-ember'
            }`}
          >
            {trend.positive ? '+' : ''}{trend.value}
          </span>
          <span className="text-label text-dust">vs last month</span>
        </div>
      )}
    </div>
  );
};
