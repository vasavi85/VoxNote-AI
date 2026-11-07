import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AudioTranscriptionPage from './pages/AudioTranscriptionPage';
import LiveTranscriptionPage from './pages/LiveTranscriptionPage';
import SmartNotesPage from './pages/SmartNotesPage';
import TranscriptHistoryPage from './pages/TranscriptHistoryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            
            {/* App Internal Pages */}
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/app/transcribe" element={<AudioTranscriptionPage />} />
            <Route path="/app/live" element={<LiveTranscriptionPage />} />
            <Route path="/app/notes" element={<SmartNotesPage />} />
            <Route path="/app/history" element={<TranscriptHistoryPage />} />
            <Route path="/app/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
