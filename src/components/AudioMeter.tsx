import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle, Sliders, CheckCircle2 } from 'lucide-react';

interface AudioMeterProps {
  onCaptureDb?: (db: number) => void;
  initialDb?: number;
}

export const AudioMeter: React.FC<AudioMeterProps> = ({ onCaptureDb, initialDb = 48 }) => {
  const [isListening, setIsListening] = useState(false);
  const [currentDb, setCurrentDb] = useState(initialDb);
  const [peakDb, setPeakDb] = useState(initialDb);
  const [calibrationOffset, setCalibrationOffset] = useState(0); // +/- dB trim
  const [simulationMode, setSimulationMode] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startMicrophone = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      setSimulationMode(false);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute RMS
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Normalize to estimated dB SPL (ambient baseline ~ 30 dB up to 100 dB)
        // dB ~ 20 * log10(rms) with scaling
        const rawNorm = rms > 0 ? 20 * Math.log10(rms / 255) : -100;
        // Map -50 dBFS to ~30 dB SPL, 0 dBFS to ~95 dB SPL
        let calculatedSpl = Math.max(28, Math.min(105, Math.round(95 + rawNorm * 1.3 + calibrationOffset)));

        setCurrentDb(calculatedSpl);
        setPeakDb(prev => Math.max(prev, calculatedSpl));

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err: unknown) {
      console.warn('Microphone access unavailable or denied, falling back to simulated acoustic meter:', err);
      const errMsg = err instanceof Error ? err.message : 'Microphone unavailable';
      setMicError(`Hardware mic unavailable (${errMsg}). Using acoustic sensor simulator.`);
      setSimulationMode(true);
      setIsListening(true);
    }
  };

  const stopMicrophone = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  // Simulation mode jitter
  useEffect(() => {
    if (!simulationMode || !isListening) return;
    const interval = setInterval(() => {
      setCurrentDb(prev => {
        const jitter = (Math.random() - 0.5) * 4;
        const next = Math.max(30, Math.min(95, Math.round(prev + jitter)));
        setPeakDb(p => Math.max(p, next));
        return next;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [simulationMode, isListening]);

  // Color coding by noise level
  const getLevelColor = (db: number) => {
    if (db <= 35) return 'text-emerald-600 bg-emerald-50 border-emerald-300';
    if (db <= 50) return 'text-teal-600 bg-teal-50 border-teal-300';
    if (db <= 65) return 'text-amber-600 bg-amber-50 border-amber-300';
    if (db <= 75) return 'text-orange-600 bg-orange-50 border-orange-300';
    return 'text-rose-600 bg-rose-50 border-rose-300';
  };

  const getMeterBarColor = (db: number) => {
    if (db <= 35) return 'bg-emerald-500';
    if (db <= 50) return 'bg-teal-500';
    if (db <= 65) return 'bg-amber-500';
    if (db <= 75) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const setPresetLevel = (db: number) => {
    setCurrentDb(db);
    setPeakDb(p => Math.max(p, db));
    setSimulationMode(true);
    setIsListening(true);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Live Acoustic Sound Meter</h4>
            <p className="text-xs text-slate-400">Browser Web Audio API decibel analyzer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isListening ? (
            <button
              onClick={stopMicrophone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
            >
              <MicOff className="w-3.5 h-3.5" /> Stop Meter
            </button>
          ) : (
            <button
              onClick={startMicrophone}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            >
              <Mic className="w-3.5 h-3.5" /> Start Live Meter
            </button>
          )}
        </div>
      </div>

      {micError && (
        <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Main dB Display */}
      <div className="flex items-baseline justify-between mb-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-mono font-bold tracking-tight text-white">{currentDb}</span>
            <span className="text-lg font-medium text-slate-400">dB(A)</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentDb <= 35 && '🟢 Quiet Study / Meets WHO 35 dB Standard'}
            {currentDb > 35 && currentDb <= 50 && '🟡 Moderate Ambient Noise'}
            {currentDb > 50 && currentDb <= 65 && '🟠 Noticeable Conversation / Activity'}
            {currentDb > 65 && currentDb <= 75 && '🔴 Loud / Potential Teaching Disruption'}
            {currentDb > 75 && '⚠️ Severe Disruption / Critical Alert Zone'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Peak Recorded</div>
          <div className="text-xl font-mono font-semibold text-indigo-300">{peakDb} dB</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">WHO Ref: 35 dB</div>
        </div>
      </div>

      {/* Visual Bar Meter */}
      <div className="space-y-1.5 mb-4">
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-150 ${getMeterBarColor(currentDb)}`}
            style={{ width: `${Math.min(100, Math.max(5, ((currentDb - 25) / 75) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5 font-mono">
          <span>25 dB</span>
          <span className="text-emerald-400 font-semibold">| 35 dB (WHO)</span>
          <span>50 dB</span>
          <span>65 dB</span>
          <span>80 dB</span>
          <span className="text-rose-400">100 dB</span>
        </div>
      </div>

      {/* Acoustic Presets for testing & simulation */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Quick Sim:</span>
          <button
            type="button"
            onClick={() => setPresetLevel(34)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
          >
            Library (34 dB)
          </button>
          <button
            type="button"
            onClick={() => setPresetLevel(52)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
          >
            Lecture (52 dB)
          </button>
          <button
            type="button"
            onClick={() => setPresetLevel(72)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
          >
            Cafeteria (72 dB)
          </button>
          <button
            type="button"
            onClick={() => setPresetLevel(84)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200"
          >
            Construction (84 dB)
          </button>
        </div>

        {onCaptureDb && (
          <button
            type="button"
            onClick={() => onCaptureDb(currentDb)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Use {currentDb} dB in Report
          </button>
        )}
      </div>
    </div>
  );
};
