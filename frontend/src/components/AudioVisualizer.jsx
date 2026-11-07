import React, { useMemo } from 'react';

export default function AudioVisualizer({ isActive = false, level = 0, barCount = 32, height = 64 }) {
  // Generate random base heights for visualizer bars
  const baseHeights = useMemo(() => {
    return Array.from({ length: barCount }, () => Math.floor(Math.random() * 40) + 20);
  }, [barCount]);

  return (
    <div
      className="flex items-center justify-center gap-1.5 w-full bg-slate-900/60 rounded-xl p-4 border border-slate-800/80"
      style={{ height: `${height + 32}px` }}
    >
      {baseHeights.map((base, idx) => {
        // Compute bar scale based on mic level or active state
        let dynamicHeight = 8;
        if (isActive) {
          const multiplier = 1 + (level / 100) * 1.8;
          const variance = Math.sin((idx / barCount) * Math.PI) * base * multiplier;
          dynamicHeight = Math.min(height, Math.max(8, variance));
        }

        return (
          <div
            key={idx}
            className={`w-1.5 rounded-full transition-all duration-75 ${
              isActive
                ? 'bg-gradient-to-t from-indigo-500 via-violet-500 to-pink-400 shadow-sm shadow-indigo-500/50'
                : 'bg-slate-700/60'
            }`}
            style={{
              height: `${dynamicHeight}px`,
              transition: 'height 0.08s ease-in-out',
            }}
          />
        );
      })}
    </div>
  );
}
