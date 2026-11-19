'use client';

import { formatRelativeTime } from '@/lib/utils';
import type { ActivityItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  ThumbsUp,
  Upload,
  XCircle,
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

type ActivityType = ActivityItem['type'];

const iconConfig: Record<
  ActivityType,
  { icon: React.ReactNode; bg: string; text: string }
> = {
  upload: {
    icon: <Upload size={14} />,
    bg: 'bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-transparent',
    text: 'text-blue-600 dark:text-blue-400',
  },
  processed: {
    icon: <CheckCircle size={14} />,
    bg: 'bg-green-50 dark:bg-green-500/15 border border-green-100 dark:border-transparent',
    text: 'text-green-600 dark:text-green-400',
  },
  approved: {
    icon: <ThumbsUp size={14} />,
    bg: 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-100 dark:border-transparent',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  rejected: {
    icon: <XCircle size={14} />,
    bg: 'bg-red-50 dark:bg-red-500/15 border border-red-100 dark:border-transparent',
    text: 'text-red-600 dark:text-red-400',
  },
  review: {
    icon: <AlertCircle size={14} />,
    bg: 'bg-amber-50 dark:bg-amber-500/15 border border-amber-100 dark:border-transparent',
    text: 'text-amber-600 dark:text-amber-400',
  },
};

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/30 text-sm gap-2">
        <AlertCircle size={28} className="opacity-40" />
        <span>No recent activity</span>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {activities.map((item) => {
        const cfg = iconConfig[item.type] ?? iconConfig['review'];
        return (
          <li
            key={item.id}
            className="flex items-start gap-3 px-1 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150 group"
          >
            {/* Icon */}
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                cfg.bg,
                cfg.text,
              )}
            >
              {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium text-slate-800 dark:text-white/85 leading-tight truncate"
                title={item.documentName}
              >
                {truncate(item.documentName, 36)}
              </p>
              <p className="text-xs text-slate-500 dark:text-white/45 leading-snug mt-0.5 line-clamp-2">
                {item.details}
              </p>
            </div>

            {/* Timestamp */}
            <span className="text-xs text-slate-400 dark:text-white/30 flex-shrink-0 mt-0.5 group-hover:text-slate-600 dark:group-hover:text-white/50 transition-colors">
              {formatRelativeTime(item.timestamp)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
