import React, { useState, useEffect } from 'react';
import { CampusLocation, NoiseReading } from '../types';
import { api } from '../services/api';
import { Cpu, Wifi, Activity, Zap, Play, Pause } from 'lucide-react';

interface IoTStreamSimulatorProps {
  locations: CampusLocation[];
  onNewReading: (reading: NoiseReading) => void;
  onAlertTriggered?: () => void;
}

export const IoTStreamSimulator: React.FC<IoTStreamSimulatorProps> = ({
  locations,
  onNewReading,
  onAlertTriggered,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || 'loc-1');
  const [lastFeed, setLastFeed] = useState<NoiseReading[]>([]);

  // Simulation timer every 4 seconds
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(async () => {
      // Pick random location
      const loc = locations[Math.floor(Math.random() * locations.length)];
      if (!loc) return;

      // Generate realistic noise reading around threshold +/- 4 dB
      const base = loc.thresholdDb - 3;
      const jitter = (Math.random() - 0.4) * 8;
      const noiseDb = Math.max(30, Math.round(base + jitter));

      try {
        const reading = await api.addReading({
          locationId: loc.id,
          noiseDb,
          source: 'IOT_SENSOR',
        });
        setLastFeed(prev => [reading, ...prev.slice(0, 5)]);
        onNewReading(reading);
      } catch (err) {
        console.error('IoT stream error:', err);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isRunning, locations]);

  // Inject acoustic spike to test alert workflow
  const handleInjectSpike = async () => {
    const loc = locations.find(l => l.id === selectedLocId) || locations[0];
    const spikeDb = loc.thresholdDb + 18; // deliberate 18 dB breach!
    try {
      const reading = await api.addReading({
        locationId: loc.id,
        noiseDb: spikeDb,
        source: 'IOT_SENSOR',
      });
      setLastFeed(prev => [reading, ...prev.slice(0, 5)]);
      onNewReading(reading);
      if (onAlertTriggered) onAlertTriggered();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white">ESP32 / IoT Sound Sensor Telemetry Simulator</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
            <Wifi className="w-3 h-3" /> Wi-Fi Connected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isRunning ? 'Pause Feed' : 'Resume Feed'}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Trigger Alert Test:</span>
          <select
            value={selectedLocId}
            onChange={(e) => setSelectedLocId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name.split(' (')[0].split(' - ')[0]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleInjectSpike}
          className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-rose-400" />
          Simulate Sudden +18 dB Noise Spike
        </button>
      </div>

      {lastFeed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
          <span className="font-semibold text-slate-300">Recent Telemetry:</span>
          {lastFeed.slice(0, 3).map((r) => (
            <span key={r.id} className="font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              {r.locationName?.slice(0, 15)}: <strong>{r.noiseDb} dB</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
