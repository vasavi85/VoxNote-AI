export const LANGUAGE_DISPLAY_NAMES = {
  'indic-auto': { name: 'Auto Detect', native: 'स्वचालित', flag: '🇮🇳' },
  'en-IN': { name: 'English', native: 'India', flag: '🇬🇧' },
  'hi-IN': { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  'bn-IN': { name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  'mr-IN': { name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  'gu-IN': { name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  'pa-IN': { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  'kn-IN': { name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  'te-IN': { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  'ta-IN': { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  'ml-IN': { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
};

export const OUTPUT_MODE_INFO = {
  transcribe: {
    label: 'Transcribe (ITN)',
    badge: 'Standard',
    description: 'Clean readable text with formatted numbers, dates, and currency (Inverse Text Normalization).',
  },
  verbatim: {
    label: 'Verbatim',
    badge: 'Exact Speech',
    description: 'Word-for-word spoken speech including repetitions and exact phonetic utterances.',
  },
  codemix: {
    label: 'Code-Mix',
    badge: 'Hinglish / Multi',
    description: 'Bilingual representation: native script for Indic words and Latin script for English words.',
  },
  transliterate: {
    label: 'Transliterate',
    badge: 'Latin Script',
    description: 'Renders spoken Indian speech entirely in the Latin alphabet without translating meaning.',
  },
};

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getLanguageName(code) {
  const item = LANGUAGE_DISPLAY_NAMES[code];
  if (!item) return code;
  return `${item.name} (${item.native})`;
}
