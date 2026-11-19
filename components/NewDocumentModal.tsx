'use client';

import { useState } from 'react';
import { X, FileText, Plus, Check } from 'lucide-react';
import type { Document, DocumentStatus } from '@/lib/types';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (doc: Document) => void;
}

export default function NewDocumentModal({
  isOpen,
  onClose,
  onCreate,
}: NewDocumentModalProps) {
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [status, setStatus] = useState<DocumentStatus>('pending');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor.trim()) {
      setError('Please provide a vendor name.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid invoice total amount.');
      return;
    }

    const generatedInv = invoiceNumber.trim() || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDoc: Document = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fileName: `${vendor.toLowerCase().replace(/[^a-z0-9]/g, '_')}_manual_${Date.now().toString().slice(-4)}.pdf`,
      vendor: vendor.trim(),
      invoiceNumber: generatedInv,
      date,
      amount: parsedAmount,
      currency,
      status,
      uploadedAt: new Date().toISOString(),
      pages: 1,
      confidence: 95,
      fileType: 'pdf',
      fileSize: 45056,
      extractedFields: {
        vendorName: vendor.trim(),
        invoiceNumber: generatedInv,
        invoiceDate: date,
        dueDate,
        subtotal: Math.round(parsedAmount * 0.9 * 100) / 100,
        tax: Math.round(parsedAmount * 0.1 * 100) / 100,
        total: parsedAmount,
        currency,
        paymentTerms,
      },
      validationWarnings: [],
    };

    onCreate(newDoc);
    onClose();
    // Reset form
    setVendor('');
    setInvoiceNumber('');
    setAmount('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-card bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-slide-up flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Manual Invoice Entry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quickly add an invoice without uploading a scan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Vendor Name *
              </label>
              <input
                type="text"
                required
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Acme Supplies LLC"
                className="input-field w-full"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2024-XXXX"
                className="input-field w-full font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Amount *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field w-full font-semibold"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  <option value="USD" className="bg-white dark:bg-[#0d1230]">USD ($)</option>
                  <option value="EUR" className="bg-white dark:bg-[#0d1230]">EUR (€)</option>
                  <option value="GBP" className="bg-white dark:bg-[#0d1230]">GBP (£)</option>
                  <option value="AUD" className="bg-white dark:bg-[#0d1230]">AUD ($)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Invoice Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field w-full text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field w-full text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="Due on Receipt" className="bg-white dark:bg-[#0d1230]">Due on Receipt</option>
                <option value="Net 15" className="bg-white dark:bg-[#0d1230]">Net 15</option>
                <option value="Net 30" className="bg-white dark:bg-[#0d1230]">Net 30</option>
                <option value="Net 60" className="bg-white dark:bg-[#0d1230]">Net 60</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="pending" className="bg-white dark:bg-[#0d1230]">Pending</option>
                <option value="review" className="bg-white dark:bg-[#0d1230]">Needs Review</option>
                <option value="processed" className="bg-white dark:bg-[#0d1230]">Processed</option>
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-medium"
            >
              <Plus size={15} />
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
