import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  RotateCcw,
  Copy,
  Check,
  Download,
  Radio,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useLiveRecorder } from '../hooks/useLiveRecorder';
import { useApp } from '../context/AppContext';
import AudioVisualizer from '../components/AudioVisualizer';
import LanguageSelector from '../components/LanguageSelector';
import StatusBadge from '../components/StatusBadge';
import { formatDuration } from '../utils/formatters';
import VoxApi from '../services/api';

export default function LiveTranscriptionPage() {
  const navigate = useNavigate();
  const { userSettings, health, setActiveTranscript } = useApp();

  const [languageCode, setLanguageCode] = useState(userSettings.defaultLanguage || 'indic-auto');
  const [autoDetect, setAutoDetect] = useState(true);
  const [outputMode, setOutputMode] = useState(userSettings.defaultOutputMode || 'transcribe');
  const [copied, setCopied] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    connectionStatus,
    liveTranscripts,
    detectedLanguage,
    fullText,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearTranscripts,
  } = useLiveRecorder({
    languageCode: autoDetect ? 'indic-auto' : languageCode,
    outputMode,
    onError: (err) => setStreamError(err),
  });

  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!fullText) return;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VoxNote_LiveStream_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndGenerateNotes = async () => {
    if (!fullText.trim()) return;
    setIsSaving(true);
    try {
      const summary = await VoxApi.generateSummary({ text: fullText.trim() });
      navigate('/app/notes', { state: { rawText: fullText.trim(), notes: summary } });
    } catch (err) {
      alert('Error generating smart notes: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isConfigured = health?.gnani?.configured;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Live Real-Time Streaming
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/25">
              <Radio className="w-3 h-3 animate-pulse" />
              WebSocket
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Low-latency microphone speech recognition with continuous VAD and multilingual transcription.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : connectionStatus === 'connecting'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-ping'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            {connectionStatus === 'connected'
              ? 'Streaming Active'
              : connectionStatus === 'connecting'
              ? 'Connecting to Gnani...'
              : 'Stream Idle'}
          </span>
        </div>
      </div>

      {/* API Notice */}
      {!isConfigured && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Live Streaming Requires Gnani API Key</h4>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Real-time WebSocket streaming connects directly to Gnani's WebSocket server using <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-200">GNANI_API_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* Stream Error */}
      {streamError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{streamError}</p>
        </div>
      )}

      {/* Control Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        {/* Settings row if not recording */}
        {!isRecording && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
            <LanguageSelector
              value={languageCode}
              onChange={setLanguageCode}
              autoDetect={autoDetect}
              onAutoDetectToggle={setAutoDetect}
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                Live Format Mode
              </label>
              <select
                value={outputMode}
                onChange={(e) => setOutputMode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer font-medium appearance-none"
              >
                <option value="transcribe">Transcribe (ITN Formatted)</option>
                <option value="verbatim">Verbatim (Exact Speech)</option>
                <option value="codemix">Code-Mix (Native + Latin English)</option>
                <option value="transliterate">Transliterate (Latin Script)</option>
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Waveform Visualizer */}
        <AudioVisualizer isActive={isRecording && !isPaused} level={audioLevel} height={70} />

        {/* Recording Stats & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Timer & Language */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-2xl font-bold text-white bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>{formatDuration(recordingTime)}</span>
            </div>

            {detectedLanguage && (
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  Detected Dialect
                </span>
                <StatusBadge type="language" value={detectedLanguage} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={!isConfigured}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold text-sm shadow-xl shadow-red-600/25 transition-all"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Start Live Recording</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    title="Resume Recording"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="p-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                    title="Pause Recording"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 font-semibold text-xs border border-slate-700 transition-colors"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Stream</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={clearTranscripts}
              disabled={isRecording || liveTranscripts.length === 0}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
              title="Clear transcript"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Stream Transcript Feed */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Live Transcription Feed</h3>
            <span className="text-xs text-slate-500">({liveTranscripts.length} segments)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!fullText}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium disabled:opacity-40 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={handleDownloadTxt}
              disabled={!fullText}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium disabled:opacity-40 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Download
            </button>
          </div>
        </div>

        {/* Live incremental segments */}
        <div className="p-6 min-h-[220px] max-h-[400px] overflow-y-auto space-y-3 font-sans">
          {liveTranscripts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <MicOff className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">Stream Waiting for Audio</p>
              <p className="text-xs text-slate-600 mt-1">
                Press "Start Live Recording" and speak clearly in any of the 10 supported Indian languages.
              </p>
            </div>
          ) : (
            liveTranscripts.map((seg, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-start justify-between gap-3 animate-fadeIn"
              >
                <div className="space-y-1">
                  <p className="text-sm text-slate-100 leading-relaxed font-sans">{seg.text}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    {seg.duration_ms && <span>{seg.duration_ms}ms</span>}
                    {seg.latency && <span>Latency: {seg.latency}ms</span>}
                  </div>
                </div>

                {seg.detected_language && (
                  <StatusBadge type="language" value={seg.detected_language} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Bar: Action to generate notes */}
        {fullText && (
          <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Live stream transcript is ready for intelligent summarization.
            </span>

            <button
              onClick={handleSaveAndGenerateNotes}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Smart Notes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
