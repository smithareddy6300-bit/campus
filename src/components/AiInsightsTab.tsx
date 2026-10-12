import React, { useState } from 'react';
import { CampusLocation, NoiseReport } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  Bot,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Send,
  RefreshCw
} from 'lucide-react';

interface AiInsightsTabProps {
  locations: CampusLocation[];
  reports: NoiseReport[];
}

export const AiInsightsTab: React.FC<AiInsightsTabProps> = ({ locations, reports }) => {
  // Feature 1: Report classification tester
  const [testText, setTestText] = useState('Heavy diesel construction backhoe excavating pathway right next to lecture hall 101');
  const [classifyResult, setClassifyResult] = useState<{ category: string; confidence: number; reason: string } | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Feature 2: Zone complaint summary
  const [selectedZoneId, setSelectedZoneId] = useState<string>(locations[0]?.id || 'loc-1');
  const [zoneSummaryResult, setZoneSummaryResult] = useState<{ summary: string; topFactor?: string; recommendations: string[] } | null>(null);
  const [isSummarizingZone, setIsSummarizingZone] = useState(false);

  // Feature 3: Weekly Executive Summary
  const [weeklySummary, setWeeklySummary] = useState<{
    title: string;
    executiveSummary: string;
    keyHotspots: string[];
    recommendedInterventions: string[];
  } | null>(null);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

  // Handle classify
  const handleClassify = async () => {
    if (!testText.trim()) return;
    setIsClassifying(true);
    try {
      const res = await api.classifyDescription(testText);
      setClassifyResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsClassifying(false);
    }
  };

  // Handle zone summary
  const handleZoneSummary = async () => {
    setIsSummarizingZone(true);
    try {
      const res = await api.getZoneAiSummary(selectedZoneId);
      setZoneSummaryResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizingZone(false);
    }
  };

  // Handle weekly briefing
  const handleWeeklySummary = async () => {
    setIsGeneratingWeekly(true);
    try {
      const res = await api.getWeeklyAiSummary();
      setWeeklySummary(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Architecture Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              LangChain4j & Google Gemini Intelligence Layer
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Operational Assistance Workbench
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Provides non-binding natural language summaries, disturbance classification, and actionable acoustic interventions for campus facilities teams.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 max-w-xs space-y-1">
            <span className="font-semibold text-emerald-400">Safety & Reliability Principle:</span>
            <p>
              AI output is labeled as AI-generated, stored with a timestamp, and reviewed by administrators. Never used for automatic student disciplinary action.
            </p>
          </div>
        </div>

        {/* AI Processing Flow Diagram (Matches PDF Page 9) */}
        <div className="pt-3 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Operational AI Processing Flow
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-bold text-slate-200">1. Report Data</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Validated DB facts</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-bold text-indigo-300">2. Spring Boot</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Build prompt & context</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-bold text-indigo-400">3. LangChain4j</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Model invocation</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="font-bold text-emerald-400">4. AI Output</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Advisory suggestions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Zone Complaint Summarizer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Zone Complaint & Trend Summarizer
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Feature 2 (PDF p. 9)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Synthesizes multiple individual student reports from a single campus zone to detect recurring equipment or human noise patterns.
          </p>

          <div className="flex gap-2">
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleZoneSummary}
              disabled={isSummarizingZone}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSummarizingZone ? 'Synthesizing...' : 'Summarize Zone'}
            </button>
          </div>

          {zoneSummaryResult ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="font-semibold text-slate-200">{zoneSummaryResult.summary}</div>
              {zoneSummaryResult.topFactor && (
                <div className="text-[11px] text-indigo-300">
                  <strong>Dominant Root Cause:</strong> {zoneSummaryResult.topFactor}
                </div>
              )}
              {zoneSummaryResult.recommendations?.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="font-semibold text-emerald-400">Suggested Mitigations:</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {zoneSummaryResult.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
              Select a zone and click "Summarize Zone" to test the LangChain4j synthesizer.
            </div>
          )}
        </div>

        {/* Module 2: Text Classification Tester */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              Report Classification Sandbox
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Feature 1 (PDF p. 9)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automatically maps unstructured student complaints into standardized noise categories: <code>traffic</code>, <code>construction</code>, <code>event</code>, <code>crowd</code>, <code>equipment</code>, or <code>other</code>.
          </p>

          <div className="space-y-2">
            <textarea
              rows={2}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Test different keywords (generators, lawn mower, cheering crowd)</span>
              <button
                onClick={handleClassify}
                disabled={isClassifying}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {isClassifying ? 'Classifying...' : 'Run Classifier'}
              </button>
            </div>
          </div>

          {classifyResult ? (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-[11px]">Inferred Category:</div>
                <div className="font-bold text-indigo-300 uppercase text-sm mt-0.5">
                  {classifyResult.category}
                </div>
                <div className="text-slate-400 text-[11px] mt-1">{classifyResult.reason}</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                  {Math.round(classifyResult.confidence * 100)}% match
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
              Run classifier to view prompt output and categorization logic.
            </div>
          )}
        </div>
      </div>

      {/* Module 3: Weekly Executive Summary Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Weekly Campus Acoustic Environmental Briefing
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates executive summary for college leadership and facilities committee.
            </p>
          </div>
          <button
            onClick={handleWeeklySummary}
            disabled={isGeneratingWeekly}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingWeekly ? 'animate-spin' : ''}`} />
            {isGeneratingWeekly ? 'Compiling Briefing...' : 'Generate Weekly Digest'}
          </button>
        </div>

        {weeklySummary ? (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-indigo-200">{weeklySummary.title}</h4>
              <span className="text-[10px] text-slate-500 font-mono">LangChain4j Service Output</span>
            </div>

            <p className="text-slate-300 leading-relaxed">{weeklySummary.executiveSummary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div className="space-y-1.5">
                <span className="font-semibold text-rose-300">Identified Hotspots:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  {weeklySummary.keyHotspots?.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-emerald-300">Recommended Interventions:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  {weeklySummary.recommendedInterventions?.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500 space-y-2">
            <p>Click "Generate Weekly Digest" to aggregate campus reports into an executive brief.</p>
          </div>
        )}
      </div>
    </div>
  );
};
