import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Sparkles,
  Radio,
  FileAudio,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  FileText,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_DISPLAY_NAMES, OUTPUT_MODE_INFO } from '../utils/formatters';

export default function LandingPage() {
  const { languages, health } = useApp();
  const isGnaniConfigured = health?.gnani?.configured;

  const features = [
    {
      icon: Cpu,
      title: 'Gnani Prisma v3.0 Powered',
      description:
        'Engineered for Indian accents, multilingual code-mixed conversations, and telephone quality audio.',
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400',
    },
    {
      icon: Radio,
      title: 'Real-Time WebSocket Streaming',
      description:
        'Live low-latency voice-to-text with continuous speech recognition and instant incremental transcription.',
      color: 'from-violet-500/20 to-purple-500/20 text-violet-400',
    },
    {
      icon: Layers,
      title: '4 Flexible Output Modes',
      description:
        'Seamlessly switch between Transcribe (ITN), Verbatim speech, Code-Mix (Hinglish), and Transliteration.',
      color: 'from-pink-500/20 to-rose-500/20 text-pink-400',
    },
    {
      icon: Sparkles,
      title: 'AI Smart Notes Generator',
      description:
        'Instant synthesis into 8 structured categories: Summaries, Key Points, Action Items, Meeting & Lecture notes.',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Record or Upload',
      desc: 'Speak directly into your microphone or upload audio files in WAV, MP3, M4A, FLAC, or OGG.',
    },
    {
      step: '02',
      title: 'Prisma v3.0 Recognition',
      desc: 'Automatic language identification analyzes Indic dialects, bilingual code-mixing, and converts speech.',
    },
    {
      step: '03',
      title: 'Smart Notes & Export',
      desc: 'Get immediate action items, structured agendas, study notes, and download comprehensive PDF or TXT reports.',
    },
  ];

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="text-center relative max-w-4xl mx-auto px-4 pt-12 pb-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/20 to-pink-500/10 blur-3xl rounded-full -z-10 pointer-events-none" />

        {/* Engine Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen Indic Speech AI &bull; Gnani Prisma v3.0</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Turn Every Voice Into <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
            Intelligent Notes
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          VoxNote AI transcribes 10 Indian regional languages and code-mixed speech with exceptional accuracy.
          Generate actionable meeting summaries, study notes, and PDF reports instantly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/app/transcribe"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
          >
            <FileAudio className="w-4 h-4" />
            <span>Upload Audio File</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/app/live"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
            <span>Live Microphone Stream</span>
          </Link>
        </div>

        {/* API Status Alert if unconfigured */}
        {!isGnaniConfigured && (
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left max-w-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>
              Gnani API Key is not set in <code className="bg-slate-950 px-1 py-0.5 rounded">backend/.env</code>. Set your key to unlock live streaming and transcription!
            </span>
          </div>
        )}
      </section>

      {/* Supported Languages Showcase */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Multilingual Indic Speech Support
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Prisma v3.0 recognizes 10 distinct Indian languages, regional accents, and Hinglish code-mixing.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {languages.map((lang) => {
            const meta = LANGUAGE_DISPLAY_NAMES[lang.code] || { name: lang.name, native: lang.native_name, flag: '🇮🇳' };
            return (
              <div
                key={lang.code}
                className="glass-panel glass-panel-hover p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{meta.flag}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {lang.code}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{meta.name}</h4>
                  <p className="text-sm text-indigo-400 font-medium font-sans">{meta.native}</p>
                </div>
                {lang.sample_text && (
                  <p className="text-[11px] text-slate-500 mt-2 truncate font-sans">
                    "{lang.sample_text}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Modern Voice Intelligence Architecture
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Designed for developers, enterprises, students, and professionals who need accurate notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 transition-all flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal flex-1">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Prisma Output Modes Section */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Prisma v3.0 Capabilities
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Four Specialized Output Modes
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(OUTPUT_MODE_INFO).map(([key, info]) => (
              <div key={key} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white capitalize">{info.label}</h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {info.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-sm text-slate-400">Three streamlined steps from raw voice to structured insight.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((st, idx) => (
            <div key={idx} className="relative p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col">
              <span className="text-3xl font-black text-indigo-500/40 mb-3 font-mono">{st.step}</span>
              <h3 className="text-base font-semibold text-white mb-2">{st.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Banner */}
      <section className="max-w-4xl mx-auto px-4 text-center pb-12">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-violet-900/30 to-slate-900 border border-indigo-500/30">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to experience intelligent transcription?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6">
            Get started with VoxNote AI and turn speech across 10 Indian languages into intelligent notes.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm transition-all shadow-lg"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
