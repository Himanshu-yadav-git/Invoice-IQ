'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Settings, Bell, Plug, Shield,
  Eye, EyeOff, RefreshCw, Trash2,
  CheckCircle, XCircle, Copy, Save,
  Sparkles, AlertTriangle, Zap, Play, Plus, Sliders, Check,
  Download, Upload, FileJson, Database, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Document } from '@/lib/types';

type Tab = 'general' | 'notifications' | 'integrations' | 'rules' | 'security';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { key: 'integrations', label: 'Integrations', icon: <Plug className="w-4 h-4" /> },
  { key: 'rules', label: 'Workflow Rules', icon: <Zap className="w-4 h-4" /> },
  { key: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className={cn(
          'w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-blue-600' : 'bg-white/10'
        )} />
        <div className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </div>
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field w-full"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-white dark:bg-[#0d1230] text-slate-900 dark:text-slate-100">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SaveButton({ onClick }: { onClick?: () => void }) {
  const [saved, setSaved] = useState(false);

  const handleClick = () => {
    onClick?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 mt-6 transition-all duration-200',
        saved ? 'btn-success text-emerald-300 border-emerald-500/40' : 'btn-primary'
      )}
    >
      {saved ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
      {saved ? 'Changes Saved!' : 'Save Changes'}
    </button>
  );
}

// ─── Tab: General ────────────────────────────────────────────────────────────
function GeneralTab({
  onResetDocuments,
  documentCount,
  documents,
  onImportDocuments,
  theme = 'light',
  onSetTheme,
}: {
  onResetDocuments?: () => void;
  documentCount?: number;
  documents?: Document[];
  onImportDocuments?: (docs: Document[]) => void;
  theme?: 'light' | 'dark';
  onSetTheme?: (t: 'light' | 'dark') => void;
}) {
  const [companyName, setCompanyName] = useState('Acme Corporation');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('America/New_York');
  const [language, setLanguage] = useState('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFeedback, setImportFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const handleExportFullBackup = () => {
    const backupData = {
      version: '1.0.0',
      appName: 'DocuSmart AI',
      exportedAt: new Date().toISOString(),
      documentCount: documents?.length ?? 0,
      documents: documents ?? [],
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `DocuSmart_System_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        let docsToImport: Document[] = [];

        if (Array.isArray(parsed)) {
          docsToImport = parsed;
        } else if (parsed && Array.isArray(parsed.documents)) {
          docsToImport = parsed.documents;
        } else {
          throw new Error('Invalid backup format. Expected a documents array or backup object.');
        }

        if (docsToImport.length === 0) {
          throw new Error('Backup contains no documents.');
        }

        onImportDocuments?.(docsToImport);
        setImportFeedback({
          status: 'success',
          message: `Successfully restored ${docsToImport.length} documents from ${file.name}!`,
        });
        setTimeout(() => setImportFeedback({ status: 'idle', message: '' }), 4000);
      } catch (err: any) {
        setImportFeedback({
          status: 'error',
          message: err?.message || 'Failed to parse JSON backup file.',
        });
        setTimeout(() => setImportFeedback({ status: 'idle', message: '' }), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">General Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Workspace theme, preferences, and data portability</p>
        </div>
      </div>

      {/* Theme & Appearance Switcher */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Appearance & Theme</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSetTheme?.('light')}
            className={cn(
              'flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer',
              theme === 'light'
                ? 'bg-blue-50 border-blue-500/50 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
            )}
          >
            <Sun size={17} className={theme === 'light' ? 'text-amber-500' : 'text-slate-400'} />
            <div className="text-left">
              <span className="block font-semibold">Light White</span>
              <span className="block text-[11px] opacity-70">Clean SaaS aesthetic</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSetTheme?.('dark')}
            className={cn(
              'flex items-center justify-center gap-2.5 p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer',
              theme === 'dark'
                ? 'bg-blue-600/30 border-blue-500 text-white shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
            )}
          >
            <Moon size={17} className={theme === 'dark' ? 'text-blue-400' : 'text-slate-400'} />
            <div className="text-left">
              <span className="block font-semibold">Dark Navy</span>
              <span className="block text-[11px] opacity-70">Low-light contrast</span>
            </div>
          </button>
        </div>
      </div>

      <InputField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Your company name" />
      <SelectField
        label="Default Currency"
        value={currency}
        onChange={setCurrency}
        options={[
          { value: 'USD', label: 'USD – US Dollar' },
          { value: 'EUR', label: 'EUR – Euro' },
          { value: 'GBP', label: 'GBP – British Pound' },
          { value: 'AUD', label: 'AUD – Australian Dollar' },
        ]}
      />
      <SelectField
        label="Timezone"
        value={timezone}
        onChange={setTimezone}
        options={[
          { value: 'America/New_York', label: 'Eastern Time (ET)' },
          { value: 'America/Chicago', label: 'Central Time (CT)' },
          { value: 'America/Denver', label: 'Mountain Time (MT)' },
          { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
          { value: 'Europe/London', label: 'London (GMT)' },
          { value: 'Europe/Paris', label: 'Central European (CET)' },
          { value: 'Asia/Tokyo', label: 'Japan Standard (JST)' },
          { value: 'Australia/Sydney', label: 'Australian Eastern (AEST)' },
        ]}
      />
      <SelectField
        label="Language"
        value={language}
        onChange={setLanguage}
        options={[
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Español' },
          { value: 'fr', label: 'Français' },
          { value: 'de', label: 'Deutsch' },
          { value: 'ja', label: '日本語' },
        ]}
      />

      {/* Data Portability & System Backups */}
      <div className="border-t border-white/5 pt-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Portability & System Backups</p>
          <p className="text-xs text-slate-500 mt-0.5">Export full system snapshots or restore custom document collections</p>
        </div>

        {importFeedback.status !== 'idle' && (
          <div
            className={cn(
              'p-3 rounded-xl border text-xs flex items-center gap-2 animate-fade-in',
              importFeedback.status === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            )}
          >
            {importFeedback.status === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{importFeedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export Card */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-white font-medium text-sm mb-1">
                <Download className="w-4 h-4 text-blue-400" />
                <span>Export System Backup</span>
              </div>
              <p className="text-xs text-slate-400">
                Download all {documentCount ?? 0} invoices, extraction fields, line items, and audit logs as a JSON bundle.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportFullBackup}
              className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 font-medium"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Full Backup (JSON)</span>
            </button>
          </div>

          {/* Import / Restore Card */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-white font-medium text-sm mb-1">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Restore from Backup</span>
              </div>
              <p className="text-xs text-slate-400">
                Upload a DocuSmart JSON backup file to restore invoice archives and verification histories.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 font-medium border-purple-500/30 hover:border-purple-500/50 text-purple-300"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Import / Restore (JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reset Document Database */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
          <div>
            <p className="text-sm font-semibold text-white">Reset Document Database</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Currently storing {documentCount ?? 0} document{documentCount !== 1 ? 's' : ''} in browser local storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDocuments}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Sample Data
          </button>
        </div>
      </div>

      <SaveButton />
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────
function NotificationsTab() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(true);
  const [reviewRequired, setReviewRequired] = useState(true);
  const [duplicateDetected, setDuplicateDetected] = useState(true);
  const [notifEmail, setNotifEmail] = useState('john@acme.com');

  return (
    <div className="glass-card p-6 space-y-5">
      <h2 className="text-base font-semibold text-white">Notification Preferences</h2>

      <div className="space-y-4">
        <Toggle checked={emailNotif} onChange={() => setEmailNotif(v => !v)} label="Email Notifications" />
        <Toggle checked={slackNotif} onChange={() => setSlackNotif(v => !v)} label="Slack Notifications" />
        <div className="border-t border-white/5 pt-4 space-y-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger Events</p>
          <Toggle checked={processingComplete} onChange={() => setProcessingComplete(v => !v)} label="Processing Complete" />
          <Toggle checked={reviewRequired} onChange={() => setReviewRequired(v => !v)} label="Review Required" />
          <Toggle checked={duplicateDetected} onChange={() => setDuplicateDetected(v => !v)} label="Duplicate Detected" />
        </div>
      </div>

      <div className="pt-2">
        <InputField
          label="Notification Email"
          value={notifEmail}
          onChange={setNotifEmail}
          placeholder="email@company.com"
        />
      </div>

      <SaveButton />
    </div>
  );
}

// ─── Tab: Integrations ────────────────────────────────────────────────────────
function IntegrationsTab() {
  const [apiKey, setApiKey] = useState('sk-live-7f89d3a2b1c4e5f60718293a4b5c6d7e');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.example.com/docusmart');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('docusmart_gemini_key') || '';
    }
    return '';
  });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash');
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [geminiStatusMsg, setGeminiStatusMsg] = useState('');

  const [services, setServices] = useState([
    { name: 'QuickBooks', logo: '🟩', connected: true },
    { name: 'Xero', logo: '🟦', connected: false },
    { name: 'Sage', logo: '🟪', connected: false },
  ]);

  const maskedKey = apiKey.slice(0, 10) + '•'.repeat(24) + apiKey.slice(-4);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = () => {
    const chars = '0123456789abcdef';
    let newKey = 'sk-live-';
    for (let i = 0; i < 32; i++) {
      newKey += chars[Math.floor(Math.random() * chars.length)];
    }
    setApiKey(newKey);
  };

  const handleSaveGeminiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('docusmart_gemini_key', geminiKey.trim());
      setGeminiStatus('success');
      setGeminiStatusMsg('Gemini configuration saved successfully!');
      setTimeout(() => setGeminiStatus('idle'), 3000);
    }
  };

  const handleTestGeminiKey = async () => {
    if (!geminiKey.trim()) {
      setGeminiStatus('error');
      setGeminiStatusMsg('Please enter a Gemini API key first.');
      return;
    }
    setGeminiStatus('testing');
    try {
      const res = await fetch('/api/extract', {
        headers: { 'x-gemini-api-key': geminiKey.trim() },
      });
      const data = await res.json();
      if (data.status === 'healthy') {
        setGeminiStatus('success');
        setGeminiStatusMsg('Connected to Gemini extraction engine successfully!');
      } else {
        setGeminiStatus('error');
        setGeminiStatusMsg('Verification returned unexpected response.');
      }
    } catch {
      setGeminiStatus('error');
      setGeminiStatusMsg('Failed to reach extraction service.');
    }
    setTimeout(() => setGeminiStatus('idle'), 4000);
  };

  const toggleService = (name: string) => {
    setServices(prev =>
      prev.map(svc => svc.name === name ? { ...svc, connected: !svc.connected } : svc)
    );
  };

  return (
    <div className="space-y-6">
      {/* Google Gemini AI Configuration Card */}
      <div className="glass-card p-6 space-y-5 border-blue-200 dark:border-blue-500/30 bg-white dark:bg-[#080d2a] shadow-xs dark:shadow-xl text-slate-900 dark:text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Google Gemini 2.0 AI Engine</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-500/30">
                  Multimodal IDP
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Powers automated invoice OCR, key-value extraction, and line item parsing.
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field flex-1 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(v => !v)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
                title={showGeminiKey ? 'Hide Key' : 'Show Key'}
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Extraction Model
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="gemini-2.0-flash" className="bg-white dark:bg-[#0d1230]">Gemini 2.0 Flash (Fast)</option>
              <option value="gemini-1.5-pro" className="bg-white dark:bg-[#0d1230]">Gemini 1.5 Pro (Deep)</option>
            </select>
          </div>
        </div>

        {geminiStatusMsg && (
          <div className={cn(
            'p-3 rounded-xl text-xs flex items-center gap-2 border animate-fade-in',
            geminiStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
            geminiStatus === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
            'bg-blue-500/10 border-blue-500/20 text-blue-300'
          )}>
            {geminiStatus === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            {geminiStatus === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <span>{geminiStatusMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleSaveGeminiKey}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-medium"
          >
            <Save className="w-3.5 h-3.5" /> Save Gemini Config
          </button>
          <button
            type="button"
            onClick={handleTestGeminiKey}
            disabled={geminiStatus === 'testing'}
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', geminiStatus === 'testing' && 'animate-spin')} />
            {geminiStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
          </button>
        </div>
      </div>
      {/* API Key */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-white">API Access</h2>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Key</label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
              {showKey ? apiKey : maskedKey}
            </div>
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
              title={showKey ? 'Hide' : 'Show'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
              title="Copy"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleRegenerateKey}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </button>
          </div>
        </div>
        <InputField
          label="Webhook URL"
          value={webhookUrl}
          onChange={setWebhookUrl}
          placeholder="https://your-domain.com/webhook"
        />
        <SaveButton />
      </div>

      {/* Connected Services */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-4">Connected Services</h2>
        <div className="space-y-3">
          {services.map(svc => (
            <div
              key={svc.name}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{svc.logo}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{svc.name}</p>
                  {svc.connected ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <XCircle className="w-3 h-3" /> Not connected
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleService(svc.name)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-medium transition border',
                  svc.connected
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                    : 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30'
                )}
              >
                {svc.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────────
function SecurityTab() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ text: string; error: boolean } | null>(null);

  const [sessionList, setSessionList] = useState([
    { id: 'sess-1', device: 'MacBook Pro – Chrome', location: 'San Francisco, CA', time: 'Active now', current: true },
    { id: 'sess-2', device: 'iPhone 15 – Safari', location: 'San Francisco, CA', time: '2 hours ago', current: false },
    { id: 'sess-3', device: 'Windows PC – Edge', location: 'New York, NY', time: '3 days ago', current: false },
  ]);

  const handlePasswordSubmit = () => {
    if (!currentPw) {
      setPwMessage({ text: 'Please enter your current password.', error: true });
      return;
    }
    if (newPw.length < 8) {
      setPwMessage({ text: 'New password must be at least 8 characters.', error: true });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMessage({ text: 'New passwords do not match.', error: true });
      return;
    }
    setPwMessage({ text: 'Password successfully updated!', error: false });
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPwMessage(null), 3000);
  };

  const revokeSession = (id: string) => {
    setSessionList(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Change Password</h2>
        <InputField label="Current Password" type="password" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" />
        <InputField label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="••••••••" />
        <InputField label="Confirm New Password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
        {pwMessage && (
          <p className={cn('text-xs font-medium', pwMessage.error ? 'text-red-400' : 'text-emerald-400')}>
            {pwMessage.text}
          </p>
        )}
        <SaveButton onClick={handlePasswordSubmit} />
      </div>

      {/* 2FA */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Two-Factor Authentication (2FA)</h2>
        <p className="text-sm text-slate-400">
          Add an extra layer of security to your account by requiring an authenticator app code.
        </p>
        <Toggle checked={twoFA} onChange={() => setTwoFA(v => !v)} label="Enable Two-Factor Authentication" />
        {twoFA && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            2FA is active. An authenticator code will be requested on next sign-in.
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Active Sessions</h2>
        <div className="space-y-3">
          {sessionList.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  {s.device}
                  {s.current && (
                    <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button
                  type="button"
                  onClick={() => revokeSession(s.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition px-3 py-1 rounded-lg border border-red-500/20 hover:border-red-500/40"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SettingsPageProps {
  onResetDocuments?: () => void;
  documentCount?: number;
  documents?: Document[];
  onImportDocuments?: (docs: Document[]) => void;
  theme?: 'light' | 'dark';
  onSetTheme?: (t: 'light' | 'dark') => void;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  actionType: 'approve' | 'flag' | 'reject' | 'notify';
  enabled: boolean;
}

const DEFAULT_RULES: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Auto-Approve Low-Risk Invoices',
    description: 'Automatically approve invoices under $500 with OCR confidence score ≥ 92%',
    condition: 'Amount < $500 AND Confidence ≥ 92%',
    action: 'Auto-Approve & Queue for Export',
    actionType: 'approve',
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'High-Value Escalation Gate',
    description: 'Flag any invoice totaling over $5,000 for mandatory senior financial review',
    condition: 'Total Amount > $5,000',
    action: 'Escalate to Senior Controller',
    actionType: 'flag',
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'Duplicate Invoice Auto-Block',
    description: 'Instantly flag and halt processing for invoices matching existing vendor & invoice number',
    condition: 'Duplicate Invoice # AND Same Vendor',
    action: 'Mark Duplicate & Alert AP',
    actionType: 'reject',
    enabled: true,
  },
  {
    id: 'rule-4',
    name: 'Arithmetic Discrepancy Halt',
    description: 'Block approval if Subtotal + Tax does not match Total Amount within $0.05',
    condition: '|Subtotal + Tax - Total| > $0.05',
    action: 'Trigger Math Warning & Require Override',
    actionType: 'flag',
    enabled: true,
  },
  {
    id: 'rule-5',
    name: 'Urgent Due Date Alert',
    description: 'Highlight invoices with payment due in fewer than 7 days as high-priority',
    condition: 'Due Date < 7 Days',
    action: 'Apply Urgent Priority Tag',
    actionType: 'notify',
    enabled: false,
  },
];

function WorkflowRulesTab({ documents = [] }: { documents?: Document[] }) {
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('docusmart_workflow_rules');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_RULES;
  });

  const [simResults, setSimResults] = useState<{
    simulated: boolean;
    matches: { ruleId: string; count: number; docNames: string[] }[];
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [newRuleAction, setNewRuleAction] = useState('Auto-Approve');
  const [newRuleType, setNewRuleType] = useState<'approve' | 'flag' | 'reject' | 'notify'>('approve');

  const saveRules = (updated: AutomationRule[]) => {
    setRules(updated);
    try {
      localStorage.setItem('docusmart_workflow_rules', JSON.stringify(updated));
    } catch {}
  };

  const handleToggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    saveRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    saveRules(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    const rule: AutomationRule = {
      id: `rule-custom-${Date.now()}`,
      name: newRuleName.trim(),
      description: newRuleDesc.trim() || 'Custom intelligent workflow automation rule',
      condition: newRuleCondition.trim() || 'Amount > $1,000',
      action: newRuleAction,
      actionType: newRuleType,
      enabled: true,
    };
    saveRules([...rules, rule]);
    setNewRuleName('');
    setNewRuleDesc('');
    setNewRuleCondition('');
    setShowAddModal(false);
  };

  const handleRunSimulation = () => {
    const results = rules.map(rule => {
      let matchedDocs: Document[] = [];
      if (rule.id === 'rule-1') {
        matchedDocs = documents.filter(d => d.amount < 500 && d.confidence >= 90);
      } else if (rule.id === 'rule-2') {
        matchedDocs = documents.filter(d => d.amount > 5000);
      } else if (rule.id === 'rule-3') {
        matchedDocs = documents.filter(d => d.status === 'duplicate' || d.fileName.includes('duplicate'));
      } else if (rule.id === 'rule-4') {
        matchedDocs = documents.filter(d => d.validationWarnings?.some(w => w.field === 'total'));
      } else {
        matchedDocs = documents.filter(d => d.amount > 1000);
      }
      return {
        ruleId: rule.id,
        count: matchedDocs.length,
        docNames: matchedDocs.map(d => d.fileName || d.vendor),
      };
    });
    setSimResults({ simulated: true, matches: results });
  };

  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Rules Engine Banner */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Intelligent Workflow Rules Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeCount} Active Rules
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automate invoice triage, human review triggers, duplicate blocks, and validation routing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRunSimulation}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 font-medium"
            title="Evaluate rules against current loaded documents"
          >
            <Play size={13} className="text-blue-400" /> Simulate Engine
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5 font-medium"
          >
            <Plus size={13} /> Add Rule
          </button>
        </div>
      </div>

      {/* Simulation Results Banner */}
      {simResults && (
        <div className="glass-card p-5 border border-blue-500/30 bg-blue-500/5 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-400" /> Simulation Report on {documents.length} Current Documents
            </span>
            <button
              type="button"
              onClick={() => setSimResults(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            {simResults.matches.map(m => {
              const rule = rules.find(r => r.id === m.ruleId);
              if (!rule) return null;
              return (
                <div key={m.ruleId} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rule.name}</span>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {m.count} matched
                    </span>
                  </div>
                  {m.count > 0 && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {m.docNames.join(', ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={cn(
              'glass-card p-5 transition border',
              rule.enabled ? 'border-white/10' : 'border-white/5 opacity-60'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      rule.actionType === 'approve'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : rule.actionType === 'flag'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : rule.actionType === 'reject'
                        ? 'bg-red-500/15 text-red-300 border-red-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    )}
                  >
                    Action: {rule.action}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{rule.description}</p>
                <div className="pt-1 flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 uppercase font-semibold">Condition:</span>
                  <code className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-purple-300">
                    {rule.condition}
                  </code>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <Toggle
                  checked={rule.enabled}
                  onChange={() => handleToggleRule(rule.id)}
                  label=""
                />
                {rule.id.startsWith('rule-custom') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition"
                    title="Delete custom rule"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Custom Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleAddRule}
            className="glass-card bg-[#0b1033] border border-white/20 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-white animate-slide-up"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap size={16} className="text-purple-400" /> Create Custom Automation Rule
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase font-semibold text-[10px]">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Invoice Auto-Approve"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  className="input-field w-full text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold text-[10px]">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Automatically route cloud hosting bills to engineering budget"
                  value={newRuleDesc}
                  onChange={e => setNewRuleDesc(e.target.value)}
                  className="input-field w-full text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold text-[10px]">Condition Expression</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vendor = 'Amazon Web Services' AND Amount < 2000"
                  value={newRuleCondition}
                  onChange={e => setNewRuleCondition(e.target.value)}
                  className="input-field w-full text-xs mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-semibold text-[10px]">Action</label>
                  <select
                    value={newRuleAction}
                    onChange={e => setNewRuleAction(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white mt-1 cursor-pointer"
                  >
                    <option value="Auto-Approve" className="bg-[#0b1033]">Auto-Approve</option>
                    <option value="Flag for Senior Review" className="bg-[#0b1033]">Flag for Review</option>
                    <option value="Reject & Halt" className="bg-[#0b1033]">Reject & Halt</option>
                    <option value="Send Alert" className="bg-[#0b1033]">Send Alert</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-semibold text-[10px]">Action Type</label>
                  <select
                    value={newRuleType}
                    onChange={e => setNewRuleType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white mt-1 cursor-pointer"
                  >
                    <option value="approve" className="bg-[#0b1033]">Approve (Green)</option>
                    <option value="flag" className="bg-[#0b1033]">Flag (Amber)</option>
                    <option value="reject" className="bg-[#0b1033]">Reject (Red)</option>
                    <option value="notify" className="bg-[#0b1033]">Notify (Blue)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-medium"
              >
                <Check size={14} /> Save Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────
export function SettingsPage({
  onResetDocuments,
  documentCount,
  documents,
  onImportDocuments,
  theme = 'light',
  onSetTheme,
}: SettingsPageProps = {}) {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      {/* Tab navigation */}
      <div className="glass-card p-1.5 flex gap-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition cursor-pointer',
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600/40 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'general' && (
        <GeneralTab
          onResetDocuments={onResetDocuments}
          documentCount={documentCount}
          documents={documents}
          onImportDocuments={onImportDocuments}
          theme={theme}
          onSetTheme={onSetTheme}
        />
      )}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'integrations' && <IntegrationsTab />}
      {activeTab === 'rules' && <WorkflowRulesTab documents={documents} />}
      {activeTab === 'security' && <SecurityTab />}
    </div>
  );
}
