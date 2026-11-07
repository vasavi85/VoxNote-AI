import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  FileAudio,
  Radio,
  Clock,
  Globe2,
  FileText,
  Search,
  ArrowUpRight,
  TrendingUp,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  Plus,
} from 'lucide-react';
import VoxApi from '../services/api';
import { useApp } from '../context/AppContext';
import { formatDate, formatDuration, getLanguageName } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const { health } = useApp();
  const [stats, setStats] = useState(null);
  const [recentTranscripts, setRecentTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, transcriptsData] = await Promise.all([
        VoxApi.getDashboardStats().catch(() => null),
        VoxApi.getTranscripts({ limit: 10 }).catch(() => null),
      ]);

      if (statsData) setStats(statsData);
      if (transcriptsData?.transcripts) {
        setRecentTranscripts(transcriptsData.transcripts);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this transcript?')) return;
    try {
      await VoxApi.deleteTranscript(id);
      setRecentTranscripts((prev) => prev.filter((t) => t.id !== id));
      if (stats) {
        setStats({
          ...stats,
          total_recordings: Math.max(0, stats.total_recordings - 1),
        });
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filteredTranscripts = recentTranscripts.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.filename.toLowerCase().includes(query) ||
      (t.transcript_text && t.transcript_text.toLowerCase().includes(query)) ||
      (t.detected_language && t.detected_language.toLowerCase().includes(query))
    );
  });

  const isConfigured = health?.gnani?.configured;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Multilingual transcription performance, recent files, and live streaming metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/live"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-semibold shadow-sm transition-all"
          >
            <Radio className="w-4 h-4 text-violet-400 animate-pulse" />
            <span>Start Live Recording</span>
          </Link>
          <Link
            to="/app/transcribe"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Audio</span>
          </Link>
        </div>
      </div>

      {/* API Key Configuration Callout if unconfigured */}
      {!isConfigured && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-300">
                Gnani AI API Key Needed
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                To transcribe audio files and stream live voice, configure <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-200">GNANI_API_KEY</code> in <span className="font-mono">backend/.env</span>.
              </p>
            </div>
          </div>
          <Link
            to="/app/settings"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium transition-colors shrink-0"
          >
            Configure
          </Link>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recordings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Recordings
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {stats?.total_recordings || 0}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Stored in SQLite</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <FileAudio className="w-5 h-5" />
          </div>
        </div>

        {/* Total Minutes */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Transcribed Minutes
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {stats?.total_transcription_minutes || 0.0}m
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Processed Audio Time</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Engine Status */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active STT Engine
            </span>
            <span className="text-base font-bold text-indigo-300 mt-1 block">
              Prisma v3.0
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              10 Indic Languages
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
        </div>

        {/* Smart Notes Engine */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Smart Notes
            </span>
            <span className="text-base font-bold text-violet-300 mt-1 block">
              8 Note Categories
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Summary, Actions, Q&amp;A</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Language Breakdown Section */}
      {stats?.language_stats && Object.keys(stats.language_stats).length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-indigo-400" />
              <span>Language Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {Object.keys(stats.language_stats).length} active dialect(s)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {Object.entries(stats.language_stats).map(([lang, count]) => (
              <div
                key={lang}
                className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-medium text-slate-200 block truncate">
                    {getLanguageName(lang)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{lang}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transcripts Table & Search */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Transcriptions</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse, inspect, export, or generate smart notes for previous recordings.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search filename or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading transcripts...
          </div>
        ) : filteredTranscripts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileAudio className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">No transcripts found</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload an audio file or start a live recording to see transcripts here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">File / Recording</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTranscripts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-200 truncate max-w-xs sm:max-w-sm">
                        {item.filename}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                        {item.transcript_text ? `"${item.transcript_text.substring(0, 90)}..."` : 'No text'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge type="language" value={item.detected_language || item.language} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge type="mode" value={item.output_mode} />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">
                      {formatDuration(item.duration)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/app/notes?id=${item.id}`}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                          title="View Smart Notes"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
