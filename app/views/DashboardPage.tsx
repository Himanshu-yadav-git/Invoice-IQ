'use client';

import { FileText, CheckCircle, Clock, Copy, Plus, Upload } from 'lucide-react';
import { Document } from '@/lib/types';
import { processingChartData, recentActivity } from '@/lib/data';
import StatCard from '@/components/StatCard';
import ActivityFeed from '@/components/ActivityFeed';
import DocumentTable from '@/components/DocumentTable';

interface DashboardPageProps {
  documents: Document[];
  onOpenNewDocModal?: () => void;
  onNavigateToUpload?: () => void;
  onSelectDoc?: (doc: Document) => void;
}

export function DashboardPage({
  documents,
  onOpenNewDocModal,
  onNavigateToUpload,
  onSelectDoc,
}: DashboardPageProps) {
  const processedCount = documents.filter(d => d.status === 'processed').length;
  const pendingCount = documents.filter(d => d.status === 'pending' || d.status === 'review').length;
  const duplicateCount = documents.filter(d => d.status === 'duplicate').length;

  const maxProcessed = Math.max(...processingChartData.map(d => d.processed + d.failed), 1);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Enterprise Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered invoice & document processing pipeline</p>
        </div>
        <div className="flex items-center gap-2.5">
          {onOpenNewDocModal && (
            <button
              type="button"
              onClick={onOpenNewDocModal}
              className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-medium"
            >
              <Plus size={14} /> Quick Entry
            </button>
          )}
          {onNavigateToUpload && (
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 font-medium"
            >
              <Upload size={14} /> Upload Scans
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Processed"
          value={String(244 + processedCount)}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Successful Extractions"
          value={String(228 + processedCount)}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
          trend={{ value: 12, label: '+12% this week' }}
        />
        <StatCard
          title="Pending Reviews"
          value={String(pendingCount)}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          title="Duplicates"
          value={String(duplicateCount)}
          icon={<Copy className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Chart + Activity Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Processing This Week</h2>
            <p className="text-sm text-slate-400 mt-1">Daily document processing volume</p>
          </div>

          <div className="flex items-end justify-between gap-2 h-48">
            {processingChartData.map((item) => {
              const total = item.processed + item.failed;
              const processedPct = (item.processed / maxProcessed) * 100;
              const failedPct = (item.failed / maxProcessed) * 100;

              return (
                <div key={item.day} className="flex flex-col items-center gap-1 flex-1 h-full">
                  {/* Value label */}
                  <span className="text-xs text-slate-400 mb-1">{total}</span>
                  {/* Bar container */}
                  <div className="relative flex flex-col justify-end w-full flex-1 gap-0.5">
                    {/* Failed portion */}
                    {item.failed > 0 && (
                      <div
                        className="w-full rounded-t bg-red-500/70"
                        style={{ height: `${failedPct}%` }}
                        title={`Failed: ${item.failed}`}
                      />
                    )}
                    {/* Processed portion */}
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${processedPct}%`,
                        background: 'linear-gradient(to top, #3b82f6, #8b5cf6)',
                      }}
                      title={`Processed: ${item.processed}`}
                    />
                  </div>
                  {/* Day label */}
                  <span className="text-xs text-slate-500 mt-1">{item.day}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }} />
              <span className="text-xs text-slate-400">Processed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500/70" />
              <span className="text-xs text-slate-400">Failed</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={recentActivity} />
        </div>
      </div>

      {/* Recent Documents */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
          <p className="text-sm text-slate-400 mt-1">Last 5 uploaded documents</p>
        </div>
        <DocumentTable
          documents={documents.slice(0, 5)}
          onSelect={onSelectDoc}
        />
      </div>
    </div>
  );
}
