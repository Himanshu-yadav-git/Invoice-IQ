'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  Brain,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Upload,
  User,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'upload', label: 'Upload Documents', icon: <Upload size={18} /> },
  { id: 'documents', label: 'All Documents', icon: <FileText size={18} /> },
  { id: 'review', label: 'Review & Validation', icon: <ClipboardCheck size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  currentPage,
  onNavigate,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          aria-hidden="true"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#080d2a] border-r border-slate-200 dark:border-white/5 z-40 flex flex-col shadow-xs dark:shadow-none',
          'transition-transform duration-300 ease-in-out',
          'md:static md:flex-shrink-0 md:h-screen md:z-auto md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-white/5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-gradient-to-br dark:from-blue-500 dark:to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Brain size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-base leading-tight block text-slate-900 dark:text-white">
              DocuSmart <span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-white/40 leading-tight block truncate">
              Intelligent Doc Processing
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                  isActive ? 'nav-item-active' : 'nav-item',
                )}
              >
                {/* Active left indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}
                <span
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80',
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile + logout */}
        <div className="px-3 py-4 border-t border-slate-200 dark:border-white/5 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition">
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-gradient-to-br dark:from-blue-400 dark:to-purple-500 flex items-center justify-center text-white flex-shrink-0 text-xs font-semibold">
              JS
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white/90 truncate">John Smith</p>
              <p className="text-xs text-slate-500 dark:text-white/40 truncate">john@company.com</p>
            </div>
          </div>

          {/* Logout */}
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 dark:text-white/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group">
            <LogOut size={16} className="group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
