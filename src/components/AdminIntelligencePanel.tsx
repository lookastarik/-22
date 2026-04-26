import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Database, Cpu, Lock, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminIntelligencePanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[400] w-full max-w-lg"
    >
      <div className="mx-4 apple-glass border border-red-500/30 bg-red-950/20 rounded-3xl p-6 shadow-2xl shadow-red-500/10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ShieldAlert className="w-32 h-32 text-red-500" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2.5 bg-red-500/20 rounded-xl border border-red-500/40">
              <ShieldAlert className="w-5 h-5 text-red-500" />
           </div>
           <div>
              <h3 className="text-xs font-display font-bold text-white uppercase tracking-[0.2em]">Sovereign Control Node</h3>
              <p className="text-[10px] text-red-400/70 font-mono uppercase tracking-widest">Level 5 Clearance // Administrator</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {[
             { label: 'System Integrity', value: '100.0%', icon: ShieldAlert, color: 'text-emerald-400' },
             { label: 'Active Sessions', value: '12,482', icon: Database, color: 'text-blue-400' },
             { label: 'Neural Load', value: '14.2%', icon: Cpu, color: 'text-amber-400' },
             { label: 'Security Level', value: 'OMNIA', icon: Lock, color: 'text-indigo-400' }
           ].map((stat, i) => (
             <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                   <stat.icon className="w-3 h-3 text-slate-500" />
                   <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{stat.label}</span>
                </div>
                <p className={cn("text-xs font-mono font-bold tracking-wider", stat.color)}>{stat.value}</p>
             </div>
           ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[9px] text-red-500/70 font-mono uppercase tracking-[0.15em]">Admin Shell Active</span>
           </div>
           <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-[9px] text-red-400 font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95">
              Purge Logs
           </button>
        </div>
      </div>
    </motion.div>
  );
}
