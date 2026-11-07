import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Layers,
  Cpu,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Volume2,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_DISPLAY_NAMES, OUTPUT_MODE_INFO } from '../utils/formatters';

export default function SettingsPage() {
  const { userSettings, updateSettings, health, languages } = useApp();

  const [formState, setFormState] = useState({ ...userSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isGnaniConfigured = health?.gnani?.configured;
  const summaryProvider = health?.summary_provider || { provider: 'built-in', configured: false };
  const dbStatus = health?.database?.status || 'connected';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your speech transcription preferences, language defaults, and inspect API connections.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Transcription Defaults */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-indigo-400" />
            Transcription Defaults
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Default Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Default Language</label>
              <select
                value={formState.defaultLanguage}
                onChange={(e) => setFormState({ ...formState, defaultLanguage: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="indic-auto">✨ Automatic Language Identification (indic-auto)</option>
                {languages.map((l) => {
                  const meta = LANGUAGE_DISPLAY_NAMES[l.code] || { name: l.name, native: l.native_name };
                  return (
                    <option key={l.code} value={l.code}>
                      {meta.name} — {meta.native} ({l.code})
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-500">
                Preferred language for batch jobs and initial dropdown selections.
              </p>
            </div>

            {/* Default Output Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Default Output Mode</label>
              <select
                value={formState.defaultOutputMode}
                onChange={(e) => setFormState({ ...formState, defaultOutputMode: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="transcribe">Transcribe (ITN - Numbers &amp; Dates Formatted)</option>
                <option value="verbatim">Verbatim (Exact Phonetic Speech)</option>
                <option value="codemix">Code-Mix (Native Script + Latin English)</option>
                <option value="transliterate">Transliterate (Latin Script Hinglish)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                {OUTPUT_MODE_INFO[formState.defaultOutputMode]?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Audio Capture Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="w-4 h-4 text-violet-400" />
            Audio Streaming Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">Streaming Protocol</span>
              <span className="font-semibold text-white font-mono">WebSocket (WSS)</span>
              <span className="text-[11px] text-slate-500 block mt-1">Chunk size 1024 bytes</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">Sampling Rate</span>
              <span className="font-semibold text-white font-mono">16,000 Hz (16 kHz)</span>
              <span className="text-[11px] text-slate-500 block mt-1">16-bit Linear PCM Mono</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">Voice Activity (VAD)</span>
              <span className="font-semibold text-emerald-400">Server-Side VAD</span>
              <span className="text-[11px] text-slate-500 block mt-1">Automatic segment boundary</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Backend & API Connection Status */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Backend API Connection Status
        </h3>

        <div className="space-y-3">
          {/* Gnani AI Connection */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">Gnani AI Prisma v3.0</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Speech-to-Text
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Model: <strong className="text-slate-300 font-mono">prisma-v3.0</strong> &bull; Endpoint: <span className="font-mono text-slate-400">api.vachana.ai</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Key status: <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-400">{isGnaniConfigured ? 'gn_••••••••••••' : 'Unconfigured in backend/.env'}</code>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isGnaniConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active &amp; Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Key Required
                </span>
              )}
            </div>
          </div>

          {/* Smart Notes Provider */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">Smart Notes Engine</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  Summarizer
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Active Provider: <strong className="text-slate-200 capitalize">{summaryProvider.provider}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Configured: {summaryProvider.configured ? 'External API active' : 'Local structured NLP extraction fallback active'}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Operational
            </span>
          </div>

          {/* SQLite Database */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">SQLite Database</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Storage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                File: <span className="font-mono text-slate-300">backend/voxnote.db</span>
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Application Information */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-400">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          About VoxNote AI
        </h3>
        <p>
          <strong>VoxNote AI</strong> is an enterprise-grade audio transcription and smart notes generator built specifically for the linguistic diversity of India.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px]">
          <div>
            <span className="text-slate-500 block">Version:</span>
            <span className="font-mono text-slate-300">1.0.0</span>
          </div>
          <div>
            <span className="text-slate-500 block">Gnani SDK:</span>
            <span className="font-mono text-slate-300">gnani-vachana 0.9.0</span>
          </div>
          <div>
            <span className="text-slate-500 block">STT Model:</span>
            <span className="font-mono text-slate-300">Prisma v3.0</span>
          </div>
          <div>
            <span className="text-slate-500 block">Supported Languages:</span>
            <span className="font-mono text-slate-300">10 Indic Dialects</span>
          </div>
        </div>
      </div>
    </div>
  );
}
