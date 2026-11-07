import React, { useState } from 'react';
import {
  FileText,
  ListOrdered,
  CheckSquare,
  HelpCircle,
  Tag,
  Users,
  GraduationCap,
  Copy,
  Check,
  Sparkles,
  Download,
} from 'lucide-react';
import VoxApi from '../services/api';

export default function SmartNotesView({ notes, transcriptId }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [actionItemStatus, setActionItemStatus] = useState({});

  if (!notes) {
    return (
      <div className="p-8 text-center text-slate-500 glass-panel rounded-2xl">
        <Sparkles className="w-8 h-8 text-indigo-400/50 mx-auto mb-2" />
        <p className="text-sm">No smart notes generated yet. Click "Generate Smart Notes" to analyze this transcript.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'key_points', label: 'Key Points', icon: ListOrdered },
    { id: 'action_items', label: 'Action Items', icon: CheckSquare },
    { id: 'meeting', label: 'Meeting Notes', icon: Users },
    { id: 'lecture', label: 'Lecture Notes', icon: GraduationCap },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'keywords', label: 'Keywords', icon: Tag },
  ];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAction = (idx) => {
    setActionItemStatus((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const keyPoints = Array.isArray(notes.key_points) ? notes.key_points : [];
  const actionItems = Array.isArray(notes.action_items) ? notes.action_items : [];
  const questions = Array.isArray(notes.questions) ? notes.questions : [];
  const keywords = Array.isArray(notes.keywords) ? notes.keywords : [];

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Header bar */}
      <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Smart Notes</h3>
            <p className="text-[11px] text-slate-400">
              Provider: <span className="text-indigo-400 font-medium">{notes.provider || 'Built-in'}</span>
            </p>
          </div>
        </div>

        {transcriptId && (
          <div className="flex items-center gap-2">
            <a
              href={VoxApi.getPdfDownloadUrl(transcriptId)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              PDF Export
            </a>
            <a
              href={VoxApi.getTxtDownloadUrl(transcriptId)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-violet-400" />
              TXT Export
            </a>
          </div>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/60 px-4 py-2 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content area */}
      <div className="p-6">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Executive Short Summary
                </span>
                <button
                  onClick={() => handleCopy(notes.summary || '')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {notes.summary || 'No summary available.'}
              </p>
            </div>

            {notes.detailed_summary && (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/70">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Detailed Synthesis
                </span>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {notes.detailed_summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Key Points Tab */}
        {activeTab === 'key_points' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-3">
              Core Takeaways ({keyPoints.length})
            </span>
            {keyPoints.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{pt}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Items Tab */}
        {activeTab === 'action_items' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-3">
              Tasks &amp; Action Items ({actionItems.length})
            </span>
            {actionItems.map((act, idx) => {
              const checked = !!actionItemStatus[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleAction(idx)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    checked
                      ? 'bg-emerald-950/20 border-emerald-500/30 line-through opacity-75'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-emerald-500/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="mt-1 rounded text-emerald-500 focus:ring-emerald-500/20 bg-slate-800 border-slate-700"
                  />
                  <span className={`text-sm ${checked ? 'text-slate-400' : 'text-slate-200'}`}>
                    {act}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Meeting Notes Tab */}
        {activeTab === 'meeting' && (
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Structured Meeting Notes
              </span>
              <button
                onClick={() => handleCopy(notes.meeting_notes || '')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Notes
              </button>
            </div>
            <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {notes.meeting_notes || 'No meeting notes generated.'}
            </div>
          </div>
        )}

        {/* Lecture Notes Tab */}
        {activeTab === 'lecture' && (
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Academic &amp; Lecture Summary
              </span>
              <button
                onClick={() => handleCopy(notes.lecture_notes || '')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Lecture
              </button>
            </div>
            <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {notes.lecture_notes || 'No lecture notes generated.'}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-3">
              Important Questions &amp; Inquiries ({questions.length})
            </span>
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-amber-500/30 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-200 font-medium">{q}</p>
              </div>
            ))}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-4">
              Key Topics &amp; Terminologies
            </span>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
