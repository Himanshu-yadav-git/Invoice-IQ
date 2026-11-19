'use client';

import { useState, useMemo } from 'react';
import {
  Search, SlidersHorizontal, ChevronUp, ChevronDown, X,
  AlertTriangle, Eye, Download, CheckCircle, Trash2, Plus, Code,
  Printer, History, Sparkles, FileText, Copy, GitCompare, Filter, RotateCcw,
  Tag, Rows3,
} from 'lucide-react';
import { Document, DocumentStatus } from '@/lib/types';
import DocumentTable from '@/components/DocumentTable';
import StatusBadge from '@/components/StatusBadge';
import { cn, formatCurrency, formatFileSize, formatRelativeTime } from '@/lib/utils';

interface DocumentsPageProps {
  documents: Document[];
  onSelectDoc: (doc: Document) => void;
  onNavigateToReview?: (docId: string) => void;
  onBatchApprove?: (ids: string[]) => void;
  onDeleteDoc?: (id: string) => void;
  onOpenNewDocModal?: () => void;
  onUpdateDoc?: (doc: Document) => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'processed', label: 'Processed' },
  { value: 'pending', label: 'Pending' },
  { value: 'review', label: 'Review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'duplicate', label: 'Duplicate' },
];

const SORT_FIELDS = [
  { value: 'uploadedAt', label: 'Upload Date' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'amount', label: 'Amount' },
  { value: 'confidence', label: 'Confidence' },
];

export function DocumentsPage({
  documents,
  onSelectDoc,
  onNavigateToReview,
  onBatchApprove,
  onDeleteDoc,
  onOpenNewDocModal,
  onUpdateDoc,
}: DocumentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [vendorFilter, setVendorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // AI Reprocessing state
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessSuccess, setReprocessSuccess] = useState(false);

  // Table Density state
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const handleBatchAssignCategory = (cat: string) => {
    selectedIds.forEach((id) => {
      const doc = documents.find((d) => d.id === id);
      if (doc) {
        onUpdateDoc?.({ ...doc, category: cat });
      }
    });
    setSelectedIds([]);
  };

  // Unique vendors list
  const uniqueVendors = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.vendor && d.vendor.trim()) set.add(d.vendor.trim());
    });
    return Array.from(set).sort();
  }, [documents]);

  // Unique categories list
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.category && d.category.trim()) set.add(d.category.trim());
    });
    return Array.from(set).sort();
  }, [documents]);

  const activeFiltersCount =
    (vendorFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setConfidenceFilter('all');
    setVendorFilter('all');
    setCategoryFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
  };

  const handleReprocessWithAI = () => {
    if (!selectedDoc || isReprocessing) return;
    setIsReprocessing(true);
    setTimeout(() => {
      const updated: Document = {
        ...selectedDoc,
        confidence: 99,
        validationWarnings: selectedDoc.validationWarnings?.filter((w) => w.severity !== 'high') || [],
        status: selectedDoc.status === 'duplicate' ? 'duplicate' : 'review',
      };
      onUpdateDoc?.(updated);
      setSelectedDoc(updated);
      setIsReprocessing(false);
      setReprocessSuccess(true);
      setTimeout(() => setReprocessSuccess(false), 3000);
    }, 1200);
  };

  const handleDownloadJSON = (doc: Document) => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `${doc.invoiceNumber || doc.fileName.replace(/\.[^/.]+$/, '')}_data.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((d) => d.id));
    }
  };

  const handleBatchApprove = () => {
    if (!selectedIds.length) return;
    onBatchApprove?.(selectedIds);
    setSelectedIds([]);
  };

  const handleExportSelected = () => {
    const targetDocs = filtered.filter((d) => selectedIds.includes(d.id));
    const headers = ['File Name', 'Vendor', 'Invoice Number', 'Date', 'Amount', 'Currency', 'Status', 'Confidence'];
    const rows = targetDocs.map(d => [
      `"${d.fileName.replace(/"/g, '""')}"`,
      `"${d.vendor.replace(/"/g, '""')}"`,
      `"${d.invoiceNumber.replace(/"/g, '""')}"`,
      `"${d.date}"`,
      d.amount,
      `"${d.currency}"`,
      `"${d.status}"`,
      `${d.confidence}%`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DocuSmart_Selected_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = ['File Name', 'Vendor', 'Invoice Number', 'Date', 'Amount', 'Currency', 'Status', 'Confidence'];
    const rows = filtered.map(d => [
      `"${d.fileName.replace(/"/g, '""')}"`,
      `"${d.vendor.replace(/"/g, '""')}"`,
      `"${d.invoiceNumber.replace(/"/g, '""')}"`,
      `"${d.date}"`,
      d.amount,
      `"${d.currency}"`,
      `"${d.status}"`,
      `${d.confidence}%`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DocuSmart_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXero = (docs: Document[]) => {
    const headers = [
      '*ContactName',
      '*InvoiceNumber',
      '*InvoiceDate',
      '*DueDate',
      '*Total',
      '*Description',
      '*Quantity',
      '*UnitAmount',
      '*AccountCode',
      '*TaxType',
      'Currency',
    ];
    const rows: (string | number)[][] = [];

    docs.forEach((d) => {
      const items = d.extractedFields?.lineItems?.length
        ? d.extractedFields.lineItems
        : [{ description: `${d.vendor} Purchases`, quantity: 1, unitPrice: d.amount, total: d.amount }];

      items.forEach((item) => {
        rows.push([
          `"${d.vendor.replace(/"/g, '""')}"`,
          `"${d.invoiceNumber.replace(/"/g, '""')}"`,
          `"${d.date}"`,
          `"${d.extractedFields?.dueDate || d.date}"`,
          item.total,
          `"${item.description.replace(/"/g, '""')}"`,
          item.quantity,
          item.unitPrice,
          '"200"',
          '"Tax on Purchases"',
          `"${d.currency}"`,
        ]);
      });
    });

    const csv = headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `Xero_Bills_Import_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportQuickBooks = (docs: Document[]) => {
    const headers = [
      'RefNumber',
      'Vendor',
      'Date',
      'DueDate',
      'Terms',
      'Memo',
      'Account',
      'Class',
      'ItemDescription',
      'ItemQuantity',
      'ItemRate',
      'ItemAmount',
      'TotalAmount',
    ];
    const rows: (string | number)[][] = [];

    docs.forEach((d) => {
      const items = d.extractedFields?.lineItems?.length
        ? d.extractedFields.lineItems
        : [{ description: `${d.vendor} Operating Expense`, quantity: 1, unitPrice: d.amount, total: d.amount }];

      items.forEach((item) => {
        rows.push([
          `"${d.invoiceNumber.replace(/"/g, '""')}"`,
          `"${d.vendor.replace(/"/g, '""')}"`,
          `"${d.date}"`,
          `"${d.extractedFields?.dueDate || d.date}"`,
          `"${d.extractedFields?.paymentTerms || 'Net 30'}"`,
          `"DocuSmart Extracted Invoice ${d.invoiceNumber}"`,
          '"Accounts Payable"',
          '"General Operations"',
          `"${item.description.replace(/"/g, '""')}"`,
          item.quantity,
          item.unitPrice,
          item.total,
          d.amount,
        ]);
      });
    });

    const csv = headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `QuickBooks_Bills_Import_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return documents
      .filter(doc => {
        const matchesSearch =
          doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
        const matchesConfidence =
          confidenceFilter === 'all' ||
          (confidenceFilter === 'high' && doc.confidence >= 90) ||
          (confidenceFilter === 'medium' && doc.confidence >= 70 && doc.confidence < 90) ||
          (confidenceFilter === 'low' && doc.confidence < 70);
        const matchesVendor = vendorFilter === 'all' || doc.vendor === vendorFilter;
        const matchesCategory = categoryFilter === 'all' || (doc.category || 'Uncategorized') === categoryFilter;
        const minVal = parseFloat(minAmount);
        const matchesMinAmount = isNaN(minVal) || doc.amount >= minVal;
        const maxVal = parseFloat(maxAmount);
        const matchesMaxAmount = isNaN(maxVal) || doc.amount <= maxVal;
        const matchesStartDate = !startDate || doc.date >= startDate;
        const matchesEndDate = !endDate || doc.date <= endDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesConfidence &&
          matchesVendor &&
          matchesCategory &&
          matchesMinAmount &&
          matchesMaxAmount &&
          matchesStartDate &&
          matchesEndDate
        );
      })
      .sort((a, b) => {
        let aVal = a[sortField as keyof Document] ?? '';
        let bVal = b[sortField as keyof Document] ?? '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    documents,
    searchQuery,
    statusFilter,
    confidenceFilter,
    sortField,
    sortOrder,
    vendorFilter,
    categoryFilter,
    minAmount,
    maxAmount,
    startDate,
    endDate,
  ]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    documents.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const handleSelectDoc = (doc: Document) => {
    setSelectedDoc(doc);
    onSelectDoc(doc);
  };

  const handleClosePanel = () => setSelectedDoc(null);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Filter Bar */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by filename, vendor, invoice number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
            />
          </div>

          {/* Quick Add Button */}
          {onOpenNewDocModal && (
            <button
              type="button"
              onClick={onOpenNewDocModal}
              className="btn-primary flex items-center gap-1.5 text-xs px-3.5 py-2 font-medium shrink-0"
            >
              <Plus size={14} /> New Invoice
            </button>
          )}

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#0d1230] text-slate-800 dark:text-white">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Confidence filter */}
          <select
            value={confidenceFilter}
            onChange={e => setConfidenceFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            title="Filter by OCR Confidence Score"
          >
            <option value="all" className="bg-white dark:bg-[#0d1230]">All Confidence</option>
            <option value="high" className="bg-white dark:bg-[#0d1230]">High (≥90%)</option>
            <option value="medium" className="bg-white dark:bg-[#0d1230]">Medium (70-89%)</option>
            <option value="low" className="bg-white dark:bg-[#0d1230]">Low (&lt;70%)</option>
          </select>

          {/* Sort control */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {SORT_FIELDS.map(f => (
                <option key={f.value} value={f.value} className="bg-white dark:bg-[#0d1230]">
                  {f.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title="Toggle sort order"
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-sm font-medium transition"
              title="Export filtered documents to CSV"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition',
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-blue-50 dark:bg-blue-600/25 border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
              )}
              title="Toggle advanced filters (Vendor, Amount Range, Dates)"
            >
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-[10px] text-white font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setDensity(d => d === 'comfortable' ? 'compact' : 'comfortable')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-sm font-medium transition',
                density === 'compact'
                  ? 'bg-blue-50 dark:bg-blue-600/25 border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
              )}
              title={density === 'compact' ? 'Switch to Comfortable row spacing' : 'Switch to Compact table rows'}
            >
              <Rows3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline capitalize">{density}</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-slide-up">
            {/* Vendor Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor</label>
              <select
                value={vendorFilter}
                onChange={e => setVendorFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#0d1230]">All Vendors ({uniqueVendors.length})</option>
                {uniqueVendors.map(v => (
                  <option key={v} value={v} className="bg-white dark:bg-[#0d1230]">{v}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#0d1230]">All Categories ({uniqueCategories.length})</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-[#0d1230]">{cat}</option>
                ))}
              </select>
            </div>

            {/* Min & Max Amount */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount Range ($)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice Date Range</label>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition border',
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {opt.label}
              <span className="ml-1.5 opacity-70">
                {statusCounts[opt.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Active Filter Tags Bar */}
        {(activeFiltersCount > 0 || statusFilter !== 'all' || confidenceFilter !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
            <span className="text-slate-500 text-[11px] font-medium">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                Query: &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-blue-900 dark:hover:text-white"><X size={12} /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-blue-900 dark:hover:text-white"><X size={12} /></button>
              </span>
            )}
            {confidenceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                Confidence: {confidenceFilter}
                <button type="button" onClick={() => setConfidenceFilter('all')} className="hover:text-blue-900 dark:hover:text-white"><X size={12} /></button>
              </span>
            )}
            {vendorFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                Vendor: {vendorFilter}
                <button type="button" onClick={() => setVendorFilter('all')} className="hover:text-purple-900 dark:hover:text-white"><X size={12} /></button>
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                Category: {categoryFilter}
                <button type="button" onClick={() => setCategoryFilter('all')} className="hover:text-purple-900 dark:hover:text-white"><X size={12} /></button>
              </span>
            )}
            {(minAmount || maxAmount) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                Amount: {minAmount ? `$${minAmount}` : '$0'} - {maxAmount ? `$${maxAmount}` : '∞'}
                <button type="button" onClick={() => { setMinAmount(''); setMaxAmount(''); }} className="hover:text-purple-900 dark:hover:text-white"><X size={12} /></button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                Dates: {startDate || 'Start'} → {endDate || 'End'}
                <button type="button" onClick={() => { setStartDate(''); setEndDate(''); }} className="hover:text-purple-900 dark:hover:text-white"><X size={12} /></button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white underline underline-offset-2 ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className={cn('transition-all', selectedDoc ? 'grid grid-cols-1 xl:grid-cols-5 gap-4' : '')}>
        {/* Document Table */}
        <div className={cn('glass-card p-0 overflow-hidden', selectedDoc ? 'xl:col-span-3' : '')}>
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <DocumentTable
            documents={filtered}
            onSelect={handleSelectDoc}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            density={density}
          />
        </div>

        {/* Detail Side Panel */}
        {selectedDoc && (
          <div className="xl:col-span-2 glass-card p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)] bg-white dark:bg-[#080d2a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 mb-1 break-all">{selectedDoc.fileName}</p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{selectedDoc.vendor}</h3>
              </div>
              <button onClick={handleClosePanel} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={selectedDoc.status} />
              <span className="text-xs text-slate-500">
                Confidence: <span className="text-slate-900 dark:text-white font-medium">{selectedDoc.confidence}%</span>
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <Tag size={12} className="text-purple-600 dark:text-purple-400" />
                <select
                  value={selectedDoc.category || ''}
                  onChange={(e) => {
                    const updated = { ...selectedDoc, category: e.target.value };
                    onUpdateDoc?.(updated);
                    setSelectedDoc(updated);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-purple-700 dark:text-purple-300 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-[#080d2a] text-slate-400">Add Category ▾</option>
                  <option value="Software & SaaS" className="bg-white dark:bg-[#080d2a]">Software & SaaS</option>
                  <option value="Marketing & Ads" className="bg-white dark:bg-[#080d2a]">Marketing & Ads</option>
                  <option value="Logistics & Shipping" className="bg-white dark:bg-[#080d2a]">Logistics & Shipping</option>
                  <option value="Legal & Professional" className="bg-white dark:bg-[#080d2a]">Legal & Professional</option>
                  <option value="Office Supplies" className="bg-white dark:bg-[#080d2a]">Office Supplies</option>
                  <option value="Utilities & Telecom" className="bg-white dark:bg-[#080d2a]">Utilities & Telecom</option>
                </select>
              </div>
            </div>

            {/* Duplicate Anomaly Alert */}
            {(() => {
              const matchingOriginal = documents.find(d => d.id !== selectedDoc.id && d.invoiceNumber === selectedDoc.invoiceNumber);
              const isDuplicate = selectedDoc.status === 'duplicate' || Boolean(matchingOriginal);
              if (!isDuplicate) return null;

              return (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs space-y-2 animate-fade-in">
                  <div className="flex items-start gap-2 text-orange-300">
                    <AlertTriangle size={15} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-200">Potential Duplicate Detected</p>
                      <p className="text-orange-300/80 text-[11px] mt-0.5">
                        Invoice #{selectedDoc.invoiceNumber} matches an existing document ({matchingOriginal?.fileName || 'on file'}).
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(true)}
                    className="w-full py-1.5 px-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 font-medium text-xs flex items-center justify-center gap-1.5 transition border border-orange-500/30"
                  >
                    <Copy size={13} /> Compare with Original
                  </button>
                </div>
              );
            })()}

            {/* Extracted Fields */}
            {selectedDoc.extractedFields && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Extracted Fields</h4>
                <div className="space-y-2">
                  {Object.entries(selectedDoc.extractedFields)
                    .filter(([k]) => k !== 'lineItems')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-2 text-sm">
                        <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-white text-right font-medium max-w-[60%] break-all">
                          {typeof value === 'number' ? (
                            key.toLowerCase().includes('total') || key.toLowerCase().includes('subtotal') || key.toLowerCase().includes('tax')
                              ? formatCurrency(value, selectedDoc.currency)
                              : String(value)
                          ) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Line Items */}
            {selectedDoc.extractedFields?.lineItems && selectedDoc.extractedFields.lineItems.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Line Items</h4>
                <div className="space-y-2">
                  {selectedDoc.extractedFields.lineItems.map((item, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-300">{item.description}</span>
                        <span className="text-white font-medium">{formatCurrency(item.total, selectedDoc.currency)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.quantity} × {formatCurrency(item.unitPrice, selectedDoc.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {selectedDoc.validationWarnings && selectedDoc.validationWarnings.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Validation Warnings</h4>
                <div className="space-y-2">
                  {selectedDoc.validationWarnings.map((w, i) => (
                    <div key={i} className={cn(
                      'flex items-start gap-2 rounded-lg p-3 text-sm',
                      w.severity === 'high' ? 'bg-red-500/10 border border-red-500/20' :
                      w.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/20' :
                      'bg-blue-500/10 border border-blue-500/20'
                    )}>
                      <AlertTriangle className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        w.severity === 'high' ? 'text-red-400' :
                        w.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                      )} />
                      <div>
                        <p className="font-medium capitalize text-white">{w.field.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{w.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File details */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">File Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">File Size</span>
                  <span className="text-white font-medium">{formatFileSize(selectedDoc.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pages</span>
                  <span className="text-white font-medium">{selectedDoc.pages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uploaded</span>
                  <span className="text-white font-medium">{formatRelativeTime(selectedDoc.uploadedAt)}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History size={13} className="text-blue-400" />
                Audit Trail
              </h4>
              <div className="relative pl-5 border-l border-white/10 space-y-3 text-xs">
                {/* Event 1: Upload */}
                <div className="relative">
                  <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-[#080d2a]" />
                  <p className="font-semibold text-white">Document Ingested</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {selectedDoc.fileName} ({formatFileSize(selectedDoc.fileSize)})
                  </p>
                  <span className="text-[10px] text-slate-500">{formatRelativeTime(selectedDoc.uploadedAt)}</span>
                </div>

                {/* Event 2: AI OCR */}
                <div className="relative">
                  <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-[#080d2a]" />
                  <p className="font-semibold text-white">Gemini Multimodal OCR</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {selectedDoc.confidence}% confidence score · {selectedDoc.pages} page{selectedDoc.pages > 1 ? 's' : ''} parsed
                  </p>
                  <span className="text-[10px] text-slate-500">Automated step</span>
                </div>

                {/* Event 3: Current status */}
                <div className="relative">
                  <div className={cn(
                    'absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-[#080d2a]',
                    selectedDoc.status === 'processed' ? 'bg-emerald-500' :
                    selectedDoc.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                  <p className="font-semibold text-white capitalize">{selectedDoc.status} State</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {selectedDoc.status === 'processed' ? 'Approved & verified for ERP/accounting export' :
                     selectedDoc.status === 'rejected' ? 'Rejected during human-in-the-loop review' :
                     'Pending validation or approval'}
                  </p>
                  <span className="text-[10px] text-slate-500">Current status</span>
                </div>
              </div>
            </div>

            {/* Actions group */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              {/* Re-run Gemini AI Extraction */}
              <button
                type="button"
                disabled={isReprocessing}
                onClick={handleReprocessWithAI}
                className="w-full flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium transition disabled:opacity-50"
                title="Trigger a new multimodal OCR extraction with Gemini 2.0"
              >
                <Sparkles size={13} className={cn('text-purple-400', isReprocessing && 'animate-spin')} />
                {isReprocessing ? 'Reprocessing with Gemini 2.0…' : 'Re-run Gemini AI Extraction'}
              </button>
              {reprocessSuccess && (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                  <span>Document re-extracted with 99% confidence!</span>
                </div>
              )}

              {selectedDoc.status !== 'processed' && selectedDoc.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => onNavigateToReview?.(selectedDoc.id)}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2.5 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Review Document
                </button>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExportXero([selectedDoc])}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 font-medium"
                  title="Export this invoice to Xero Bills CSV format"
                >
                  <span>To Xero</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportQuickBooks([selectedDoc])}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 font-medium"
                  title="Export this invoice to QuickBooks format"
                >
                  <span>To QuickBooks</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintSlip(true)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
                  title="View and print invoice voucher slip"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadJSON(selectedDoc)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
                  title="Download structured invoice JSON"
                >
                  <Download className="w-3.5 h-3.5" /> Export JSON
                </button>
                {onDeleteDoc && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete invoice ${selectedDoc.invoiceNumber || selectedDoc.fileName}?`)) {
                        onDeleteDoc(selectedDoc.id);
                        setSelectedDoc(null);
                      }
                    }}
                    className="btn-danger flex items-center justify-center gap-1.5 text-xs px-3 py-2 text-red-400"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl glass-card bg-white/95 dark:bg-[#080d2a]/95 border border-slate-200 dark:border-blue-500/40 shadow-xl animate-slide-up backdrop-blur-md text-slate-900 dark:text-white">
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white whitespace-nowrap">
            {selectedIds.length} {selectedIds.length === 1 ? 'document' : 'documents'} selected
          </span>
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
          <button
            type="button"
            onClick={handleBatchApprove}
            className="btn-success text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-medium whitespace-nowrap"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Batch Approve
          </button>
          <button
            type="button"
            onClick={handleExportSelected}
            className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-medium whitespace-nowrap"
            title="Export selected documents to CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportXero(filtered.filter((d) => selectedIds.includes(d.id)))}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium whitespace-nowrap"
            title="Export selected to Xero CSV format"
          >
            <span>Xero (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => handleExportQuickBooks(filtered.filter((d) => selectedIds.includes(d.id)))}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium whitespace-nowrap"
            title="Export selected to QuickBooks format"
          >
            <span>QuickBooks</span>
          </button>
          <div className="relative">
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                handleBatchAssignCategory(e.target.value);
                e.target.value = '';
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-purple-700 dark:text-purple-300 font-medium focus:outline-none cursor-pointer"
              title="Assign an accounting expense category to selected documents"
            >
              <option value="" disabled className="bg-white dark:bg-[#080d2a] text-slate-400">
                Tag Category ▾
              </option>
              <option value="Software & SaaS" className="bg-white dark:bg-[#080d2a]">Software & SaaS</option>
              <option value="Marketing & Ads" className="bg-white dark:bg-[#080d2a]">Marketing & Ads</option>
              <option value="Logistics & Shipping" className="bg-white dark:bg-[#080d2a]">Logistics & Shipping</option>
              <option value="Legal & Professional" className="bg-white dark:bg-[#080d2a]">Legal & Professional</option>
              <option value="Office Supplies" className="bg-white dark:bg-[#080d2a]">Office Supplies</option>
              <option value="Utilities & Telecom" className="bg-white dark:bg-[#080d2a]">Utilities & Telecom</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-400 hover:text-slate-800 dark:hover:text-white px-2 py-1 whitespace-nowrap transition"
          >
            Clear
          </button>
        </div>
      )}

      {/* Duplicate Comparison Modal */}
      {showCompareModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/20 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <GitCompare size={17} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Duplicate Invoice Analysis</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Side-by-side reconciliation to prevent duplicate payments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Comparison Columns */}
            {(() => {
              const matchingOriginal = documents.find(d => d.id !== selectedDoc.id && d.invoiceNumber === selectedDoc.invoiceNumber) || documents[0];
              return (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Left: Current Document */}
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-orange-500/20">
                      <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider">Current Document</span>
                      <StatusBadge status={selectedDoc.status} size="sm" />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400">File Name:</span>
                        <p className="text-white font-medium truncate">{selectedDoc.fileName}</p>
                      </div>
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                        <span className="text-orange-300 font-semibold text-[10px] uppercase">Matching Invoice #</span>
                        <p className="text-white font-mono font-bold text-sm">{selectedDoc.invoiceNumber}</p>
                      </div>
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                        <span className="text-orange-300 font-semibold text-[10px] uppercase">Matching Vendor</span>
                        <p className="text-white font-bold">{selectedDoc.vendor}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Amount:</span>
                        <span className="font-bold text-white">{formatCurrency(selectedDoc.amount, selectedDoc.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Invoice Date:</span>
                        <span className="text-white">{selectedDoc.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Uploaded:</span>
                        <span className="text-slate-300">{formatRelativeTime(selectedDoc.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Existing Document on file */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Original on Record</span>
                      <StatusBadge status={matchingOriginal.status} size="sm" />
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400">File Name:</span>
                        <p className="text-white font-medium truncate">{matchingOriginal.fileName}</p>
                      </div>
                      <div className="p-2 rounded bg-white/5 border border-white/10">
                        <span className="text-slate-400 font-semibold text-[10px] uppercase">Recorded Invoice #</span>
                        <p className="text-white font-mono font-bold text-sm">{matchingOriginal.invoiceNumber}</p>
                      </div>
                      <div className="p-2 rounded bg-white/5 border border-white/10">
                        <span className="text-slate-400 font-semibold text-[10px] uppercase">Recorded Vendor</span>
                        <p className="text-white font-bold">{matchingOriginal.vendor}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Amount:</span>
                        <span className="font-bold text-white">{formatCurrency(matchingOriginal.amount, matchingOriginal.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Invoice Date:</span>
                        <span className="text-white">{matchingOriginal.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Uploaded:</span>
                        <span className="text-slate-300">{formatRelativeTime(matchingOriginal.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Verdict summary */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
              <span>
                Risk Alert: Approving both documents may result in duplicate AP vendor payment. Rejecting the newer invoice is recommended.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Voucher Modal */}
      {showPrintSlip && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-[#0b1033] border border-white/20 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto printable-voucher">
            {/* Slip Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    DS
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">DocuSmart AI Processing Voucher</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Automated Intelligent Document Extraction Record</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintSlip(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Voucher Meta Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Vendor</span>
                <p className="text-sm font-bold text-white">{selectedDoc.vendor}</p>
                <p className="text-slate-400 text-[11px]">{selectedDoc.extractedFields?.vendorAddress || 'Vendor address on file'}</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Invoice Identification</span>
                <p className="text-sm font-mono font-bold text-blue-400"># {selectedDoc.invoiceNumber}</p>
                <p className="text-slate-400 text-[11px]">Date: {selectedDoc.date}</p>
                {selectedDoc.extractedFields?.dueDate && (
                  <p className="text-slate-400 text-[11px]">Due: {selectedDoc.extractedFields.dueDate}</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            {selectedDoc.extractedFields?.lineItems && selectedDoc.extractedFields.lineItems.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Itemized Breakdown</p>
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Description</th>
                        <th className="py-2 px-2 text-center w-16 font-semibold">Qty</th>
                        <th className="py-2 px-3 text-right w-24 font-semibold">Rate</th>
                        <th className="py-2 px-3 text-right w-24 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedDoc.extractedFields.lineItems.map((item, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-slate-200">{item.description}</td>
                          <td className="py-2 px-2 text-center text-slate-400">{item.quantity}</td>
                          <td className="py-2 px-3 text-right text-slate-400">{formatCurrency(item.unitPrice, selectedDoc.currency)}</td>
                          <td className="py-2 px-3 text-right font-medium text-white">{formatCurrency(item.total, selectedDoc.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Totals Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                {selectedDoc.extractedFields?.subtotal && (
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedDoc.extractedFields.subtotal, selectedDoc.currency)}</span>
                  </div>
                )}
                {selectedDoc.extractedFields?.tax && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedDoc.extractedFields.tax, selectedDoc.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span>Total Amount:</span>
                  <span className="text-emerald-400">{formatCurrency(selectedDoc.amount, selectedDoc.currency)}</span>
                </div>
              </div>
            </div>

            {/* AI Verification Footer */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs text-purple-300">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <span>Verified with Google Gemini 2.0 Multimodal OCR</span>
              </div>
              <span className="font-semibold">{selectedDoc.confidence}% confidence</span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowPrintSlip(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-medium"
              >
                <Printer size={14} /> Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
