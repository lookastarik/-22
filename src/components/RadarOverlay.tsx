import * as React from 'react';
import { motion } from 'motion/react';

interface RadarOverlayProps {
  center: [number, number];
  radius: number;
  rotation: number;
}

export const RadarOverlay: React.FC<RadarOverlayProps> = ({ rotation }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-[150] overflow-hidden">
      <svg className="w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="radar-sweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 255, 100, 0)" />
            <stop offset="90%" stopColor="rgba(0, 255, 100, 0.2)" />
            <stop offset="100%" stopColor="rgba(0, 255, 100, 0.4)" />
          </radialGradient>
        </defs>

        {/* Tactical Crosshair Rings */}
        {[10, 20, 30, 40, 50].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(0, 255, 100, 0.15)"
            strokeWidth="0.1"
            strokeDasharray="1 2"
          />
        ))}

        {/* Axial Indicators */}
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0, 255, 100, 0.1)" strokeWidth="0.05" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0, 255, 100, 0.1)" strokeWidth="0.05" />

        {/* Sweeping Beam */}
        <g style={{ transformOrigin: '50% 50%', transform: `rotate(${rotation}rad)` }}>
          <path
            d="M 50 50 L 50 0 A 50 50 0 0 1 100 50 Z"
            fill="url(#radar-sweep)"
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="0"
            stroke="rgba(0, 255, 100, 0.8)"
            strokeWidth="0.5"
            strokeLinecap="round"
            className="pulsate-glow"
          />
        </g>

        {/* Detection Pings (Decorative) */}
        <motion.circle
          cx="30" cy="40" r="0.5"
          fill="#0f0"
          animate={{ opacity: [0, 1, 0], scale: [1, 2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        />
        <motion.circle
          cx="70" cy="65" r="0.5"
          fill="#0f0"
          animate={{ opacity: [0, 1, 0], scale: [1, 2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
        />
      </svg>
      
      {/* HUD Info */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/10 rounded-full animate-ping opacity-20" />
      <div className="absolute top-1/4 left-1/4 p-2 apple-glass border border-emerald-500/30 rounded-lg scale-75">
         <p className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Scanning_Environment...</p>
         <p className="text-[6px] font-mono text-emerald-600 uppercase">Sector_4 // Orbital_Sweep</p>
      </div>
    </div>
  );
};
