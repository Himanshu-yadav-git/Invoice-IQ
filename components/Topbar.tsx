'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Menu,
  Search,
  X,
  FileText,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  User,
  Shield,
  LogOut,
  Settings,
  Keyboard,
  Sun,
  Moon,
} from 'lucide-react';
import type { Document } from '@/lib/types';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMobileMenuToggle: () => void;
  actions?: React.ReactNode;
  documents?: Document[];
  onNavigate?: (page: string) => void;
  onSelectDoc?: (doc: Document) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: 'success' | 'warning' | 'info';
}

export default function Topbar({
  title,
  subtitle,
  onMobileMenuToggle,
  actions,
  documents = [],
  onNavigate,
  onSelectDoc,
  theme = 'light',
  onToggleTheme,
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Invoice Extracted',
      desc: 'Acme Corp INV-2024-0891 extracted with 97% confidence',
      time: '5m ago',
      read: false,
      type: 'success',
    },
    {
      id: 'notif-2',
      title: 'Validation Review Required',
      desc: 'Globex Services GS-78432 missing due date',
      time: '18m ago',
      read: false,
      type: 'warning',
    },
    {
      id: 'notif-3',
      title: 'Potential Duplicate Flagged',
      desc: 'Acme Corp duplicate check matches invoice doc-001',
      time: '1h ago',
      read: false,
      type: 'warning',
    },
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (!isInput) {
        if (e.key === '?') {
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
        }
        if (['1', '2', '3', '4', '5', '6'].includes(e.key) && onNavigate) {
          const map: Record<string, string> = {
            '1': 'dashboard',
            '2': 'upload',
            '3': 'documents',
            '4': 'review',
            '5': 'analytics',
            '6': 'settings',
          };
          onNavigate(map[e.key]);
        }
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowShortcutsModal(false);
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  useEffect(() => {
    if (showSearchModal) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearchModal]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredDocs = searchQuery.trim()
    ? documents.filter(
        (d) =>
          d.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents.slice(0, 4);

  return (
    <header className="h-16 bg-white/90 dark:bg-[#080d2a] border-b border-slate-200 dark:border-white/5 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-20 backdrop-blur-md">
      {/* Hamburger (mobile) */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200"
        aria-label="Toggle navigation"
      >
        <Menu size={20} />
      </button>

      {/* Title area */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-white/40 leading-tight truncate">{subtitle}</p>
        )}
      </div>

      {/* Custom actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Right-side controls */}
      <div className="flex items-center gap-2 flex-shrink-0 relative">
        {/* Search */}
        <button
          type="button"
          onClick={() => setShowSearchModal(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-white/50 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 border border-slate-200/80 dark:border-transparent dark:hover:border-white/10"
          aria-label="Quick Search"
          title="Quick Search (Ctrl+K)"
        >
          <Search size={16} />
          <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-white/40 font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
            Ctrl K
          </span>
        </button>

        {/* Shortcuts Guide */}
        <button
          type="button"
          onClick={() => setShowShortcutsModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 dark:text-white/50 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 border border-slate-200/80 dark:border-transparent dark:hover:border-white/10"
          aria-label="Keyboard Shortcuts"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard size={16} />
          <span className="text-[11px] text-slate-500 dark:text-white/40 font-mono bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
            ?
          </span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-all duration-200"
          title={theme === 'dark' ? 'Switch to Light White Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-amber-400" />
          ) : (
            <Moon size={16} className="text-slate-600" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((v) => !v);
              setShowProfileMenu(false);
            }}
            className="relative flex items-center justify-center w-8 h-8 rounded-xl text-slate-600 hover:text-slate-900 dark:text-white/50 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/80 dark:border-transparent transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 sm:w-96 glass-card bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-4 z-50 animate-fade-in space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border transition flex items-start gap-3 ${
                      n.read
                        ? 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 text-slate-400'
                        : 'bg-blue-50/40 dark:bg-white/5 border-blue-100 dark:border-blue-500/20 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {n.type === 'success' ? (
                        <CheckCircle size={15} className="text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle size={15} className="text-amber-500 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate?.('review');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition flex items-center justify-center gap-1.5 w-full py-1"
                >
                  Go to Review Queue <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar & Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((v) => !v);
              setShowNotifications(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-900 dark:bg-gradient-to-br dark:from-blue-400 dark:to-purple-500 flex items-center justify-center text-white text-xs font-semibold shadow-xs hover:scale-105 transition-all duration-200 ml-1"
            aria-label="User profile"
          >
            JS
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-11 w-64 glass-card bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-4 z-50 animate-fade-in space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-gradient-to-br dark:from-blue-400 dark:to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  JS
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">John Smith</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">john@company.com</p>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-medium mt-1">
                    Pro Plan Active
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate?.('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition"
                >
                  <Settings size={14} />
                  Workspace Settings
                </button>
                <div className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-400">
                  <Shield size={14} />
                  Role: Administrator
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition text-xs font-medium"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Quick Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/10 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by vendor, invoice #, or file name..."
                className="bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-80 overflow-y-auto p-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                {searchQuery.trim() ? `Search Results (${filteredDocs.length})` : 'Recent Invoices'}
              </p>
              {filteredDocs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No documents found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setShowSearchModal(false);
                      setSearchQuery('');
                      onSelectDoc?.(doc);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                          {doc.vendor}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {doc.invoiceNumber} · {doc.fileName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(doc.amount, doc.currency)}
                      </p>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500">
              <span>Press ESC to close</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchModal(false);
                    onNavigate?.('documents');
                  }}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  View in All Documents &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white dark:bg-[#080d2a]/95 border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Keyboard size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Navigate DocuSmart AI at high velocity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Universal Hotkeys</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300">Quick Search</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 text-slate-800 dark:text-white font-mono text-[10px] border border-slate-200 dark:border-transparent">Ctrl+K</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300">Shortcuts Guide</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 text-slate-800 dark:text-white font-mono text-[10px] border border-slate-200 dark:border-transparent">?</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300">Jump to Tab</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 text-slate-800 dark:text-white font-mono text-[10px] border border-slate-200 dark:border-transparent">1 - 6</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300">Close / Dismiss</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 text-slate-800 dark:text-white font-mono text-[10px] border border-slate-200 dark:border-transparent">Esc</kbd>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Review &amp; Validation</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300">Approve Selected</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] border border-emerald-200 dark:border-transparent">A</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300">Next / Prev Doc</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 text-slate-800 dark:text-white font-mono text-[10px] border border-slate-200 dark:border-transparent">↑ / ↓</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="btn-secondary text-xs w-full py-2"
              >
                Close Shortcuts Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
