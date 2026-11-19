'use client';

import { formatFileSize, cn } from '@/lib/utils';
import { Check, Eye, FileImage, FileText, Loader2, Trash2, X } from 'lucide-react';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

interface UploadQueueProps {
  files: UploadFile[];
  onPreview?: (file: File) => void;
  onRemove?: (id: string) => void;
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    return <FileImage size={16} className="text-purple-400 flex-shrink-0" />;
  }
  return <FileText size={16} className="text-blue-400 flex-shrink-0" />;
}

function StatusIcon({ status }: { status: UploadFile['status'] }) {
  if (status === 'uploading') {
    return <Loader2 size={16} className="text-blue-400 animate-spin flex-shrink-0" />;
  }
  if (status === 'success') {
    return (
      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <Check size={11} className="text-emerald-400" />
      </span>
    );
  }
  return (
    <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
      <X size={11} className="text-red-400" />
    </span>
  );
}

export default function UploadQueue({ files, onPreview, onRemove }: UploadQueueProps) {
  if (!files.length) return null;

  return (
    <ul className="space-y-3">
      {files.map((uf) => {
        const pct = Math.min(100, Math.max(0, Math.round(uf.progress)));
        const isError = uf.status === 'error';
        const isSuccess = uf.status === 'success';

        return (
          <li
            key={uf.id}
            className="glass-card rounded-xl px-4 py-3 flex items-center gap-3"
          >
            {/* File type icon */}
            <FileIcon name={uf.file.name} />

            {/* Name + progress */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-sm font-medium text-slate-800 dark:text-white/80 truncate"
                  title={uf.file.name}
                >
                  {uf.file.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-white/35 flex-shrink-0">
                  {formatFileSize(uf.file.size)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isError
                      ? 'bg-red-500'
                      : isSuccess
                      ? 'bg-emerald-500'
                      : 'bg-blue-600',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Status text */}
              <p
                className={cn(
                  'text-xs font-medium',
                  isError
                    ? 'text-red-500 dark:text-red-400'
                    : isSuccess
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-white/40',
                )}
              >
                {isError
                  ? 'Upload failed'
                  : isSuccess
                  ? 'Upload complete · Ready for processing'
                  : `Uploading… ${pct}%`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onPreview && (
                <button
                  type="button"
                  onClick={() => onPreview(uf.file)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Preview document"
                >
                  <Eye size={15} />
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(uf.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Remove from queue"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <StatusIcon status={uf.status} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
