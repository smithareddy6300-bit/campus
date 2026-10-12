import React, { useState } from 'react';
import { NoiseAlert, CampusLocation, AlertSeverity, AlertStatus } from '../types';
import { api } from '../services/api';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  BellRing,
  Sliders,
  ShieldAlert,
  Info,
  Clock,
  Settings2
} from 'lucide-react';

interface AlertsPanelProps {
  alerts: NoiseAlert[];
  locations: CampusLocation[];
  onAlertUpdated: (updated: NoiseAlert) => void;
  onUpdateThreshold: (locationId: string, newThreshold: number) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  locations,
  onAlertUpdated,
  onUpdateThreshold,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [editingThresholdLoc, setEditingThresholdLoc] = useState<CampusLocation | null>(null);
  const [thresholdVal, setThresholdVal] = useState<number>(45);

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  const handleStatusChange = async (alertId: string, nextStatus: 'ACKNOWLEDGED' | 'RESOLVED') => {
    try {
      const updated = await api.updateAlertStatus(
        alertId,
        nextStatus,
        'Dr. Patricia Vance (Admin)'
      );
      onAlertUpdated(updated);
    } catch (err) {
      console.error('Failed to update alert:', err);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <BellRing className="w-3.5 h-3.5" /> MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Acoustic Breach Alerts & Threshold Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts triggered when student reports or IoT sensors exceed configured campus zone thresholds.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Filter Status:</span>
          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Alerts Stream */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Incidents Exceeding Thresholds ({filteredAlerts.length})
            </h3>
            <span className="text-[11px] text-slate-400">Auditable Log</span>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No alerts matching status "{filterStatus}". Campus noise levels are currently within defined limits!
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-xs font-bold text-white">{alert.locationName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {alert.noiseDb} dB / {alert.thresholdDb} dB limit (+{alert.excessDb} dB)
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{alert.message}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="text-slate-400 flex items-center gap-2 text-[11px]">
                      <span>Status: <strong className="text-slate-200">{alert.status}</strong></span>
                      {alert.acknowledgedBy && (
                        <span>• Ack by: {alert.acknowledgedBy}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(alert.id, 'ACKNOWLEDGED')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Configurable Thresholds Table (WHO Classroom Guideline) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-400" />
              Zone Threshold Settings
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">WHO 35 dB Ref</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <Info className="w-3.5 h-3.5" /> Reference Note (PDF Section 1 & 8):
            </div>
            <p className="text-slate-400">
              "WHO community-noise guidance cites 35 dB(A) during teaching sessions. This project allows college administrators to configure thresholds per zone."
            </p>
          </div>

          <div className="space-y-2.5">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 pr-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">{loc.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{loc.zoneType}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-indigo-300">{loc.thresholdDb} dB</span>
                  <button
                    onClick={() => {
                      setEditingThresholdLoc(loc);
                      setThresholdVal(loc.thresholdDb);
                    }}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Change Threshold"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threshold edit modal */}
      {editingThresholdLoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Adjust Threshold Limit</h3>
            <p className="text-xs text-slate-300">
              Set maximum acceptable noise level for <strong>{editingThresholdLoc.name}</strong>.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Threshold:</span>
                <span className="font-mono font-bold text-lg text-white">{thresholdVal} dB(A)</span>
              </div>
              <input
                type="range"
                min="30"
                max="85"
                value={thresholdVal}
                onChange={(e) => setThresholdVal(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>30 dB (Strict Quiet)</span>
                <span>35 dB (WHO Teaching)</span>
                <span>85 dB</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setEditingThresholdLoc(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateThreshold(editingThresholdLoc.id, thresholdVal);
                  setEditingThresholdLoc(null);
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
              >
                Save Threshold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
