'use client';

import { useState, useMemo } from 'react';
import { DollarSign, Zap, Clock, Calendar, Download, Building2, X, ExternalLink, Tag } from 'lucide-react';
import { Document } from '@/lib/types';
import { processingChartData } from '@/lib/data';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { cn, formatCurrency } from '@/lib/utils';

interface AnalyticsPageProps {
  documents: Document[];
}

// Fake 7-point confidence trend data
const CONFIDENCE_TREND = [78, 82, 85, 81, 88, 91, 93];
const TREND_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_COLORS: Record<string, string> = {
  processed: 'bg-emerald-500',
  pending: 'bg-amber-500',
  review: 'bg-blue-500',
  rejected: 'bg-red-500',
  duplicate: 'bg-orange-500',
  processing: 'bg-violet-500',
};

const CATEGORY_STYLES: Record<string, { bar: string; text: string; dot: string }> = {
  'Software & SaaS': { bar: 'from-blue-600 to-indigo-500', text: 'text-blue-300', dot: 'bg-blue-400' },
  'Marketing & Ads': { bar: 'from-purple-600 to-pink-500', text: 'text-purple-300', dot: 'bg-purple-400' },
  'Legal & Professional': { bar: 'from-emerald-600 to-teal-500', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Office Supplies': { bar: 'from-amber-600 to-orange-500', text: 'text-amber-300', dot: 'bg-amber-400' },
  'Logistics & Shipping': { bar: 'from-cyan-600 to-sky-500', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  'Utilities & Telecom': { bar: 'from-rose-600 to-red-500', text: 'text-rose-300', dot: 'bg-rose-400' },
  'Uncategorized': { bar: 'from-slate-600 to-slate-500', text: 'text-slate-300', dot: 'bg-slate-400' },
};

export function AnalyticsPage({ documents }: AnalyticsPageProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'quarter' | 'ytd'>('7d');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const multiplier = timeframe === '7d' ? 1 : timeframe === '30d' ? 4.2 : timeframe === 'quarter' ? 12.8 : 48.5;
  const docCountMultiplier = timeframe === '7d' ? 1 : timeframe === '30d' ? 4 : timeframe === 'quarter' ? 12 : 46;

  const totalValue = useMemo(() => documents.reduce((s, d) => s + d.amount, 0) * multiplier, [documents, multiplier]);
  const avgConfidence = useMemo(() => {
    if (!documents.length) return 0;
    return Math.round(documents.reduce((s, d) => s + d.confidence, 0) / documents.length);
  }, [documents]);

  const liveVendorStats = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    documents.forEach((d) => {
      const v = d.vendor?.trim() || 'Unknown Vendor';
      const existing = map.get(v) || { count: 0, amount: 0 };
      map.set(v, {
        count: existing.count + 1,
        amount: existing.amount + d.amount,
      });
    });
    return Array.from(map.entries())
      .map(([vendor, stat]) => ({
        vendor,
        amount: Math.round(stat.amount * multiplier * 100) / 100,
        count: stat.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [documents, multiplier]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [documents]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    documents.forEach((d) => {
      const cat = d.category?.trim() || 'Uncategorized';
      const existing = map.get(cat) || { count: 0, amount: 0 };
      map.set(cat, {
        count: existing.count + 1,
        amount: existing.amount + d.amount,
      });
    });
    return Array.from(map.entries())
      .map(([category, stat]) => ({
        category,
        amount: Math.round(stat.amount * multiplier * 100) / 100,
        count: stat.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [documents, multiplier]);

  const maxProcessed = Math.max(...processingChartData.map(d => d.processed + d.failed), 1);
  const maxVendorAmount = Math.max(...liveVendorStats.map(v => v.amount), 1);
  const maxCategoryAmount = Math.max(...categoryStats.map(c => c.amount), 1);
  const maxConfidence = Math.max(...CONFIDENCE_TREND);
  const minConfidence = Math.min(...CONFIDENCE_TREND);

  const handleExportVendorLedger = (vendorName: string, vendorDocs: Document[]) => {
    const headers = ['Invoice Number', 'Date', 'Due Date', 'Amount', 'Currency', 'Status', 'Confidence'];
    const rows = vendorDocs.map(d => [
      `"${d.invoiceNumber.replace(/"/g, '""')}"`,
      `"${d.date}"`,
      `"${d.extractedFields?.dueDate || d.date}"`,
      d.amount,
      `"${d.currency}"`,
      `"${d.status}"`,
      `${d.confidence}%`,
    ]);
    const csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `Vendor_Ledger_${vendorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeframe,
      kpis: {
        totalValueProcessed: totalValue,
        averageConfidence: avgConfidence,
        documentsCount: documents.length,
      },
      statusDistribution: statusBreakdown.map(([status, count]) => ({ status, count })),
      topVendors: liveVendorStats,
      categoryBreakdown: categoryStats,
    };

    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `DocuSmart_Executive_Report_${timeframe}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build SVG polyline points for the confidence chart
  const chartWidth = 300;
  const chartHeight = 80;
  const svgPoints = CONFIDENCE_TREND.map((val, i) => {
    const x = (i / (CONFIDENCE_TREND.length - 1)) * chartWidth;
    const y = chartHeight - ((val - minConfidence + 5) / (maxConfidence - minConfidence + 10)) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="animate-fade-in space-y-6">
      {/* Timeframe & Overview Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Performance Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Intelligent document extraction insights & trends</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportReport}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium"
            title="Download executive analytics report"
          >
            <Download size={13} className="text-blue-600 dark:text-blue-400" />
            <span>Export Report</span>
          </button>
          <Calendar size={14} className="text-slate-400" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer font-medium shadow-2xs"
          >
            <option value="7d" className="bg-white dark:bg-[#0d1230]">Last 7 Days</option>
            <option value="30d" className="bg-white dark:bg-[#0d1230]">Last 30 Days</option>
            <option value="quarter" className="bg-white dark:bg-[#0d1230]">This Quarter</option>
            <option value="ytd" className="bg-white dark:bg-[#0d1230]">Year to Date (2024)</option>
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value Processed"
          value={formatCurrency(totalValue, 'USD')}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Avg Confidence Score"
          value={`${avgConfidence}%`}
          icon={<Zap className="w-5 h-5" />}
          color="emerald"
          trend={{ value: 5, label: '+5% vs previous period' }}
        />
        <StatCard
          title="Avg Processing Time"
          value="2.4s"
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Documents Processed"
          value={String(Math.round(documents.length * docCountMultiplier))}
          icon={<Calendar className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Processing Volume Chart */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Processing Volume</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daily document throughput for the past week</p>
        </div>

        <div className="flex items-end justify-between gap-3 h-56">
          {processingChartData.map(item => {
            const total = item.processed + item.failed;
            const processedPct = (item.processed / maxProcessed) * 100;
            const failedPct = (item.failed / maxProcessed) * 100;

            return (
              <div key={item.day} className="flex flex-col items-center gap-1 flex-1 h-full">
                <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{total}</span>
                <div className="relative flex flex-col justify-end w-full flex-1 gap-0.5">
                  {item.failed > 0 && (
                    <div
                      className="w-full rounded-t bg-red-500/70"
                      style={{ height: `${failedPct}%` }}
                      title={`Failed: ${item.failed}`}
                    />
                  )}
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${processedPct}%`,
                      background: 'linear-gradient(to top, #2563eb, #7c3aed)',
                    }}
                    title={`Processed: ${item.processed}`}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-1 font-medium">{item.day}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #2563eb, #7c3aed)' }} />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Processed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500/70" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Failed</span>
          </div>
        </div>
      </div>

      {/* Vendor Breakdown + Expense Category Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vendor Table */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Vendor Breakdown</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click vendor for profile & accounting ledger</p>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20 font-medium">Interactive</span>
          </div>
          <div className="space-y-2">
            {liveVendorStats.map(v => (
              <button
                key={v.vendor}
                type="button"
                onClick={() => setSelectedVendor(v.vendor)}
                className="w-full text-left p-2.5 -mx-1 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition group"
              >
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-300 transition flex items-center gap-1.5">
                    {v.vendor}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition text-blue-600 dark:text-blue-400" />
                  </span>
                  <div className="text-right">
                    <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(v.amount, 'USD')}</span>
                    <span className="text-slate-500 ml-2 text-xs">{v.count} doc{v.count > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(v.amount / maxVendorAmount) * 100}%`,
                      background: 'linear-gradient(to right, #2563eb, #7c3aed)',
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Expense Categories</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Spend distribution across accounting categories</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400">
              <Tag size={16} />
            </div>
          </div>
          <div className="space-y-3">
            {categoryStats.map(c => {
              const style = CATEGORY_STYLES[c.category] || CATEGORY_STYLES['Uncategorized'];
              const pct = Math.round((c.amount / (totalValue || 1)) * 100);
              return (
                <div key={c.category} className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition">
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className={cn('font-medium text-xs flex items-center gap-2', style.text)}>
                      <span className={cn('w-2 h-2 rounded-full', style.dot)} />
                      {c.category}
                    </span>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-white font-semibold text-xs sm:text-sm">{formatCurrency(c.amount, 'USD')}</span>
                      <span className="text-slate-500 ml-2 text-xs">{c.count} doc{c.count > 1 ? 's' : ''} <span className="opacity-70">({pct}%)</span></span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all bg-gradient-to-r', style.bar)}
                      style={{ width: `${(c.amount / maxCategoryAmount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Distribution + Accuracy Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Status Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Verification pipeline states</p>
          <div className="space-y-4">
            {statusBreakdown.map(([status, count]) => {
              const pct = Math.round((count / documents.length) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium capitalize">{status}</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{count} <span className="text-slate-500 text-xs font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', STATUS_COLORS[status] ?? 'bg-slate-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accuracy Trends */}
        <div className="glass-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Accuracy Trends</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Average confidence score over the past 7 days</p>
          </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
            className="w-full overflow-visible"
            style={{ minHeight: 120 }}
          >
            {/* Grid lines */}
            {[80, 85, 90, 95].map(val => {
              const y = chartHeight - ((val - minConfidence + 5) / (maxConfidence - minConfidence + 10)) * chartHeight;
              return (
                <g key={val}>
                  <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <text x="-5" y={y + 4} textAnchor="end" fill="rgba(148,163,184,0.7)" fontSize="10">{val}%</text>
                </g>
              );
            })}

            {/* Area fill */}
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,${chartHeight} ${svgPoints} ${chartWidth},${chartHeight}`}
              fill="url(#areaGrad)"
            />

            {/* Line */}
            <polyline
              points={svgPoints}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Data points */}
            {CONFIDENCE_TREND.map((val, i) => {
              const x = (i / (CONFIDENCE_TREND.length - 1)) * chartWidth;
              const y = chartHeight - ((val - minConfidence + 5) / (maxConfidence - minConfidence + 10)) * chartHeight;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#8b5cf6" stroke="#04071a" strokeWidth="2" />
                  <text x={x} y={y - 10} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">{val}%</text>
                  <text x={x} y={chartHeight + 18} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="10">{TREND_DAYS[i]}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      </div>

      {/* Vendor Profile & Invoices History Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-white dark:bg-[#0b1033] border border-slate-200 dark:border-white/20 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedVendor}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vendor Profile & Accounting Ledger</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Vendor Statistics */}
            {(() => {
              const vendorDocs = documents.filter(d => d.vendor === selectedVendor);
              const totalSpent = vendorDocs.reduce((acc, d) => acc + d.amount, 0);
              const avgConf = vendorDocs.length
                ? Math.round(vendorDocs.reduce((acc, d) => acc + d.confidence, 0) / vendorDocs.length)
                : 0;
              const address = vendorDocs.find(d => d.extractedFields?.vendorAddress)?.extractedFields?.vendorAddress || 'Corporate address on record';

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Total Spend</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(totalSpent, 'USD')}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Total Invoices</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{vendorDocs.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Avg Confidence</span>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">{avgConf}%</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Address on file:</span>
                    <span className="text-slate-800 dark:text-slate-300">{address}</span>
                  </div>

                  {/* Vendor Invoices Table */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoices on Record</span>
                    <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Invoice #</th>
                            <th className="py-2 px-3 font-semibold">Date</th>
                            <th className="py-2 px-3 text-right font-semibold">Amount</th>
                            <th className="py-2 px-3 text-center font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {vendorDocs.map(d => (
                            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white">{d.invoiceNumber}</td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{d.date}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(d.amount, d.currency)}</td>
                              <td className="py-2.5 px-3 text-center">
                                <StatusBadge status={d.status} size="sm" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Export Ledger Button */}
                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => handleExportVendorLedger(selectedVendor, vendorDocs)}
                      className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-medium"
                    >
                      <Download size={13} className="text-blue-600 dark:text-blue-400" /> Export Vendor Ledger
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVendor(null)}
                      className="btn-primary text-xs px-4 py-2 font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
