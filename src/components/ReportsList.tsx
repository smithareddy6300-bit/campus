import React, { useState } from 'react';
import { NoiseReport, ReportStatus, UserRole, CampusLocation } from '../types';
import { api } from '../services/api';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  Trash2,
  ArrowRight,
  Shield,
  User as UserIcon,
  X,
  Volume2
} from 'lucide-react';

interface ReportsListProps {
  reports: NoiseReport[];
  locations: CampusLocation[];
  currentUserRole: UserRole;
  currentUserId: string;
  onReportUpdated: (updated: NoiseReport) => void;
  onReportCancelled: (reportId: string) => void;
}

export const ReportsList: React.FC<ReportsListProps> = ({
  reports,
  locations,
  currentUserRole,
  currentUserId,
  onReportUpdated,
  onReportCancelled,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyMyReports, setOnlyMyReports] = useState(currentUserRole === 'STUDENT');

  // Detail Modal
  const [activeReport, setActiveReport] = useState<NoiseReport | null>(null);
  const [actionNotesInput, setActionNotesInput] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Filter logic
  const filteredReports = reports.filter((r) => {
    if (onlyMyReports && r.userId !== currentUserId) return false;
    if (selectedZone !== 'ALL' && r.locationId !== selectedZone) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.locationName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenModal = (report: NoiseReport) => {
    setActiveReport(report);
    setActionNotesInput(report.actionNotes || '');
  };

  const handleUpdateStatus = async (nextStatus: ReportStatus) => {
    if (!activeReport) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateReportStatus(
        activeReport.id,
        nextStatus,
        actionNotesInput,
        currentUserRole === 'ADMIN' ? 'Dr. Patricia Vance (Admin)' : undefined
      );
      setActiveReport(updated);
      onReportUpdated(updated);
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleGenerateAiInsight = async (reportId: string) => {
    setIsGeneratingAi(true);
    try {
      const insight = await api.generateReportInsight(reportId);
      if (activeReport && activeReport.id === reportId) {
        const updated = { ...activeReport, aiInsight: insight };
        setActiveReport(updated);
        onReportUpdated(updated);
      }
    } catch (err) {
      console.error('AI Insight failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCancelReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to cancel this report?')) return;
    try {
      await api.cancelReport(reportId);
      onReportCancelled(reportId);
      if (activeReport?.id === reportId) setActiveReport(null);
    } catch (err) {
      alert('Could not cancel: report may already be under review.');
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><Clock className="w-3 h-3" /> Submitted</span>;
      case 'REVIEWED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"><Shield className="w-3 h-3" /> Reviewed</span>;
      case 'ACTION_TAKEN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Action Taken</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Noise Incidents & Audit Workflow
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Auditable status lifecycle: Submitted → Reviewed → Action Taken → Closed
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentUserRole === 'STUDENT' ? (
              <button
                onClick={() => setOnlyMyReports(!onlyMyReports)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  onlyMyReports
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {onlyMyReports ? 'Showing: My Reports' : 'Showing: All Campus Reports'}
              </button>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Administrator View (Full Workflow Access)
              </span>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search description, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Zone filter */}
          <div>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            >
              <option value="ALL">All Campus Zones</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ACTION_TAKEN">Action Taken</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none capitalize"
            >
              <option value="ALL">All Categories</option>
              <option value="traffic">Traffic</option>
              <option value="construction">Construction</option>
              <option value="event">Event</option>
              <option value="crowd">Crowd</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No noise reports match the selected filters.
            </div>
          ) : (
            filteredReports.map((report) => {
              const isOwner = report.userId === currentUserId;
              const canCancel = isOwner && report.status === 'SUBMITTED';

              return (
                <div
                  key={report.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">{report.locationName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {report.category}
                      </span>
                      {report.hasAlert && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Threshold Alert
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">{report.description}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Reporter: {report.userName}</span>
                      <span>•</span>
                      <span>Source: {report.source.replace('_', ' ')}</span>
                      {report.actionNotes && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium truncate max-w-xs">
                            Action: {report.actionNotes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side stats & actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-indigo-300">{report.noiseDb} dB</div>
                      <div className="text-[10px] text-slate-500">Recorded Level</div>
                    </div>

                    <div>{getStatusBadge(report.status)}</div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenModal(report)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        Inspect / Audit
                      </button>

                      {canCancel && (
                        <button
                          onClick={() => handleCancelReport(report.id)}
                          title="Cancel unreviewed report"
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detailed Report & Workflow Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {activeReport.id}
                  </span>
                  {getStatusBadge(activeReport.status)}
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5">{activeReport.locationName}</h3>
                <p className="text-xs text-slate-400">
                  Reported by {activeReport.userName} ({activeReport.userEmail}) on{' '}
                  {new Date(activeReport.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Incident Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div>
                <div className="text-[11px] text-slate-400">Recorded Noise</div>
                <div className="text-xl font-mono font-bold text-indigo-400">{activeReport.noiseDb} dB</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Category</div>
                <div className="text-sm font-semibold capitalize text-slate-200 mt-1">{activeReport.category}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Sensor Source</div>
                <div className="text-xs font-medium text-slate-300 mt-1">{activeReport.source.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Student Incident Narrative</label>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                "{activeReport.description}"
              </div>
            </div>

            {/* LangChain4j AI Integration Layer (Section 8 of PDF) */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200">
                    LangChain4j AI Advisory Intelligence
                  </span>
                </div>
                <button
                  onClick={() => handleGenerateAiInsight(activeReport.id)}
                  disabled={isGeneratingAi}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                >
                  {isGeneratingAi ? 'Invoking AI Model...' : 'Regenerate Insight'}
                </button>
              </div>

              {activeReport.aiInsight ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-indigo-300">Acoustic Summary: </span>
                    <span className="text-slate-200">{activeReport.aiInsight.summary}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-900/40 border border-indigo-500/20 text-indigo-100">
                    <span className="font-semibold text-emerald-300">Recommended Action Idea: </span>
                    <span>{activeReport.aiInsight.suggestion}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right italic">
                    Model: {activeReport.aiInsight.model} • Non-binding advisory output
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>No LangChain4j analysis stored for this report yet.</span>
                  <button
                    onClick={() => handleGenerateAiInsight(activeReport.id)}
                    className="text-indigo-400 underline font-medium"
                  >
                    Analyze Now
                  </button>
                </div>
              )}
            </div>

            {/* Administrator Status Progression & Action Notes (Section 4 & 6) */}
            {currentUserRole === 'ADMIN' ? (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300">
                  Administrative Review & Action Notes (Audit Log)
                </label>
                <textarea
                  rows={2}
                  value={actionNotesInput}
                  onChange={(e) => setActionNotesInput(e.target.value)}
                  placeholder="Record mitigation action (e.g., Dispatched HVAC crew, rescheduled lawn mowing, issued student notice)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Transition Status:</span>
                  <button
                    disabled={isUpdatingStatus || activeReport.status === 'REVIEWED'}
                    onClick={() => handleUpdateStatus('REVIEWED')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    disabled={isUpdatingStatus || activeReport.status === 'ACTION_TAKEN'}
                    onClick={() => handleUpdateStatus('ACTION_TAKEN')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    Mark Action Taken
                  </button>
                  <button
                    disabled={isUpdatingStatus || activeReport.status === 'CLOSED'}
                    onClick={() => handleUpdateStatus('CLOSED')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    Close Incident
                  </button>
                </div>
              </div>
            ) : (
              activeReport.actionNotes && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="font-semibold text-emerald-400">Administrative Action: </span>
                  <span className="text-slate-300">{activeReport.actionNotes}</span>
                  {activeReport.reviewedBy && (
                    <div className="text-[10px] text-slate-500 mt-1">Reviewed by: {activeReport.reviewedBy}</div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
