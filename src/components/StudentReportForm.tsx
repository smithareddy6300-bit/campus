import React, { useState } from 'react';
import { CampusLocation, NoiseCategory, MeasurementSource, NoiseReport } from '../types';
import { AudioMeter } from './AudioMeter';
import { api } from '../services/api';
import { Send, Sparkles, CheckCircle2, AlertOctagon, HelpCircle, MapPin, Tag, FileText, Info } from 'lucide-react';

interface StudentReportFormProps {
  locations: CampusLocation[];
  currentUserId: string | null;
  onOpenLogin?: () => void;
  onReportSubmitted: (newReport: NoiseReport) => void;
}

export const StudentReportForm: React.FC<StudentReportFormProps> = ({
  locations,
  currentUserId,
  onOpenLogin,
  onReportSubmitted,
}) => {
  const [locationId, setLocationId] = useState<string>(locations[0]?.id || 'loc-1');
  const [noiseDb, setNoiseDb] = useState<number>(55);
  const [category, setCategory] = useState<NoiseCategory>('equipment');
  const [description, setDescription] = useState<string>('');
  const [source, setSource] = useState<MeasurementSource>('STUDENT_MIC');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string; confidence: number; reason: string } | null>(null);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; report?: NoiseReport; error?: string } | null>(null);

  const selectedLocation = locations.find(l => l.id === locationId) || locations[0];
  const isThresholdBreached = selectedLocation && noiseDb > selectedLocation.thresholdDb;
  const excessAmount = selectedLocation ? noiseDb - selectedLocation.thresholdDb : 0;

  const handleClassify = async () => {
    if (!description.trim()) return;
    setIsClassifying(true);
    try {
      const result = await api.classifyDescription(description);
      setAiSuggestion(result);
      if (['traffic', 'construction', 'event', 'crowd', 'equipment', 'other'].includes(result.category)) {
        setCategory(result.category as NoiseCategory);
      }
    } catch (err) {
      console.error('Classification error:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    if (!description.trim()) {
      alert('Please provide a short description of the noise incident.');
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const report = await api.createReport({
        userId: currentUserId,
        locationId,
        noiseDb,
        category,
        description,
        source,
      });

      setSubmitResult({ success: true, report });
      onReportSubmitted(report);
      setDescription('');
      setAiSuggestion(null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to submit report';
      setSubmitResult({ success: false, error: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner / Instructions */}
      <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-900 rounded-2xl p-6 border border-indigo-500/20 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              Student Incident Submission
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Report Campus Noise Disturbance</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Log ambient noise levels to help campus administration protect study environments and enforce WHO classroom acoustic standards (35 dB).
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 text-xs space-y-1">
            <div className="text-slate-400 font-medium">Standard Acoustic Guidelines:</div>
            <div className="text-emerald-400">✓ WHO Classroom Limit: 35 dB(A)</div>
            <div className="text-indigo-300">✓ Study Lounge Baseline: 45 dB(A)</div>
            <div className="text-amber-400">✓ Cafeteria Tolerance: 65 dB(A)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Live Decibel Meter */}
        <div className="lg:col-span-5 space-y-4">
          <AudioMeter
            initialDb={noiseDb}
            onCaptureDb={(db) => {
              setNoiseDb(db);
              setSource('STUDENT_MIC');
            }}
          />

          {/* Quick tips card */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Reporting Protocol</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              1. Measure noise at table level away from direct laptop fans.<br />
              2. Describe the disturbance source (e.g., jackhammer, idling bus, group speech).<br />
              3. Reports exceeding the location threshold will trigger an administrative notification automatically.
            </p>
          </div>
        </div>

        {/* Right Col: Report Submission Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5 text-slate-200">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Incident Details
            </h3>

            {/* Location selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Campus Zone / Building
                </span>
                {selectedLocation && (
                  <span className="text-[11px] text-indigo-300 font-mono">
                    Limit: {selectedLocation.thresholdDb} dB ({selectedLocation.zoneType})
                  </span>
                )}
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} — Limit: {loc.thresholdDb} dB ({loc.zoneType})
                  </option>
                ))}
              </select>
              {selectedLocation && (
                <p className="text-[11px] text-slate-400 mt-1">{selectedLocation.description}</p>
              )}
            </div>

            {/* Decibel value slider & threshold status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Approximate Noise Level (dB)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-white">{noiseDb} dB</span>
                  {isThresholdBreached ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" /> +{excessAmount} dB breach
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      Within limit
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="30"
                max="105"
                value={noiseDb}
                onChange={(e) => setNoiseDb(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>30 dB (Quiet)</span>
                <span>50 dB (Conversational)</span>
                <span>70 dB (Loud)</span>
                <span>90+ dB (Extreme)</span>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" /> Disturbance Category
                </label>
                {aiSuggestion && (
                  <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI classified with {Math.round(aiSuggestion.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['traffic', 'construction', 'event', 'crowd', 'equipment', 'other'] as NoiseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all text-left flex items-center justify-between ${
                      category === cat
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{cat}</span>
                    {category === cat && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Description textarea with AI Classifier assist */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Incident Description
                </label>
                <button
                  type="button"
                  onClick={handleClassify}
                  disabled={!description.trim() || isClassifying}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {isClassifying ? 'Analyzing text...' : 'Auto-classify category'}
                </button>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Concrete drilling machine operating directly below the library second-floor windows during mid-day reading hours..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {aiSuggestion && (
                <div className="mt-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
                  <span><strong>AI Match:</strong> {aiSuggestion.reason}</span>
                  <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/30">{aiSuggestion.category}</span>
                </div>
              )}
            </div>

            {/* Measurement source selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Measurement Source / Sensor Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'STUDENT_MIC', label: 'Browser Live Mic' },
                  { id: 'PHONE_SENSOR', label: 'Smartphone Meter App' },
                  { id: 'MANUAL_ESTIMATE', label: 'Manual Ear Estimation' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSource(item.id as MeasurementSource)}
                    className={`py-2 px-2.5 text-center rounded-xl text-xs font-medium border transition-all ${
                      source === item.id
                        ? 'bg-slate-800 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Transmitting to Spring Boot Backend...</span>
                ) : !currentUserId ? (
                  <>
                    <Send className="w-4 h-4" />
                    Sign In to Submit Report
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Noise Report
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Submission Feedback Banner */}
          {submitResult && (
            <div
              className={`mt-4 p-4 rounded-xl border text-sm transition-all ${
                submitResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              {submitResult.success ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Report Submitted Successfully! (ID: {submitResult.report?.id})
                  </div>
                  <p className="text-xs text-emerald-300/80">
                    Your report has been logged to MySQL and queued in the administrative review workflow.
                    {submitResult.report?.hasAlert && (
                      <span className="block text-amber-300 font-semibold mt-1">
                        ⚠️ Level exceeded threshold ({submitResult.report.noiseDb} dB). Automatic alert generated for campus facilities team.
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>Submission Error: {submitResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
