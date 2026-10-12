import React, { useState } from 'react';
import { AnalyticsSummary, CampusLocation, NoiseReport, NoiseAlert } from '../types';
import {
  Volume2,
  TrendingUp,
  AlertTriangle,
  FileCheck2,
  Download,
  Building2,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  analytics: AnalyticsSummary;
  locations: CampusLocation[];
  reports: NoiseReport[];
  alerts: NoiseAlert[];
  onOpenReportModal?: (report: NoiseReport) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  analytics,
  locations,
  reports,
  alerts,
  onOpenReportModal,
  onNavigateToTab,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week'>('today');

  // Export report dataset to CSV
  const handleExportCsv = () => {
    const headers = ['Report ID', 'Date Time', 'Location', 'Noise dB', 'Category', 'Status', 'Source', 'Description'];
    const rows = reports.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleString(),
      `"${r.locationName.replace(/"/g, '""')}"`,
      r.noiseDb,
      r.category,
      r.status,
      r.source,
      `"${r.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campus_sound_noise_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart points
  const trendData = analytics.hourlyTrend || [];
  const chartHeight = 160;
  const chartWidth = 500;
  const maxDb = 90;
  const minDb = 25;

  const points = trendData.map((d, index) => {
    const x = (index / (trendData.length - 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - ((d.avgDb - minDb) / (maxDb - minDb)) * (chartHeight - 40) - 20;
    return { x, y, ...d };
  });

  const svgPathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // WHO 35 dB Line Y coordinate
  const whoLineY = chartHeight - ((35 - minDb) / (maxDb - minDb)) * (chartHeight - 40) - 20;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Campus Noise Environment Dashboard</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time acoustic surveillance, threshold breaches, and WHO standard compliance overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Export CSV Data
          </button>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('ai')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Analysis
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (Matches Page 8 Diagram exactly: Average, Peak, Reports, Alerts) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average dB */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Average Noise</span>
            <Volume2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-white">{analytics.averageDb}</span>
            <span className="text-sm font-semibold text-slate-400">dB(A)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className={analytics.averageDb > 55 ? 'text-amber-400' : 'text-emerald-400'}>
              {analytics.averageDb > 55 ? '● Elevated campus baseline' : '● Within ambient target'}
            </span>
          </div>
        </div>

        {/* Peak dB */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Peak Recorded</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-rose-400">{analytics.peakDb}</span>
            <span className="text-sm font-semibold text-slate-400">dB(A)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Highest: <span className="text-slate-200">{analytics.highestReportedZone?.name?.slice(0, 18) || 'North Parking'}</span>
          </div>
        </div>

        {/* Total Reports */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Total Reports</span>
            <FileCheck2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-white">{analytics.totalReports}</span>
            <span className="text-sm font-semibold text-slate-400">incidents</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-400">
            {reports.filter(r => r.status === 'CLOSED').length} resolved & closed
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-mono font-bold text-amber-400">{analytics.activeAlerts}</span>
            <span className="text-sm font-semibold text-slate-400">breaches</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {alerts.filter(a => a.severity === 'CRITICAL').length} critical severity
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Trend Chart + Zones Table (Page 8 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Time vs dB Trend Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Noise Trend by Hour & WHO Benchmark
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated average dB with WHO 35 dB(A) Classroom Reference guideline
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-0.5 bg-indigo-400 inline-block" /> Recorded dB
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed inline-block" /> WHO 35 dB Limit
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[480px]">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                {/* Horizontal gridlines */}
                {[35, 50, 65, 80].map((gridDb) => {
                  const y = chartHeight - ((gridDb - minDb) / (maxDb - minDb)) * (chartHeight - 40) - 20;
                  return (
                    <g key={gridDb}>
                      <line x1="30" y1={y} x2={chartWidth - 30} y2={y} stroke="#334155" strokeDasharray="3,3" strokeWidth="1" />
                      <text x="15" y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                        {gridDb}
                      </text>
                    </g>
                  );
                })}

                {/* Dotted WHO 35 dB Line */}
                <line
                  x1="30"
                  y1={whoLineY}
                  x2={chartWidth - 30}
                  y2={whoLineY}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                <text x={chartWidth - 110} y={whoLineY - 4} fill="#10b981" fontSize="9" fontWeight="bold">
                  WHO Ref (35 dB)
                </text>

                {/* Trend line */}
                <path d={svgPathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                {/* Trend points with tooltips */}
                {points.map((pt, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle cx={pt.x} cy={pt.y} r="4" fill="#818cf8" stroke="#1e1b4b" strokeWidth="2" />
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="opacity-90 font-semibold"
                    >
                      {pt.avgDb}
                    </text>
                    <text
                      x={pt.x}
                      y={chartHeight - 2}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {pt.hour}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 font-mono">Time (Hours) →</div>
        </div>

        {/* Right: Zones Acoustic Status (Page 8 Layout) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Campus Zones
            </h3>
            <span className="text-[11px] text-slate-400">Live / Current</span>
          </div>

          <div className="space-y-3">
            {locations.map((loc) => {
              const current = loc.currentDb || loc.thresholdDb;
              const isOver = current > loc.thresholdDb;
              return (
                <div
                  key={loc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-200 truncate">{loc.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Limit: {loc.thresholdDb} dB • <span className="capitalize">{loc.zoneType}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-sm font-bold px-2 py-0.5 rounded-lg ${
                        isOver
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {current} dB
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Breakdown & Recent Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Disturbance Categories
          </h3>

          <div className="space-y-3">
            {Object.entries(analytics.reportsByCategory || {}).map(([cat, count]) => {
              const total = analytics.totalReports || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-slate-300 font-medium">{cat}</span>
                    <span className="text-slate-400 font-mono">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.max(4, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reports / Workflow Quick Feed */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Latest Submitted Noise Incidents
            </h3>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('reports')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                View all reports →
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {reports.slice(0, 4).map((r) => (
              <div
                key={r.id}
                onClick={() => onOpenReportModal && onOpenReportModal(r)}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate">{r.locationName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-sm font-bold text-indigo-300">{r.noiseDb} dB</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      r.status === 'CLOSED'
                        ? 'bg-slate-800 text-slate-300'
                        : r.status === 'ACTION_TAKEN'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : r.status === 'REVIEWED'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
