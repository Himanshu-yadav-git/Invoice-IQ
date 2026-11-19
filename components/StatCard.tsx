'use client';

import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';

type Color = 'blue' | 'purple' | 'emerald' | 'amber' | 'red';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: Color;
}

const colorConfig: Record<
  Color,
  { iconBg: string; iconShadow: string; iconText: string; trendUp: string; trendDown: string }
> = {
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-500/20 border border-blue-100 dark:border-blue-500/30',
    iconShadow: 'shadow-xs dark:shadow-none',
    iconText: 'text-blue-600 dark:text-blue-400',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
  purple: {
    iconBg: 'bg-purple-50 dark:bg-purple-500/20 border border-purple-100 dark:border-purple-500/30',
    iconShadow: 'shadow-xs dark:shadow-none',
    iconText: 'text-purple-600 dark:text-purple-400',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30',
    iconShadow: 'shadow-xs dark:shadow-none',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/20 border border-amber-100 dark:border-amber-500/30',
    iconShadow: 'shadow-xs dark:shadow-none',
    iconText: 'text-amber-600 dark:text-amber-400',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
  red: {
    iconBg: 'bg-red-50 dark:bg-red-500/20 border border-red-100 dark:border-red-500/30',
    iconShadow: 'shadow-xs dark:shadow-none',
    iconText: 'text-red-600 dark:text-red-400',
    trendUp: 'text-emerald-600 dark:text-emerald-400',
    trendDown: 'text-red-600 dark:text-red-400',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: StatCardProps) {
  const cfg = colorConfig[color];
  const isPositive = trend ? trend.value >= 0 : false;

  return (
    <div className="stat-card glass-card rounded-2xl p-5 flex flex-col gap-4">
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shadow-lg',
            cfg.iconBg,
            cfg.iconShadow,
            cfg.iconText,
          )}
        >
          {icon}
        </div>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold',
              isPositive ? cfg.trendUp : 'text-red-400',
            )}
          >
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>
              {isPositive ? '+' : ''}
              {trend.value}%
            </span>
          </div>
        )}
      </div>

      {/* Value + title */}
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
          {value}
        </p>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trend.label}</p>
        )}
      </div>
    </div>
  );
}
