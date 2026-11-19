'use client';

import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  /**
   * Map the semantic color name returned by getStatusColor to actual
   * Tailwind-safe class strings.  We use an explicit map so that Tailwind's
   * JIT scanner can see the full class names and include them in the bundle.
   */
  const colorMap: Record<
    string,
    { dot: string; text: string; bg: string; border: string }
  > = {
    emerald: {
      dot: 'bg-emerald-500 dark:bg-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-400/10',
      border: 'border-emerald-200 dark:border-emerald-400/20',
    },
    blue: {
      dot: 'bg-blue-500 dark:bg-blue-400',
      text: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-400/10',
      border: 'border-blue-200 dark:border-blue-400/20',
    },
    amber: {
      dot: 'bg-amber-500 dark:bg-amber-400',
      text: 'text-amber-800 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-400/10',
      border: 'border-amber-200 dark:border-amber-400/20',
    },
    red: {
      dot: 'bg-red-500 dark:bg-red-400',
      text: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-400/10',
      border: 'border-red-200 dark:border-red-400/20',
    },
    purple: {
      dot: 'bg-purple-500 dark:bg-purple-400',
      text: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-400/10',
      border: 'border-purple-200 dark:border-purple-400/20',
    },
    slate: {
      dot: 'bg-slate-500 dark:bg-slate-400',
      text: 'text-slate-700 dark:text-slate-300',
      bg: 'bg-slate-100 dark:bg-slate-400/10',
      border: 'border-slate-200 dark:border-slate-400/20',
    },
  };

  const palette = colorMap[color] ?? colorMap['slate'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        palette.bg,
        palette.border,
        palette.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          palette.dot,
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        )}
      />
      {label}
    </span>
  );
}
