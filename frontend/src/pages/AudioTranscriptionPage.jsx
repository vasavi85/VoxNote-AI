import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileAudio,
  Sparkles,
  Copy,
  Check,
  Download,
  ArrowRight,
  AlertCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import VoxApi from '../services/api';
import { useApp } from '../context/AppContext';
import LanguageSelector from '../components/LanguageSelector';
import AudioPlayer from '../components/AudioPlayer';
import StatusBadge from '../components/StatusBadge';
import { OUTPUT_MODE_INFO, formatDuration, formatFileSize } from '../utils/formatters';

export default function AudioTranscriptionPage() {
  const navigate = useNavigate();
  const { userSettings, health, setActiveTranscript } = useApp();

  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [languageCode, setLanguageCode] = useState(userSettings.defaultLanguage || 'indic-auto');
  const [autoDetect, setAutoDetect] = useState(true);
  const [outputMode, setOutputMode] = useState(userSettings.defaultOutputMode || 'transcribe');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [topic, setTopic] = useState('');
  const [speakerNames, setSpeakerNames] = useState('');

  // Execution states
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setResult(null);
    setError(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an audio file to transcribe.');
      return;
    }

    setIsTranscribing(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('language_code', autoDetect ? 'indic-auto' : languageCode);
    formData.append('output_mode', outputMode);
    if (keywords.trim()) formData.append('keywords', keywords.trim());
    if (topic.trim()) formData.append('topic', topic.trim());
    if (speakerNames.trim()) formData.append('speaker_names', speakerNames.trim());

    try {
      const response = await VoxApi.transcribeAudio(formData, (progress) => {
        setUploadProgress(progress);
      });
      setResult(response);
      setActiveTranscript(response);
    } catch (err) {
      setError(err.message || 'Transcription failed. Please check backend logs.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!result?.transcript_text) return;
    navigator.clipboard.writeText(result.transcript_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigateToNotes = () => {
    if (result?.id) {
      navigate(`/app/notes?id=${result.id}`);
    }
  };

  const isConfigured = health?.gnani?.configured;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Audio File Transcription
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload any audio file for high-precision multilingual transcription powered by Gnani Prisma v3.0.
        </p>
      </div>

      {/* API Key Status Notice */}
      {!isConfigured && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Gnani API Key Unconfigured</h4>
            <p className="text-xs text-amber-300/80 mt-0.5">
              To execute actual speech-to-text calls, set your <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-200">GNANI_API_KEY</code> in <span className="font-mono">backend/.env</span>.
            </p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : selectedFile
              ? 'border-slate-700 bg-slate-900/60'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.ogg,.flac,.m4a,.aac,.webm"
            onChange={(e) => handleFileChange(e.target.files[0])}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-md mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-xs text-indigo-400 mt-1">
                {formatFileSize(selectedFile.size)} &bull; Click or drop another file to replace
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-white">
                Drag and drop your audio file here, or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports WAV, MP3, FLAC, M4A, OGG, WEBM (Max 50 MB)
              </p>
            </div>
          )}
        </div>

        {/* Audio Player Preview (if audio selected) */}
        {audioUrl && (
          <AudioPlayer src={audioUrl} filename={selectedFile?.name || 'Selected Audio'} />
        )}

        {/* Configuration Row: Language & Output Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 glass-panel p-5 rounded-2xl border border-slate-800">
          {/* Language Selector */}
          <LanguageSelector
            value={languageCode}
            onChange={setLanguageCode}
            autoDetect={autoDetect}
            onAutoDetectToggle={setAutoDetect}
          />

          {/* Output Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              Prisma Output Mode
            </label>
            <select
              value={outputMode}
              onChange={(e) => setOutputMode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer font-medium appearance-none"
            >
              <option value="transcribe">Transcribe (ITN - Numbers &amp; Dates Formatted)</option>
              <option value="verbatim">Verbatim (Exact Spoken Speech)</option>
              <option value="codemix">Code-Mix (Native Script + English Terms)</option>
              <option value="transliterate">Transliterate (Latin Script Hinglish)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              {OUTPUT_MODE_INFO[outputMode]?.description}
            </p>
          </div>
        </div>

        {/* Advanced Prisma v3.0 Options (Collapsible) */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-5 py-3 text-left text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Advanced Prisma v3.0 Hints (Keywords, Topic, Speakers)
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="p-5 pt-1 border-t border-slate-800 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">
                  Custom Keywords / Vocabulary (Comma separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI, Aadhaar, Fixed Deposit, VoxNote"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">
                  Topic Context (Brief overview of recording topic):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quarterly financial performance and customer reviews"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">
                  Speaker Names (1 to 4 names):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul, Priya, Alex"
                  value={speakerNames}
                  onChange={(e) => setSpeakerNames(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Transcription Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Action Button & Progress */}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={!selectedFile || isTranscribing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
          >
            {isTranscribing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Transcribing with Prisma v3.0... {uploadProgress > 0 && uploadProgress < 100 ? `${uploadProgress}%` : ''}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start AI Transcription</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Transcription Results Card */}
      {result && (
        <div className="glass-panel rounded-2xl border border-indigo-500/30 overflow-hidden shadow-2xl space-y-0">
          {/* Result Header Bar */}
          <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {result.filename}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>Duration: <strong className="text-slate-300">{formatDuration(result.duration)}</strong></span>
                  <span>&bull;</span>
                  <span>Model: <strong className="text-indigo-400">{result.model}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge type="language" value={result.detected_language || result.language} />
              <StatusBadge type="mode" value={result.output_mode} />
            </div>
          </div>

          {/* Transcript Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Audio Transcript
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800/80 font-sans text-sm text-slate-100 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
              {result.transcript_text || 'No speech detected in this audio.'}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                <a
                  href={VoxApi.getPdfDownloadUrl(result.id)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  Download PDF
                </a>
                <a
                  href={VoxApi.getTxtDownloadUrl(result.id)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" />
                  Download TXT
                </a>
              </div>

              <button
                type="button"
                onClick={handleNavigateToNotes}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Smart Notes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
