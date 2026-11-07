import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">VoxNote AI</span>
            <span>&bull;</span>
            <span>Gnani AI Prisma v3.0 Speech-to-Text Engine</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Supports 10 Indian Regional Languages &bull; Real-time Streaming &bull; Smart Notes
          </p>
        </div>
      </footer>
    </div>
  );
}
