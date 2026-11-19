'use client';

import { useState } from 'react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Document } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import { Eye, FileImage, FileText, ChevronUp, ChevronDown } from 'lucide-react';

interface DocumentTableProps {
  documents: Document[];
  onSelect?: (doc: Document) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  density?: 'comfortable' | 'compact';
}

type SortField = 'fileName' | 'vendor' | 'invoiceNumber' | 'date' | 'amount' | 'status' | 'confidence';
type SortDir = 'asc' | 'desc';

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    return <FileImage size={16} className="text-purple-400 flex-shrink-0" />;
  }
  return <FileText size={16} className="text-blue-400 flex-shrink-0" />;
}

function ConfidenceText({ value }: { value: number }) {
  const pct = Math.round(value <= 1 ? value * 100 : value);
  const color =
    pct >= 90 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400';
  return <span className={cn('text-sm font-semibold', color)}>{pct}%</span>;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ChevronUp size={12} className="opacity-20" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-blue-400" />
    : <ChevronDown size={12} className="text-blue-400" />;
}

export default function DocumentTable({
  documents,
  onSelect,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  density = 'comfortable',
}: DocumentTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const hasSelection = selectedIds !== undefined && onToggleSelect !== undefined;
  const isAllSelected = hasSelection && documents.length > 0 && selectedIds.length === documents.length;

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sorted = [...documents].sort((a, b) => {
    let av: string | number = '';
    let bv: string | number = '';
    switch (sortField) {
      case 'fileName':    av = a.fileName;      bv = b.fileName;      break;
      case 'vendor':      av = a.vendor ?? '';  bv = b.vendor ?? '';  break;
      case 'invoiceNumber': av = a.invoiceNumber ?? ''; bv = b.invoiceNumber ?? ''; break;
      case 'date':        av = a.uploadedAt;    bv = b.uploadedAt;    break;
      case 'amount':      av = a.amount ?? 0;   bv = b.amount ?? 0;   break;
      case 'status':      av = a.status;        bv = b.status;        break;
      case 'confidence':  av = a.confidence ?? 0; bv = b.confidence ?? 0; break;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const headers: { label: string; field: SortField }[] = [
    { label: 'File Name',   field: 'fileName' },
    { label: 'Vendor',      field: 'vendor' },
    { label: 'Invoice #',   field: 'invoiceNumber' },
    { label: 'Date',        field: 'date' },
    { label: 'Amount',      field: 'amount' },
    { label: 'Status',      field: 'status' },
    { label: 'Confidence',  field: 'confidence' },
  ];

  if (!documents.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-white/30 gap-3">
        <FileText size={40} className="opacity-40" />
        <p className="text-sm">No documents found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
            {hasSelection && (
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all documents"
                  className="rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
            )}
            {headers.map(({ label, field }) => (
              <th
                key={field}
                onClick={() => handleSort(field)}
                className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider cursor-pointer select-none hover:text-slate-800 dark:hover:text-white/70 transition-colors"
              >
                <span className="flex items-center gap-1">
                  {label}
                  <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((doc) => {
            const isSelected = selectedIds?.includes(doc.id);
            const pyClass = density === 'compact' ? 'py-1.5' : 'py-3';
            return (
              <tr
                key={doc.id}
                className={cn(
                  'table-row border-b border-slate-100 dark:border-white/5 last:border-0 cursor-pointer transition-colors duration-150',
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-600/10 hover:bg-blue-100/60 dark:hover:bg-blue-600/15'
                    : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.03]'
                )}
                onClick={() => onSelect?.(doc)}
              >
                {hasSelection && (
                  <td className={cn('px-3 w-8', pyClass)} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(doc.id)}
                      aria-label={`Select ${doc.fileName}`}
                      className="rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>
                )}
                {/* File Name */}
                <td className={cn('px-4', pyClass)}>
                  <div className="flex items-center gap-2 max-w-[220px]">
                    <FileIcon name={doc.fileName} />
                    <div className="min-w-0">
                      <span className="text-slate-900 dark:text-white/85 font-medium truncate block leading-snug" title={doc.fileName}>
                        {doc.fileName}
                      </span>
                      {doc.category && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                          {doc.category}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                {/* Vendor */}
                <td className={cn('px-4 text-slate-600 dark:text-white/60 max-w-[140px]', pyClass)}>
                  <span className="truncate block" title={doc.vendor ?? '—'}>
                    {doc.vendor ?? <span className="text-slate-400 dark:text-white/25">—</span>}
                  </span>
                </td>
                {/* Invoice Number */}
                <td className={cn('px-4 font-mono text-xs text-slate-500 dark:text-white/50', pyClass)}>
                  {doc.invoiceNumber ?? <span className="text-slate-400 dark:text-white/25">—</span>}
                </td>
                {/* Date */}
                <td className={cn('px-4 text-slate-500 dark:text-white/50 text-xs whitespace-nowrap', pyClass)}>
                  {doc.date ? formatDate(doc.date) : <span className="text-slate-400 dark:text-white/25">—</span>}
                </td>
                {/* Amount */}
                <td className={cn('px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap', pyClass)}>
                  {doc.amount != null
                    ? formatCurrency(doc.amount, doc.currency)
                    : <span className="text-slate-400 dark:text-white/25">—</span>}
                </td>
                {/* Status */}
                <td className={cn('px-4', pyClass)}>
                  <StatusBadge status={doc.status} size="sm" />
                </td>
                {/* Confidence */}
                <td className={cn('px-4', pyClass)}>
                  {doc.confidence != null
                    ? <ConfidenceText value={doc.confidence} />
                    : <span className="text-slate-400 dark:text-white/25">—</span>}
                </td>
                {/* Actions */}
                <td className={cn('px-4', pyClass)} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelect?.(doc)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    title="View details"
                    aria-label={`View details for ${doc.fileName}`}
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
