import React, { useState } from 'react';
import { CampusLocation, NoiseReport } from '../types';
import { MapPin, Volume2, ShieldAlert, Sparkles, Building, CheckCircle2 } from 'lucide-react';

interface CampusMapProps {
  locations: CampusLocation[];
  reports: NoiseReport[];
  onSelectLocationForReport?: (locId: string) => void;
  onUpdateThreshold?: (locId: string, newThreshold: number) => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  locations,
  reports,
  onSelectLocationForReport,
  onUpdateThreshold,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation>(locations[0]);
  const [thresholdInput, setThresholdInput] = useState<number>(selectedLocation?.thresholdDb || 45);

  const handleSelect = (loc: CampusLocation) => {
    setSelectedLocation(loc);
    setThresholdInput(loc.thresholdDb);
  };

  const selectedReports = reports.filter(r => r.locationId === selectedLocation?.id);
  const currentDb = selectedLocation?.currentDb || selectedLocation?.thresholdDb || 40;
  const isBreached = selectedLocation && currentDb > selectedLocation.thresholdDb;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" />
            Interactive Campus Noise Map & Heatmap
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual spatial tracking of campus acoustic zones, real-time sensor nodes, and threshold boundaries.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Compliant</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Approaching Limit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" /> Threshold Breach</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Graphical Campus Map (SVG) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 relative overflow-hidden shadow-xl">
          <div className="relative w-full aspect-[16/10] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            {/* Campus ground paths & grid texture */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="campus-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#campus-grid)" />
              {/* Decorative pedestrian paths */}
              <path d="M 100 200 Q 300 150 600 250 T 800 180" fill="none" stroke="#475569" strokeWidth="12" />
              <path d="M 300 50 L 300 400" fill="none" stroke="#475569" strokeWidth="8" />
              <path d="M 550 50 L 550 400" fill="none" stroke="#475569" strokeWidth="8" />
            </svg>

            {/* Campus Zones Pins */}
            {locations.map((loc) => {
              const db = loc.currentDb || loc.thresholdDb;
              const over = db > loc.thresholdDb;
              const near = !over && db >= loc.thresholdDb - 5;
              const isSelected = selectedLocation?.id === loc.id;

              const pinColor = over
                ? 'bg-rose-500 text-white shadow-rose-500/50'
                : near
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/50'
                : 'bg-emerald-500 text-slate-950 shadow-emerald-500/50';

              return (
                <div
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  style={{ left: `${loc.mapX}%`, top: `${loc.mapY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-10 ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                  }`}
                >
                  {/* Heat circle pulse if breached */}
                  {over && (
                    <span className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
                  )}

                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-xs font-bold shadow-lg border border-white/20 ${pinColor}`}
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{db} dB</span>
                  </div>

                  {/* Label tooltip */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded shadow ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {loc.name.split(' - ')[0].split(' (')[0]}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-1">
            <span>Click any campus building to inspect acoustic telemetry</span>
            <span className="font-mono text-[11px] text-indigo-400">7 Active Campus Nodes</span>
          </div>
        </div>

        {/* Right: Selected Location Detail Card */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          {selectedLocation ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    {selectedLocation.zoneType}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isBreached
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {isBreached ? 'Threshold Breached' : 'Acoustically Compliant'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">{selectedLocation.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedLocation.description}</p>
              </div>

              {/* Sound level gauge card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Current Noise</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-bold text-white">{currentDb}</span>
                    <span className="text-xs text-slate-400">dB(A)</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Zone Threshold Limit:</span>
                  <span className="font-mono font-semibold text-indigo-300">{selectedLocation.thresholdDb} dB</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>WHO Reference Standard:</span>
                  <span className="font-mono font-semibold text-emerald-400">35 dB (Classroom)</span>
                </div>
              </div>

              {/* Threshold modifier */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Update Zone Threshold Limit (Admin)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="25"
                    max="90"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(Number(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-400">dB</span>
                  <button
                    onClick={() => onUpdateThreshold && onUpdateThreshold(selectedLocation.id, thresholdInput)}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    Save Limit
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Trigger alerts whenever student or IoT readings exceed this threshold.
                </p>
              </div>

              {/* Action buttons */}
              {onSelectLocationForReport && (
                <button
                  onClick={() => onSelectLocationForReport(selectedLocation.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  Submit Report for this Zone
                </button>
              )}

              {/* Recent zone reports count */}
              <div className="text-xs text-slate-400 text-center">
                {selectedReports.length} noise incident reports on record for this zone.
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 py-12">Select a location on the map</div>
          )}
        </div>
      </div>
    </div>
  );
};
