// src/cabinet/DemoCabinet.tsx
import { motion } from 'motion/react';
import { Eye, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DemoCabinetProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

export const DemoCabinet = ({ isOpen, onClose, t }: DemoCabinetProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-xl flex flex-col font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-500 animate-pulse" />
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
            Observer Console // DEMO SYSTEM LEVEL_0
          </h2>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
        <div className="space-y-6">
          <div className="relative p-6 bg-white/5 border border-amber-500/20 rounded-2xl overflow-hidden">
            {/* Watermark background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-10">
              <span className="font-mono text-7xl font-bold tracking-[0.5em] text-white rotate-[-15deg]">
                UNAUTHORIZED
              </span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-mono font-bold text-white uppercase tracking-widest">
                  Observer Mode Active
                </h2>
              </div>
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-mono text-amber-400 uppercase tracking-widest">
                READ_ONLY_ACCESS
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Available Balance (Liquid)', value: '--- LOCKED', icon: '🔒', color: 'text-slate-500' },
                { label: 'Strategic Holdings', value: '0 POSITIONS', icon: '📊', color: 'text-slate-500' },
                { label: 'AI Diagnostic Limit', value: '5 Requests / Hr', icon: '🤖', color: 'text-amber-500' }
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl">
                  <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-2">
                    {stat.label}
                  </p>
                  <p className={`text-sm font-mono font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-1" />
              <div>
                <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">
                  DEMO BOUNDARIES & GATEWAY RULES
                </h3>
                <ul className="text-[9px] text-slate-400 space-y-1.5 font-mono">
                  <li>• Financial transactions and asset purchasing are strictly restricted</li>
                  <li>• Clean geographical and GIS data exports will carry diagnostic watermarks</li>
                  <li>• Real-time secondary syndicate and brokerage pools are deactivated</li>
                  <li>• Full investment profile features require investor KYC or Admin overrides</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-mono">
                Platform Authority // YardSoft RBAC System 1.0
              </span>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-primary text-black font-mono font-bold text-[9px] uppercase tracking-widest rounded hover:bg-primary/80 transition-all cursor-pointer"
              >
                Return to Tactical Map →
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
