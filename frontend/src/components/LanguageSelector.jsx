import React from 'react';
import { Globe, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_DISPLAY_NAMES } from '../utils/formatters';

export default function LanguageSelector({
  value = 'indic-auto',
  onChange,
  autoDetect = true,
  onAutoDetectToggle,
  label = 'Spoken Language',
}) {
  const { languages } = useApp();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          {label}
        </label>

        {onAutoDetectToggle && (
          <button
            type="button"
            onClick={() => onAutoDetectToggle(!autoDetect)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              autoDetect
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Auto-Detect
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={autoDetect ? 'indic-auto' : value}
          onChange={(e) => {
            const selected = e.target.value;
            if (selected === 'indic-auto') {
              if (onAutoDetectToggle) onAutoDetectToggle(true);
            } else {
              if (onAutoDetectToggle) onAutoDetectToggle(false);
            }
            if (onChange) onChange(selected);
          }}
          className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer font-medium appearance-none"
        >
          <option value="indic-auto">
            ✨ Auto Language Identification (indic-auto)
          </option>
          <optgroup label="Supported Indian Languages">
            {languages.map((lang) => {
              const meta = LANGUAGE_DISPLAY_NAMES[lang.code] || { name: lang.name, native: lang.native_name };
              return (
                <option key={lang.code} value={lang.code}>
                  {meta.flag || '🇮🇳'} {meta.name} — {meta.native} ({lang.code})
                </option>
              );
            })}
          </optgroup>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Prisma v3.0 accurately detects and transcribes all 10 Indian regional languages and code-mixed speech.
      </p>
    </div>
  );
}
