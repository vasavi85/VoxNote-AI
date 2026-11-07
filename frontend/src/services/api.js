import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 120000, // 2 minutes for long transcriptions
});

// Response error interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export const VoxApi = {
  // Health & Languages
  getHealth: () => api.get('/health'),
  getLanguages: () => api.get('/languages'),
  getDashboardStats: () => api.get('/dashboard/stats'),

  // Transcription
  transcribeAudio: (formData, onProgress) => {
    return api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  submitBatchJob: (formData) => {
    return api.post('/transcribe/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getBatchJob: (jobId) => api.get(`/transcribe/batch/${jobId}`),

  // Transcripts CRUD
  getTranscripts: (params) => api.get('/transcripts', { params }),
  getTranscript: (id) => api.get(`/transcripts/${id}`),
  deleteTranscript: (id) => api.delete(`/transcripts/${id}`),

  // Smart Notes
  generateSummary: (payload) => api.post('/summarize', payload),

  // Download URLs
  getPdfDownloadUrl: (id) => `/api/download/${id}/pdf`,
  getTxtDownloadUrl: (id) => `/api/download/${id}/txt`,
};

export default VoxApi;
