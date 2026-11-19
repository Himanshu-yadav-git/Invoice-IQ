'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export default function UploadZone({ onFilesSelected }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    onFilesSelected(Array.from(fileList));
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload zone. Click or drag files here."
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-14 cursor-pointer select-none transition-all duration-300 outline-none',
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
          : 'border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:border-blue-500 dark:hover:border-blue-400/50 hover:bg-blue-50/40 dark:hover:bg-blue-500/5 shadow-xs',
      )}
    >
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        onChange={onInputChange}
      />

      {/* Icon */}
      <div
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
          isDragging
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300 scale-110'
            : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        )}
      >
        <Upload size={30} />
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-slate-800 dark:text-white/80">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-slate-500 dark:text-white/40">
          or{' '}
          <span className="text-blue-600 dark:text-blue-400 underline underline-offset-2 cursor-pointer font-medium">
            click to browse
          </span>
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        {['PDF', 'JPG', 'PNG'].map((fmt) => (
          <span
            key={fmt}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-white/50 shadow-2xs"
          >
            {fmt}
          </span>
        ))}
      </div>

      <p className="text-xs text-slate-400 dark:text-white/25">Max 50 MB per file</p>
    </div>
  );
}
