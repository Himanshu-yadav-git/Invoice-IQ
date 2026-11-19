'use client';

import { useState, useMemo, useEffect } from 'react';
import { ClipboardCheck, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Document } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import ValidationPanel from '@/components/ValidationPanel';
import { cn, formatRelativeTime } from '@/lib/utils';

interface ReviewPageProps {
  documents: Document[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onUpdateDocument?: (doc: Document) => void;
  initialDocId?: string | null;
}

export function ReviewPage({
  documents,
  onApprove,
  onReject,
  onUpdateDocument,
  initialDocId,
}: ReviewPageProps) {
  const reviewDocs = useMemo(
    () => documents.filter(d => d.status === 'review' || d.status === 'pending'),
    [documents]
  );

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    initialDocId ?? reviewDocs[0]?.id ?? null
  );
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);

  useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    }
  }, [initialDocId]);

  const selectedDoc = useMemo(
    () => reviewDocs.find(d => d.id === selectedDocId) ?? null,
    [reviewDocs, selectedDocId]
  );

  const handleApprove = (id: string) => {
    onApprove(id);
    // Move to next doc if available
    const nextDoc = reviewDocs.find(d => d.id !== id);
    setSelectedDocId(nextDoc?.id ?? null);
  };

  const handleReject = (id: string, reason: string) => {
    onReject(id, reason);
    const nextDoc = reviewDocs.find(d => d.id !== id);
    setSelectedDocId(nextDoc?.id ?? null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is actively typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIndex = reviewDocs.findIndex((d) => d.id === selectedDocId);
        if (currentIndex < reviewDocs.length - 1) {
          setSelectedDocId(reviewDocs[currentIndex + 1].id);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = reviewDocs.findIndex((d) => d.id === selectedDocId);
        if (currentIndex > 0) {
          setSelectedDocId(reviewDocs[currentIndex - 1].id);
        }
      } else if (e.key.toLowerCase() === 'a' && selectedDocId) {
        e.preventDefault();
        handleApprove(selectedDocId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewDocs, selectedDocId]);

  return (
    <div className="animate-fade-in space-y-3">
      {/* Top Review Control Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsQueueCollapsed((v) => !v)}
          className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 font-medium"
          title={isQueueCollapsed ? 'Show Review Queue' : 'Expand Validation Panel Full Screen'}
        >
          {isQueueCollapsed ? (
            <>
              <PanelLeft size={13} className="text-blue-400" />
              <span>Show Queue ({reviewDocs.length})</span>
            </>
          ) : (
            <>
              <PanelLeftClose size={13} className="text-blue-400" />
              <span className="hidden sm:inline">Focus / Full Screen</span>
            </>
          )}
        </button>
      </div>

      <div className={cn('grid gap-6 h-full transition-all', isQueueCollapsed ? 'grid-cols-1' : 'lg:grid-cols-3')}>
        {/* Document List */}
        {!isQueueCollapsed && (
        <div className="lg:col-span-1 space-y-3">
          <div className="glass-card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  Awaiting Review
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {reviewDocs.length} document{reviewDocs.length !== 1 ? 's' : ''} need attention
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                {reviewDocs.length} Pending
              </span>
            </div>

            {/* Keyboard shortcut legend */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Shortcuts</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                  [A] Approve
                </span>
                <span className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                  [↑/↓] Navigate
                </span>
              </div>
            </div>
          </div>

          {reviewDocs.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <ClipboardCheck className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-800 dark:text-slate-300 font-medium">All caught up!</p>
              <p className="text-slate-500 text-sm mt-1">No documents awaiting review.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviewDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={cn(
                    'w-full text-left glass-card p-4 rounded-xl border transition-all',
                    selectedDocId === doc.id
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-500/10 shadow-xs ring-1 ring-blue-500/30'
                      : 'border-slate-200/80 hover:border-slate-300 dark:border-white/5 dark:hover:border-white/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white break-all leading-tight">{doc.fileName}</p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">{doc.vendor}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Confidence: <span className={cn(
                      'font-semibold',
                      doc.confidence >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                      doc.confidence >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                    )}>{doc.confidence}%</span></span>
                    <span>{formatRelativeTime(doc.uploadedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Validation Panel */}
        <div className={isQueueCollapsed ? 'col-span-1' : 'lg:col-span-2'}>
          {selectedDoc ? (
            <ValidationPanel
              document={selectedDoc}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdateDocument={onUpdateDocument}
            />
          ) : (
            <div className="glass-card h-full flex flex-col items-center justify-center gap-4 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <ClipboardCheck className="w-8 h-8 text-slate-500" />
              </div>
              <div>
                <p className="text-white font-medium">No document selected</p>
                <p className="text-slate-500 text-sm mt-1">
                  Pick a document from the list to review and validate it.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
