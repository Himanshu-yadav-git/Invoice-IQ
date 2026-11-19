'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ToastContainer, { ToastMessage } from '@/components/Toast';
import NewDocumentModal from '@/components/NewDocumentModal';
import { sampleDocuments } from '@/lib/data';
import { Document } from '@/lib/types';
import { DashboardPage } from './views/DashboardPage';
import { UploadPage } from './views/UploadPage';
import { DocumentsPage } from './views/DocumentsPage';
import { ReviewPage } from './views/ReviewPage';
import { AnalyticsPage } from './views/AnalyticsPage';
import { SettingsPage } from './views/SettingsPage';

type PageKey = 'dashboard' | 'upload' | 'documents' | 'review' | 'analytics' | 'settings';

const PAGE_META: Record<PageKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back, John!' },
  upload: { title: 'Upload Documents', subtitle: 'Process new documents with AI' },
  documents: { title: 'All Documents', subtitle: 'Browse and manage your document library' },
  review: { title: 'Review & Validation', subtitle: 'Approve or reject flagged documents' },
  analytics: { title: 'Analytics', subtitle: 'Processing insights and trends' },
  settings: { title: 'Settings', subtitle: 'Configure your workspace' },
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [reviewTargetDocId, setReviewTargetDocId] = useState<string | null>(null);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isHydratedRef = useRef(false);

  // Hydrate theme from localStorage (default light white)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('docusmart_theme') as 'light' | 'dark' | null;
      const initial = saved || 'light';
      setTheme(initial);
      if (initial === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('docusmart_theme', nextTheme);
    } catch (e) {}
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('docusmart_theme', newTheme);
    } catch (e) {}
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('docusmart_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const vendorCatMap: Record<string, string> = {
            'Acme Corp': 'Software & SaaS',
            'Acme Annual SaaS License': 'Software & SaaS',
            'Globex Services': 'Legal & Professional',
            'TechSupplies Inc': 'Office Supplies',
            'CloudHost Pro': 'Software & SaaS',
            'BrightMedia Agency': 'Marketing & Ads',
            'LexGroup Partners': 'Legal & Professional',
            'OfficeHub': 'Office Supplies',
          };
          const enriched = parsed.map((doc: Document) => {
            if (doc.category) return doc;
            return {
              ...doc,
              category: vendorCatMap[doc.vendor] || 'Software & SaaS',
            };
          });
          setDocuments(enriched);
        }
      }
    } catch (e) {
      console.warn('Could not read documents from localStorage:', e);
    }
    isHydratedRef.current = true;
  }, []);

  // Persist to localStorage whenever documents update (after hydration)
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem('docusmart_documents', JSON.stringify(documents));
    } catch (e) {
      console.warn('Could not persist documents to localStorage:', e);
    }
  }, [documents]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateDocument = (updatedDoc: Document) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
    );
    if (selectedDoc?.id === updatedDoc.id) {
      setSelectedDoc(updatedDoc);
    }
  };

  const handleResetDocuments = () => {
    setDocuments(sampleDocuments);
    try {
      localStorage.setItem('docusmart_documents', JSON.stringify(sampleDocuments));
    } catch (e) {}
    addToast({
      title: 'Database Reset',
      message: 'Sample documents and verification status restored.',
      type: 'info',
    });
  };

  const handleImportDocuments = (importedDocs: Document[]) => {
    setDocuments(importedDocs);
    try {
      localStorage.setItem('docusmart_documents', JSON.stringify(importedDocs));
    } catch (e) {}
    addToast({
      title: 'Backup Restored',
      message: `Successfully loaded ${importedDocs.length} documents from backup file.`,
      type: 'success',
    });
  };

  const handleApprove = (id: string) => {
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, status: 'processed' as const } : doc))
    );
    addToast({
      title: 'Invoice Approved',
      message: `${target?.invoiceNumber || 'Document'} approved and verified for processing.`,
      type: 'success',
    });
  };

  const handleReject = (id: string, reason: string) => {
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, status: 'rejected' as const } : doc))
    );
    addToast({
      title: 'Invoice Rejected',
      message: `${target?.invoiceNumber || 'Document'} rejected: ${reason || 'Flagged during review'}.`,
      type: 'warning',
    });
  };

  const handleNavigateToReview = (docId: string) => {
    setReviewTargetDocId(docId);
    setCurrentPage('review');
  };

  const handleBatchApprove = (ids: string[]) => {
    setDocuments((prev) =>
      prev.map((doc) => (ids.includes(doc.id) ? { ...doc, status: 'processed' as const } : doc))
    );
    addToast({
      title: 'Batch Approved',
      message: `Successfully approved ${ids.length} documents.`,
      type: 'success',
    });
  };

  const handleDeleteDocument = (id: string) => {
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDoc?.id === id) {
      setSelectedDoc(null);
    }
    addToast({
      title: 'Document Deleted',
      message: `${target?.invoiceNumber || target?.fileName || 'Document'} was permanently removed.`,
      type: 'info',
    });
  };

  const handleManualAddDocument = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev]);
    addToast({
      title: 'Invoice Created',
      message: `Successfully created ${newDoc.invoiceNumber} for ${newDoc.vendor}.`,
      type: 'success',
    });
  };

  const handleDocumentsAdded = (docs: Document[]) => {
    setDocuments((prev) => [...docs, ...prev]);
    addToast({
      title: 'Files Uploaded',
      message: `${docs.length} document(s) uploaded and staged for processing.`,
      type: 'success',
    });
  };

  const { title, subtitle } = PAGE_META[currentPage];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#04071a] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page: string) => setCurrentPage(page as PageKey)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
          documents={documents}
          onNavigate={(page) => setCurrentPage(page as PageKey)}
          onSelectDoc={(doc) => {
            setSelectedDoc(doc);
            setCurrentPage('documents');
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/60 dark:bg-[#04071a]/50">
          {currentPage === 'dashboard' && (
            <DashboardPage
              documents={documents}
              onOpenNewDocModal={() => setIsNewDocModalOpen(true)}
              onNavigateToUpload={() => setCurrentPage('upload')}
              onSelectDoc={(doc) => {
                setSelectedDoc(doc);
                setCurrentPage('documents');
              }}
            />
          )}
          {currentPage === 'upload' && (
            <UploadPage onDocumentsAdded={handleDocumentsAdded} />
          )}
          {currentPage === 'documents' && (
            <DocumentsPage
              documents={documents}
              onSelectDoc={setSelectedDoc}
              onNavigateToReview={handleNavigateToReview}
              onBatchApprove={handleBatchApprove}
              onDeleteDoc={handleDeleteDocument}
              onOpenNewDocModal={() => setIsNewDocModalOpen(true)}
              onUpdateDoc={handleUpdateDocument}
            />
          )}
          {currentPage === 'review' && (
            <ReviewPage
              documents={documents}
              onApprove={handleApprove}
              onReject={handleReject}
              onUpdateDocument={handleUpdateDocument}
              initialDocId={reviewTargetDocId}
            />
          )}
          {currentPage === 'analytics' && (
            <AnalyticsPage documents={documents} />
          )}
          {currentPage === 'settings' && (
            <SettingsPage
              onResetDocuments={handleResetDocuments}
              onImportDocuments={handleImportDocuments}
              documentCount={documents.length}
              documents={documents}
              theme={theme}
              onSetTheme={handleSetTheme}
            />
          )}
        </main>
      </div>

      {/* Manual Document Entry Modal */}
      <NewDocumentModal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        onCreate={handleManualAddDocument}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
