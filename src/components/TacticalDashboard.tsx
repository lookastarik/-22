import React, { useState } from 'react';
import { useTacticalState } from '../hooks/useTacticalState';
import { 
  Globe, 
  Target, 
  Zap, 
  Activity, 
  ShieldAlert, 
  ChevronRight,
  Cpu,
  Database,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const TacticalDashboard = () => {
  const { 
    selectedEntityId, 
    tacticalViewMode, 
    setTacticalViewMode, 
    isSimulationActive, 
    setSimulationActive,
    threatLevel,
    updateThreatLevel,
    setRegistrationModalOpen
  } = useTacticalState();

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-24 left-6 z-50 flex flex-col gap-4">
      {/* Mini Threat Radar */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-64"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className={cn(
              "w-4 h-4",
              threatLevel > 70 ? "text-red-500 animate-pulse" : "text-yellow-500"
            )} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Sector Threat Analysis</span>
          </div>
          <span className={cn(
            "text-xs font-mono font-bold",
            threatLevel > 70 ? "text-red-500" : "text-yellow-500"
          )}>{threatLevel}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${threatLevel}%` }}
            className={cn(
              "h-full transition-colors",
              threatLevel > 70 ? "bg-red-500" : "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
            )}
          />
        </div>
        <div className="mt-3 flex justify-between">
          <button 
            onClick={() => updateThreatLevel(Math.min(100, threatLevel + 5))}
            className="text-[9px] font-mono uppercase bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 transition-all"
          >
            Escalate
          </button>
          <button 
            onClick={() => updateThreatLevel(Math.max(0, threatLevel - 5))}
            className="text-[9px] font-mono uppercase bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/5 transition-all"
          >
            Mitigate
          </button>
        </div>
      </motion.div>

      {/* Main Tactical Controls */}
      <motion.div 
        layout
        className={cn(
          "bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500",
          expanded ? "w-80" : "w-16 h-16 cursor-pointer"
        )}
        onClick={() => !expanded && setExpanded(true)}
      >
        <div className="flex flex-col h-full">
          {/* Header/Collapse Toggle */}
          <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
            <div className={cn("flex items-center gap-3", !expanded && "hidden")}>
              <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-tight">Tactical Operations</span>
                <span className="text-[8px] font-mono text-primary uppercase tracking-widest opacity-70">AIP Strategic Layer</span>
              </div>
            </div>
            
            {!expanded ? (
              <div className="w-8 h-8 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-primary animate-pulse" />
              </div>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                className="p-1 hover:bg-white/10 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-500 rotate-180" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 space-y-6"
              >
                {/* View Modes */}
                <div className="space-y-3">
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-2">Visual Spectrum</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'orbital', label: 'Orbital', icon: Globe },
                      { id: 'tactical', label: 'Tactical', icon: Target },
                      { id: 'street', label: 'Street', icon: Activity },
                      { id: 'thermal', label: 'Thermal', icon: Zap }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setTacticalViewMode(mode.id as any)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left",
                          tacticalViewMode === mode.id 
                            ? "bg-primary/20 border-primary/40 text-white shadow-[inset_0_0_12px_rgba(var(--primary-accent),0.2)]" 
                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                        )}
                      >
                        <mode.icon className={cn("w-3.5 h-3.5", tacticalViewMode === mode.id ? "text-primary" : "text-slate-500")} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation Toggle */}
                <div className="space-y-3">
                   <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-2">Predictive Logic Engine</p>
                   <div className="space-y-2">
                     <button 
                      onClick={() => setSimulationActive(!isSimulationActive)}
                      className={cn(
                        "w-full p-4 rounded-2xl border transition-all flex items-center justify-between group",
                        isSimulationActive
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                      )}
                     >
                       <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                           isSimulationActive ? "bg-emerald-500/20 border-emerald-500/30" : "bg-white/5 border-white/10"
                         )}>
                           <Cpu className={cn("w-4 h-4", isSimulationActive && "animate-pulse")} />
                         </div>
                         <div className="flex flex-col text-left">
                           <span className="text-[10px] font-bold uppercase tracking-tighter">Market Simulation</span>
                           <span className="text-[8px] font-mono opacity-60 uppercase">{isSimulationActive ? 'Active_Link' : 'Standby'}</span>
                         </div>
                       </div>
                       <div className={cn(
                         "w-8 h-4 rounded-full p-1 transition-all",
                         isSimulationActive ? "bg-emerald-500" : "bg-slate-800"
                       )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full bg-white transition-all",
                            isSimulationActive ? "ml-4" : "ml-0"
                          )} />
                       </div>
                     </button>

                     <button 
                        onClick={() => setRegistrationModalOpen(true)}
                        className="w-full p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 hover:bg-primary/20 transition-all group"
                     >
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Register New Asset</span>
                          <span className="text-[8px] font-mono text-primary opacity-60 uppercase tracking-widest">Protocol ALPHA</span>
                        </div>
                     </button>
                   </div>
                </div>

                {/* System Stats */}
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-primary" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase">Data_Flow</span>
                    </div>
                    <span className="text-xs font-mono text-white">4.2 TB/s</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-secondary" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase">Latency</span>
                    </div>
                    <span className="text-xs font-mono text-white">12ms</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Selected Entity Summary Card */}
      <AnimatePresence>
        {selectedEntityId && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-primary/10 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl w-80"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-mono text-primary uppercase tracking-[0.2em] mb-1">Asset_Identity_Verified</p>
                <p className="text-sm font-bold text-white uppercase truncate">Entity_ID: {selectedEntityId}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
