'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon2,
  ImageIcon,
  Lightbulb,
  CheckCircle2,
  Eye,
  X,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Document } from '@/lib/types';
import { formatFileSize } from '@/lib/utils';
import UploadZone from '@/components/UploadZone';
import UploadQueue from '@/components/UploadQueue';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

interface UploadPageProps {
  onDocumentsAdded: (docs: Document[]) => void;
}

export function UploadPage({ onDocumentsAdded }: UploadPageProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [previewFile, setPreviewFile] = useState<{ file: File; url: string } | null>(null);
  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewFile?.url) {
        URL.revokeObjectURL(previewFile.url);
      }
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, [previewFile]);

  const simulateUpload = useCallback((id: string, file: File) => {
    if (intervalsRef.current[id]) clearInterval(intervalsRef.current[id]);

    intervalsRef.current[id] = setInterval(() => {
      setUploadFiles(prev => {
        const target = prev.find(f => f.id === id);
        if (!target) return prev;

        const nextProgress = Math.min(target.progress + 25, 100);
        if (nextProgress >= 100) {
          clearInterval(intervalsRef.current[id]);
          delete intervalsRef.current[id];

          // Add to realistic app state once upload completes
          const finalizeExtraction = async () => {
            let extractedData: any = null;
            let confidence = Math.floor(86 + Math.random() * 12);
            let warnings: any[] = [];

            if (typeof window !== 'undefined') {
              const savedGeminiKey = localStorage.getItem('docusmart_gemini_key');
              if (savedGeminiKey && savedGeminiKey.trim().length > 10) {
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  const res = await fetch('/api/extract', {
                    method: 'POST',
                    headers: { 'x-gemini-api-key': savedGeminiKey.trim() },
                    body: fd,
                  });
                  if (res.ok) {
                    const aiResult = await res.json();
                    if (aiResult.success && aiResult.extractedFields) {
                      extractedData = aiResult.extractedFields;
                      confidence = aiResult.confidence || 95;
                      warnings = aiResult.validationWarnings || [];
                    }
                  }
                } catch {
                  // Fall back to simulated extraction
                }
              }
            }

            const cleanVendorName = extractedData?.vendorName || file.name
              .replace(/\.[^/.]+$/, '')
              .replace(/[_-]/g, ' ')
              .split(' ')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');

            const docAmount = extractedData?.total ?? (Math.round((250 + Math.random() * 4500) * 100) / 100);
            const isPdf = file.name.toLowerCase().endsWith('.pdf');
            const isPng = file.name.toLowerCase().endsWith('.png');

            const newDoc: Document = {
              id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              fileName: file.name,
              vendor: cleanVendorName || 'Uploaded Vendor',
              invoiceNumber: extractedData?.invoiceNumber || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              date: extractedData?.invoiceDate || new Date().toISOString().split('T')[0],
              amount: docAmount,
              currency: extractedData?.currency || 'USD',
              status: 'pending',
              uploadedAt: new Date().toISOString(),
              pages: isPdf ? 2 : 1,
              confidence,
              fileType: isPdf ? 'pdf' : isPng ? 'png' : 'jpg',
              fileSize: file.size,
              extractedFields: extractedData || {
                vendorName: cleanVendorName || 'Uploaded Vendor',
                invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                subtotal: Math.round(docAmount * 0.9 * 100) / 100,
                tax: Math.round(docAmount * 0.1 * 100) / 100,
                total: docAmount,
                currency: 'USD',
                paymentTerms: 'Net 30',
                lineItems: [
                  {
                    description: `${cleanVendorName || 'Product'} Services`,
                    quantity: 1,
                    unitPrice: Math.round(docAmount * 0.6 * 100) / 100,
                    total: Math.round(docAmount * 0.6 * 100) / 100,
                  },
                  {
                    description: 'Support & Processing Fee',
                    quantity: 1,
                    unitPrice: Math.round(docAmount * 0.3 * 100) / 100,
                    total: Math.round(docAmount * 0.3 * 100) / 100,
                  },
                ],
              },
              validationWarnings: warnings,
            };

            onDocumentsAdded([newDoc]);
          };

          finalizeExtraction();

          return prev.map(f =>
            f.id === id ? { ...f, progress: 100, status: 'success' as const } : f
          );
        }

        return prev.map(f =>
          f.id === id ? { ...f, progress: nextProgress } : f
        );
      });
    }, 400);
  }, [onDocumentsAdded]);

  const handleFilesAdded = useCallback((files: File[]) => {
    const newEntries: UploadFile[] = files.map(file => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadFiles(prev => [...newEntries, ...prev]);
    newEntries.forEach(entry => simulateUpload(entry.id, entry.file));
  }, [simulateUpload]);

  const handleRemove = useCallback((id: string) => {
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
    }
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handlePreview = useCallback((file: File) => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    const url = URL.createObjectURL(file);
    setPreviewFile({ file, url });
  }, [previewFile]);

  const handleClosePreview = useCallback(() => {
    if (previewFile?.url) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  }, [previewFile]);

  const handleLoadSampleFile = useCallback((fileName: string, type: 'pdf' | 'png') => {
    const blob = new Blob(['%PDF-1.4 demo invoice content'], {
      type: type === 'pdf' ? 'application/pdf' : 'image/png',
    });
    const sampleFile = new File([blob], fileName, {
      type: type === 'pdf' ? 'application/pdf' : 'image/png',
    });
    handleFilesAdded([sampleFile]);
  }, [handleFilesAdded]);

  const supportedTypes = [
    {
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      label: 'PDF Documents',
      description: 'Invoice PDFs, contracts, receipts',
      ext: '.pdf',
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/20',
    },
    {
      icon: <ImageIcon2 className="w-6 h-6 text-violet-400" />,
      label: 'JPG Images',
      description: 'Scanned invoices, photos',
      ext: '.jpg / .jpeg',
      bg: 'from-violet-500/10 to-violet-600/5',
      border: 'border-violet-500/20',
    },
    {
      icon: <ImageIcon className="w-6 h-6 text-emerald-400" />,
      label: 'PNG Images',
      description: 'Screenshots, digital invoices',
      ext: '.png',
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/20',
    },
  ];

  const tips = [
    'Ensure the document is clearly readable and not blurry',
    'Make sure all text is within the document boundaries',
    'Higher resolution scans produce better extraction results',
    'Single-vendor invoices per file improves accuracy',
    'Remove any annotations or redactions covering key fields',
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      {/* Upload Zone */}
      <UploadZone onFilesSelected={handleFilesAdded} />

      {/* Quick Demo Invoices Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-300">
            Don&apos;t have a file ready? Click a sample invoice:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadSampleFile('Acme_Annual_SaaS_License.pdf', 'pdf')}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 transition flex items-center gap-1.5 font-medium"
          >
            <FileText size={12} className="text-blue-600 dark:text-blue-400" />
            <span>SaaS License (PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSampleFile('Delta_Logistics_Freight.pdf', 'pdf')}
            className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 transition flex items-center gap-1.5 font-medium"
          >
            <FileText size={12} className="text-purple-600 dark:text-purple-400" />
            <span>Freight Invoice (PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSampleFile('Office_Supplies_Receipt.png', 'png')}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 transition flex items-center gap-1.5 font-medium"
          >
            <ImageIcon2 size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span>Receipt Scan (PNG)</span>
          </button>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300">
              Upload Queue ({uploadFiles.length})
            </h3>
            <span className="text-xs text-slate-500">
              Click the eye icon to preview any document
            </span>
          </div>
          <UploadQueue
            files={uploadFiles}
            onPreview={handlePreview}
            onRemove={handleRemove}
          />
        </div>
      )}

      {/* Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                  {previewFile.file.type.includes('image') ? (
                    <ImageIcon size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate" title={previewFile.file.name}>
                    {previewFile.file.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatFileSize(previewFile.file.size)} · {previewFile.file.type || 'Document'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Preview Canvas */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100 dark:bg-black/40 min-h-[320px]">
              {previewFile.file.type.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewFile.url}
                  alt={previewFile.file.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-2xl border border-slate-200 dark:border-white/5"
                />
              ) : previewFile.file.type === 'application/pdf' || previewFile.file.name.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full flex flex-col items-center space-y-3">
                  <iframe
                    src={previewFile.url}
                    title={previewFile.file.name}
                    className="w-full h-[58vh] rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-inner"
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Sparkles size={12} className="text-purple-500 dark:text-purple-400" />
                    <span>Embedded PDF reader active · Ready for Gemini 2.0 multimodal analysis</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 max-w-md space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">{previewFile.file.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Document Preview
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
                    <Sparkles size={13} />
                    Ready for Gemini 2.0 Document Extraction
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Text, invoice tables, line items, and vendor data will be automatically extracted upon review.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle size={14} />
                <span>Upload staged successfully</span>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="btn-secondary text-xs px-4 py-1.5"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supported Types */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Supported Document Types</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {supportedTypes.map(type => (
            <div
              key={type.label}
              className={`rounded-xl border ${type.border} bg-gradient-to-br ${type.bg} p-4 flex flex-col gap-3`}
            >
              <div className="flex items-center gap-3">
                {type.icon}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{type.label}</p>
                  <p className="text-xs text-slate-500">{type.ext}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tips for Best Results</h2>
        </div>
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
