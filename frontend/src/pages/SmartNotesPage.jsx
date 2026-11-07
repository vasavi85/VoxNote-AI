import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileAudio,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import VoxApi from '../services/api';
import SmartNotesView from '../components/SmartNotesView';
import { useApp } from '../context/AppContext';

export default function SmartNotesPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { health } = useApp();

  const transcriptIdParam = searchParams.get('id');
  const initialText = location.state?.rawText || '';
  const initialNotes = location.state?.notes || null;

  const [transcriptsList, setTranscriptsList] = useState([]);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState(transcriptIdParam || '');
  const [inputText, setInputText] = useState(initialText);
  const [notes, setNotes] = useState(initialNotes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load previous transcripts list
  useEffect(() => {
    VoxApi.getTranscripts({ limit: 50 })
      .then((data) => {
        if (data?.transcripts) {
          setTranscriptsList(data.transcripts);
          // If transcriptIdParam was provided, select it and fetch its notes
          if (transcriptIdParam) {
            handleSelectTranscript(transcriptIdParam);
          }
        }
      })
      .catch(console.error);
  }, [transcriptIdParam]);

  const handleSelectTranscript = async (id) => {
    setSelectedTranscriptId(id);
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await VoxApi.getTranscript(id);
      if (data?.transcript_text) {
        setInputText(data.transcript_text);
      }
      if (data?.notes && data.notes.length > 0) {
        setNotes(data.notes[0]);
      } else {
        // Automatically generate if not yet generated
        const generated = await VoxApi.generateSummary({ transcript_id: id });
        setNotes(generated);
      }
    } catch (err) {
      setError('Could not load transcript: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setError('Please provide transcript text to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = selectedTranscriptId
        ? { transcript_id: selectedTranscriptId }
        : { text: inputText.trim() };

      const generated = await VoxApi.generateSummary(payload);
      setNotes(generated);
    } catch (err) {
      setError(err.message || 'Failed to generate smart notes.');
    } finally {
      setIsLoading(false);
    }
  };

  const providerInfo = health?.summary_provider || { provider: 'built-in', configured: false };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AI Smart Notes &amp; Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated intelligence extraction for meeting agendas, action items, core concepts, and questions.
          </p>
        </div>

        {/* Provider Indicator Pill */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Engine: <strong>{providerInfo.provider}</strong></span>
          </span>
        </div>
      </div>

      {/* Input Selector & Text Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileAudio className="w-4 h-4 text-indigo-400" />
            Select Transcript or Input Custom Text
          </label>

          {transcriptsList.length > 0 && (
            <select
              value={selectedTranscriptId}
              onChange={(e) => handleSelectTranscript(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">-- Or choose from previous transcripts --</option>
              {transcriptsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.filename} ({t.detected_language || t.language})
                </option>
              ))}
            </select>
          )}
        </div>

        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setSelectedTranscriptId('');
          }}
          placeholder="Paste or type any transcript text in English, Hindi, Tamil, Telugu, etc..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y font-sans leading-relaxed"
        />

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">
            {inputText.split(/\s+/).filter(Boolean).length} words
          </span>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!inputText.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing Smart Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Smart Notes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Structured Smart Notes Display */}
      {notes && (
        <SmartNotesView notes={notes} transcriptId={selectedTranscriptId || null} />
      )}
    </div>
  );
}
