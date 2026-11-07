import React from 'react';
import { LANGUAGE_DISPLAY_NAMES } from '../utils/formatters';

export default function StatusBadge({ type = 'language', value }) {
  if (!value) return null;

  if (type === 'language') {
    const meta = LANGUAGE_DISPLAY_NAMES[value] || { name: value, native: '', flag: '🇮🇳' };
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
        <span>{meta.flag}</span>
        <span>{meta.name}</span>
        {meta.native && <span className="text-[11px] text-indigo-400/80 font-normal">({meta.native})</span>}
      </span>
    );
  }

  if (type === 'mode') {
    const colors = {
      transcribe: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      verbatim: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      codemix: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
      transliterate: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${colors[value] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
        {value}
      </span>
    );
  }

  if (type === 'status') {
    const isCompleted = value === 'completed';
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isCompleted
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
        {value}
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
      {value}
    </span>
  );
}
