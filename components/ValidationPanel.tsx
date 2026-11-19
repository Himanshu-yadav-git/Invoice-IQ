'use client';

import { useState, useEffect } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Document, LineItem } from '@/lib/types';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileText,
  X,
  Edit3,
  Layers,
  Columns,
  Sparkles,
  Plus,
  Trash2,
  Calculator,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface ValidationPanelProps {
  document: Document;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onFieldChange?: (field: string, value: string) => void;
  onUpdateDocument?: (updatedDoc: Document) => void;
}

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'number';
}

const fields: FieldDef[] = [
  { key: 'vendorName',      label: 'Vendor Name' },
  { key: 'vendorAddress',   label: 'Vendor Address' },
  { key: 'invoiceNumber',   label: 'Invoice Number' },
  { key: 'invoiceDate',     label: 'Invoice Date',  type: 'date' },
  { key: 'dueDate',         label: 'Due Date',       type: 'date' },
  { key: 'subtotal',        label: 'Subtotal',       type: 'number' },
  { key: 'tax',             label: 'Tax',            type: 'number' },
  { key: 'total',           label: 'Total',          type: 'number' },
  { key: 'currency',        label: 'Currency' },
  { key: 'paymentTerms',    label: 'Payment Terms' },
  { key: 'poNumber',        label: 'PO Number' },
];

function confidenceColor(score: number) {
  const norm = score <= 1 ? score * 100 : score;
  if (norm >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (norm >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

export default function ValidationPanel({
  document,
  onApprove,
  onReject,
  onFieldChange,
  onUpdateDocument,
}: ValidationPanelProps) {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [viewMode, setViewMode] = useState<'fields' | 'visual' | 'split'>('fields');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [savedNotification, setSavedNotification] = useState(false);

  const [formValues, setFormValues] = useState<Record<string, string>>(() => ({
    vendorName:    document.extractedFields?.vendorName    ?? document.vendor           ?? '',
    vendorAddress: document.extractedFields?.vendorAddress ?? '',
    invoiceNumber: document.extractedFields?.invoiceNumber ?? document.invoiceNumber     ?? '',
    invoiceDate:   document.extractedFields?.invoiceDate   ?? '',
    dueDate:       document.extractedFields?.dueDate       ?? '',
    subtotal:      String(document.extractedFields?.subtotal      ?? ''),
    tax:           String(document.extractedFields?.tax           ?? ''),
    total:         String(document.extractedFields?.total         ?? document.amount ?? ''),
    currency:      document.extractedFields?.currency      ?? document.currency          ?? 'USD',
    paymentTerms:  document.extractedFields?.paymentTerms  ?? '',
    poNumber:      document.extractedFields?.poNumber      ?? '',
  }));

  const [lineItems, setLineItems] = useState<LineItem[]>(() =>
    document.extractedFields?.lineItems ? [...document.extractedFields.lineItems] : []
  );

  useEffect(() => {
    setFormValues({
      vendorName:    document.extractedFields?.vendorName    ?? document.vendor           ?? '',
      vendorAddress: document.extractedFields?.vendorAddress ?? '',
      invoiceNumber: document.extractedFields?.invoiceNumber ?? document.invoiceNumber     ?? '',
      invoiceDate:   document.extractedFields?.invoiceDate   ?? '',
      dueDate:       document.extractedFields?.dueDate       ?? '',
      subtotal:      String(document.extractedFields?.subtotal      ?? ''),
      tax:           String(document.extractedFields?.tax           ?? ''),
      total:         String(document.extractedFields?.total         ?? document.amount ?? ''),
      currency:      document.extractedFields?.currency      ?? document.currency          ?? 'USD',
      paymentTerms:  document.extractedFields?.paymentTerms  ?? '',
      poNumber:      document.extractedFields?.poNumber      ?? '',
    });
    setLineItems(document.extractedFields?.lineItems ? [...document.extractedFields.lineItems] : []);
    setShowRejectBox(false);
    setRejectReason('');
    setSavedNotification(false);
  }, [document.id]);

  const handleInputChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    onFieldChange?.(key, val);
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'description') {
        item.description = String(value);
      } else if (field === 'quantity') {
        item.quantity = Math.max(0, parseInt(String(value), 10) || 0);
        item.total = Math.round(item.quantity * item.unitPrice * 100) / 100;
      } else if (field === 'unitPrice') {
        item.unitPrice = Math.max(0, parseFloat(String(value)) || 0);
        item.total = Math.round(item.quantity * item.unitPrice * 100) / 100;
      }
      next[index] = item;
      return next;
    });
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      description: 'New Item',
      quantity: 1,
      unitPrice: 100.0,
      total: 100.0,
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRecalculateTotals = () => {
    const newSubtotal = Math.round(lineItems.reduce((acc, it) => acc + (it.total || 0), 0) * 100) / 100;
    const currentTax = parseFloat(formValues.tax) || 0;
    const newTotal = Math.round((newSubtotal + currentTax) * 100) / 100;

    setFormValues((prev) => ({
      ...prev,
      subtotal: String(newSubtotal),
      total: String(newTotal),
    }));
    onFieldChange?.('subtotal', String(newSubtotal));
    onFieldChange?.('total', String(newTotal));
  };

  const constructUpdatedDocument = (): Document => {
    const subtotalNum = formValues.subtotal ? parseFloat(formValues.subtotal) : undefined;
    const taxNum = formValues.tax ? parseFloat(formValues.tax) : undefined;
    const totalNum = parseFloat(formValues.total) || document.amount;

    return {
      ...document,
      vendor: formValues.vendorName || document.vendor,
      invoiceNumber: formValues.invoiceNumber || document.invoiceNumber,
      date: formValues.invoiceDate || document.date,
      amount: totalNum,
      currency: formValues.currency || document.currency,
      extractedFields: {
        ...document.extractedFields,
        vendorName: formValues.vendorName,
        vendorAddress: formValues.vendorAddress,
        invoiceNumber: formValues.invoiceNumber,
        invoiceDate: formValues.invoiceDate,
        dueDate: formValues.dueDate,
        subtotal: subtotalNum,
        tax: taxNum,
        total: totalNum,
        currency: formValues.currency,
        paymentTerms: formValues.paymentTerms,
        poNumber: formValues.poNumber,
        lineItems: lineItems,
      },
    };
  };

  const handleSaveEdits = () => {
    const updated = constructUpdatedDocument();
    onUpdateDocument?.(updated);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleApproveClick = () => {
    const updated = constructUpdatedDocument();
    onUpdateDocument?.(updated);
    onApprove(document.id);
  };

  const subtotalVal = parseFloat(formValues.subtotal) || 0;
  const taxVal = parseFloat(formValues.tax) || 0;
  const enteredTotal = parseFloat(formValues.total) || 0;
  const expectedTotal = Math.round((subtotalVal + taxVal) * 100) / 100;
  const hasSubtotalAndTax = formValues.subtotal !== '' && formValues.tax !== '';
  const arithmeticMismatch = hasSubtotalAndTax && Math.abs(expectedTotal - enteredTotal) > 0.05;

  const confidencePct = document.confidence != null
    ? Math.round(document.confidence <= 1 ? document.confidence * 100 : document.confidence)
    : null;

  function handleConfirmReject() {
    if (!rejectReason.trim()) return;
    onReject(document.id, rejectReason.trim());
    setShowRejectBox(false);
    setRejectReason('');
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold text-slate-900 dark:text-white/90 truncate"
              title={document.fileName}
            >
              {document.fileName}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/40 truncate">
              {document.vendor
                ? `${document.vendor}${document.invoiceNumber ? ` · ${document.invoiceNumber}` : ''}`
                : 'No vendor extracted'}
            </p>
          </div>
        </div>

        {/* Confidence badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {confidencePct != null && (
            <span
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full border',
                confidenceColor(document.confidence!),
              )}
            >
              {confidencePct}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Review Mode Toggle Bar */}
      <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Inspection Mode</span>
          {savedNotification && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
              <CheckCircle2 size={12} /> Changes Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(viewMode === 'fields' || viewMode === 'split') && (
            <button
              type="button"
              onClick={handleSaveEdits}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-white/10 text-xs font-medium transition shadow-2xs"
              title="Save any edits made to fields or line items"
            >
              <Save size={12} /> Save Edits
            </button>
          )}
          <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('fields')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium',
                viewMode === 'fields'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Edit3 size={13} /> Form Fields
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium',
                viewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Columns size={13} /> Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium',
                viewMode === 'visual'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Layers size={13} /> Visual Document
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Area */}
      <div className="px-5 py-4 flex-1 overflow-y-auto space-y-4">
        {(() => {
          const renderFieldsContent = () => (
            <div className="space-y-4">
              <p className="section-title text-xs">Editable Extracted Fields</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map(({ key, label, type }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 dark:text-white/40">{label}</label>
                    <input
                      type={type ?? 'text'}
                      className={cn(
                        'input-field w-full transition-all',
                        focusedField === key && 'border-blue-500 ring-1 ring-blue-500/40'
                      )}
                      value={formValues[key] ?? ''}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              {/* Arithmetic Warning if Subtotal + Tax !== Total */}
              {arithmeticMismatch && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
                    <span className="truncate">
                      Total mismatch: Subtotal ({formatCurrency(subtotalVal, formValues.currency)}) + Tax ({formatCurrency(taxVal, formValues.currency)}) = {formatCurrency(expectedTotal, formValues.currency)} (Current Total: {formatCurrency(enteredTotal, formValues.currency)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('total', expectedTotal.toFixed(2))}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] flex-shrink-0 ml-3 transition"
                  >
                    Sync to {formatCurrency(expectedTotal, formValues.currency)}
                  </button>
                </div>
              )}

              {/* Extracted Line Items Section */}
              <div className="mt-5 space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="section-title text-xs">Extracted Line Items</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-400">
                      {lineItems.length} items
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {lineItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRecalculateTotals}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                        title="Recalculate Subtotal from Line Items"
                      >
                        <Calculator size={12} />
                        <span>Sum to Subtotal</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-medium flex items-center gap-1 transition"
                    >
                      <Plus size={12} />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {lineItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-center text-xs text-slate-500">
                    No line items extracted. Click &quot;Add Item&quot; to define line items manually.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="py-2 px-3 font-medium">Description</th>
                          <th className="py-2 px-2 font-medium w-16 text-center">Qty</th>
                          <th className="py-2 px-3 font-medium w-28 text-right">Unit Price</th>
                          <th className="py-2 px-3 font-medium w-28 text-right">Total</th>
                          <th className="py-2 px-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {lineItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-white/[0.02] transition">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.description}
                                onFocus={() => setFocusedField('lineItems')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                                placeholder="Item description"
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onFocus={() => setFocusedField('lineItems')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-800 dark:text-white text-center focus:outline-none focus:border-blue-500/50"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onFocus={() => setFocusedField('lineItems')}
                                onBlur={() => setFocusedField(null)}
                                onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-slate-800 dark:text-white text-right focus:outline-none focus:border-blue-500/50"
                              />
                            </td>
                            <td className="p-2 text-right font-medium text-slate-800 dark:text-white px-3">
                              {formatCurrency(item.total, formValues.currency)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-slate-400 hover:text-red-500 transition p-1"
                                title="Remove item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Validation warnings */}
              {document.validationWarnings && document.validationWarnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="section-title text-xs">Validation Warnings</p>
                  {document.validationWarnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <AlertTriangle
                        size={14}
                        className="text-amber-400 flex-shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-300">{w.field}</p>
                        <p className="text-xs text-amber-400/80">{w.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

          const renderVisualContent = () => (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <Sparkles size={13} />
                  AI Bounding Box Highlights
                </span>
                <span>Document Type: {document.fileType.toUpperCase()}</span>
              </div>

              {/* Document sheet representation */}
              <div className="bg-white dark:bg-[#0b1033] border border-slate-200 dark:border-white/10 rounded-xl p-5 space-y-4 font-sans text-xs text-slate-700 dark:text-slate-300 shadow-xs">
                {/* Top: Vendor & Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/10 pb-4">
                  <div
                    className={cn(
                      'relative p-2.5 rounded-lg border transition-all duration-300 max-w-[55%]',
                      focusedField === 'vendorName' || focusedField === 'vendorAddress'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/25 ring-2 ring-blue-500/50 shadow-md scale-[1.02]'
                        : 'border-blue-200 dark:border-blue-500/60 bg-blue-50/60 dark:bg-blue-500/10'
                    )}
                  >
                    <span className="absolute -top-2 left-2 px-1 text-[9px] font-bold bg-blue-600 text-white rounded">
                      VENDOR
                    </span>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{formValues.vendorName || document.vendor}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{formValues.vendorAddress || '123 Business Ave, San Francisco, CA'}</p>
                  </div>

                  <div className="text-right space-y-1.5">
                    <div
                      className={cn(
                        'relative p-2.5 rounded-lg border transition-all duration-300 inline-block text-left',
                        focusedField === 'invoiceNumber' || focusedField === 'invoiceDate' || focusedField === 'dueDate'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/25 ring-2 ring-purple-500/50 shadow-md scale-[1.02]'
                          : 'border-purple-200 dark:border-purple-500/60 bg-purple-50/60 dark:bg-purple-500/10'
                      )}
                    >
                      <span className="absolute -top-2 right-2 px-1 text-[9px] font-bold bg-purple-600 text-white rounded">
                        INVOICE META
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white"># {formValues.invoiceNumber || document.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Date: {formValues.invoiceDate || document.date}</p>
                      {formValues.dueDate && <p className="text-[11px] text-slate-500 dark:text-slate-400">Due: {formValues.dueDate}</p>}
                    </div>
                  </div>
                </div>

                {/* Line items if available */}
                {lineItems.length > 0 && (
                  <div
                    className={cn(
                      'space-y-2 p-2 rounded-xl transition-all duration-300',
                      focusedField === 'lineItems'
                        ? 'bg-blue-50 dark:bg-blue-500/15 border border-blue-300 dark:border-blue-500/40 ring-2 ring-blue-500/30'
                        : ''
                    )}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Extracted Line Items</p>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400">
                          <th className="pb-1.5">Description</th>
                          <th className="pb-1.5 text-center">Qty</th>
                          <th className="pb-1.5 text-right">Unit Price</th>
                          <th className="pb-1.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {lineItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <td className="py-1.5 text-slate-800 dark:text-white">{item.description}</td>
                            <td className="py-1.5 text-center text-slate-500 dark:text-slate-400">{item.quantity}</td>
                            <td className="py-1.5 text-right text-slate-500 dark:text-slate-400">{formatCurrency(item.unitPrice, formValues.currency)}</td>
                            <td className="py-1.5 text-right font-medium text-slate-800 dark:text-white">{formatCurrency(item.total, formValues.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals Summary with Highlight */}
                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/10">
                  <div
                    className={cn(
                      'relative p-3 rounded-lg border min-w-[220px] text-right space-y-1 transition-all duration-300',
                      focusedField === 'total' || focusedField === 'subtotal' || focusedField === 'tax'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/25 ring-2 ring-emerald-500/50 shadow-md scale-[1.02]'
                        : 'border-emerald-200 dark:border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-500/10'
                    )}
                  >
                    <span className="absolute -top-2 right-2 px-1 text-[9px] font-bold bg-emerald-600 text-white rounded">
                      TOTAL AMOUNT
                    </span>
                    {formValues.subtotal && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(Number(formValues.subtotal) || 0, formValues.currency)}</span>
                      </div>
                    )}
                    {formValues.tax && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                        <span>Tax:</span>
                        <span>{formatCurrency(Number(formValues.tax) || 0, formValues.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 dark:text-white font-bold text-sm pt-1 border-t border-emerald-300 dark:border-emerald-500/30">
                      <span>Total Due:</span>
                      <span>{formatCurrency(Number(formValues.total) || document.amount, formValues.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

          if (viewMode === 'fields') return renderFieldsContent();
          if (viewMode === 'visual') return renderVisualContent();
          return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 animate-fade-in">
              <div className="space-y-4 border-b xl:border-b-0 xl:border-r border-white/10 pb-4 xl:pb-0 xl:pr-5">
                {renderFieldsContent()}
              </div>
              <div className="space-y-4">
                {renderVisualContent()}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Reject reason box */}
      {showRejectBox && (
        <div className="px-5 pb-3 space-y-2">
          <label className="text-xs font-medium text-slate-600 dark:text-white/50">Rejection reason</label>
          <textarea
            className="input-field w-full resize-none text-sm"
            rows={3}
            placeholder="Describe why this document is being rejected…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 py-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
        {!showRejectBox ? (
          <>
            <button
              onClick={handleApproveClick}
              className={cn('btn-success flex items-center gap-2 flex-1 justify-center')}
            >
              <Check size={15} />
              Approve
            </button>
            <button
              onClick={() => setShowRejectBox(true)}
              className="btn-danger flex items-center gap-2 flex-1 justify-center"
            >
              <X size={15} />
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim()}
              className="btn-danger flex items-center gap-2 flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X size={15} />
              Confirm Reject
            </button>
            <button
              onClick={() => {
                setShowRejectBox(false);
                setRejectReason('');
              }}
              className="btn-secondary flex items-center gap-2 flex-1 justify-center"
            >
              <ChevronDown size={15} />
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
