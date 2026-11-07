import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  FileAudio,
  Sparkles,
  Calendar,
  X,
  Copy,
  Check,
} from 'lucide-react';
import VoxApi from '../services/api';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatDuration, getLanguageName } from '../utils/formatters';

export default function TranscriptHistoryPage() {
  const { languages } = useApp();
  const [transcripts, setTranscripts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedLanguage !== 'all') params.language = selectedLanguage;

      const data = await VoxApi.getTranscripts(params);
      if (data?.transcripts) {
        setTranscripts(data.transcripts);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTranscripts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedLanguage]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this transcript?')) return;
    try {
      await VoxApi.deleteTranscript(id);
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedTranscript?.id === id) {
        setSelectedTranscript(null);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Transcript History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, export, and inspect your recordings stored in the local SQLite database.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          Total: <strong className="text-white">{total}</strong> records
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search filename or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full sm:w-56 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            <option value="all">All Languages</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.native_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading transcripts from database...
        </div>
      ) : transcripts.length === 0 ? (
        <div className="p-16 text-center text-slate-500 glass-panel rounded-2xl">
          <FileAudio className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-300">No transcripts found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or language filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {transcripts.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedTranscript(item)}
              className="glass-panel glass-panel-hover p-4 rounded-xl border border-slate-800 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-white truncate max-w-md">
                    {item.filename}
                  </span>
                  <StatusBadge type="language" value={item.detected_language || item.language} />
                  <StatusBadge type="mode" value={item.output_mode} />
                </div>
                <p className="text-xs text-slate-400 truncate max-w-2xl font-sans">
                  {item.transcript_text ? `"${item.transcript_text.substring(0, 140)}..."` : 'No text'}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                  <span>Duration: {formatDuration(item.duration)}</span>
                  <span>&bull;</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                <Link
                  to={`/app/notes?id=${item.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Smart Notes</span>
                </Link>

                <a
                  href={VoxApi.getPdfDownloadUrl(item.id)}
                  download
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTranscript && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {selectedTranscript.filename}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(selectedTranscript.created_at)} &bull; {formatDuration(selectedTranscript.duration)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge type="language" value={selectedTranscript.detected_language || selectedTranscript.language} />
                <StatusBadge type="mode" value={selectedTranscript.output_mode} />
                <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                  Model: {selectedTranscript.model}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Transcript Text
                  </span>
                  <button
                    onClick={() => handleCopy(selectedTranscript.transcript_text)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {selectedTranscript.transcript_text}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={VoxApi.getPdfDownloadUrl(selectedTranscript.id)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </a>
                <a
                  href={VoxApi.getTxtDownloadUrl(selectedTranscript.id)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  TXT
                </a>
              </div>

              <Link
                to={`/app/notes?id=${selectedTranscript.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Smart Notes</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
