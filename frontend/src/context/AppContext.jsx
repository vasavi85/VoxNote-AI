import React, { createContext, useContext, useState, useEffect } from 'react';
import VoxApi from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [outputModes, setOutputModes] = useState(['transcribe', 'verbatim', 'codemix', 'transliterate']);
  const [loading, setLoading] = useState(true);
  const [activeTranscript, setActiveTranscript] = useState(null);

  // User preferences persisted in localStorage
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('voxnote_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      defaultLanguage: 'indic-auto',
      defaultOutputMode: 'transcribe',
      autoDetectLanguage: true,
      theme: 'dark',
    };
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [healthData, langData] = await Promise.all([
        VoxApi.getHealth().catch(() => null),
        VoxApi.getLanguages().catch(() => null),
      ]);

      if (healthData) setHealth(healthData);
      if (langData) {
        setLanguages(langData.languages || []);
        if (langData.output_modes) setOutputModes(langData.output_modes);
      }
    } catch (err) {
      console.error('Error initializing application state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    localStorage.setItem('voxnote_settings', JSON.stringify(userSettings));
  }, [userSettings]);

  const updateSettings = (newSettings) => {
    setUserSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider
      value={{
        health,
        languages,
        outputModes,
        loading,
        userSettings,
        activeTranscript,
        setActiveTranscript,
        updateSettings,
        refreshHealth: fetchInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
