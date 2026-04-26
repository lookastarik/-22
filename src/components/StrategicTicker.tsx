import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  TrendingUp, 
  Zap, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface StrategicEvent {
  id: string;
  type: 'anomaly' | 'lease' | 'market' | 'system';
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

const MOCK_EVENTS: StrategicEvent[] = [
  { id: '1', type: 'anomaly', message: 'Geospatial anomaly detected in Sector 7-G. Signal instability rising.', timestamp: '19:42:01', priority: 'high' },
  { id: '2', type: 'lease', message: 'Lease expiring: Neo-City Hub B (Level 42) in 72 hours.', timestamp: '19:42:15', priority: 'medium' },
  { id: '3', type: 'market', message: 'Volatility index spike: Cyber-credits fluctuation +4.2% in N-Markets.', timestamp: '19:42:30', priority: 'low' },
  { id: '4', type: 'system', message: 'Protocol Alpha-7 security layer initialized. Handshake successful.', timestamp: '19:42:45', priority: 'low' },
  { id: '5', type: 'anomaly', message: 'Unidentified data packet intercepted from Northern District.', timestamp: '19:43:10', priority: 'medium' },
];

export const StrategicTicker = () => {
  const [events, setEvents] = useState<StrategicEvent[]>(MOCK_EVENTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
      
      // Randomly inject new event
      if (Math.random() > 0.8) {
        const newEvent: StrategicEvent = {
          id: Math.random().toString(36).substr(2, 9),
          type: ['anomaly', 'lease', 'market', 'system'][Math.floor(Math.random() * 4)] as any,
          message: `Real-time update: System-Status-${Math.floor(Math.random() * 1000)} stable. Monitoring vectors.`,
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          priority: Math.random() > 0.7 ? 'high' : 'low'
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 10)]);
      }
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [events.length]);

  const activeEvent = events[currentIndex];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'lease': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'market': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      default: return <Zap className="w-4 h-4 text-primary" />;
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-amber-500/50 bg-amber-500/5 shadow-amber-500/10';
      case 'medium': return 'border-blue-500/50 bg-blue-500/5 shadow-blue-500/10';
      default: return 'border-white/10 bg-white/5 shadow-primary/5';
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-6">
      <div className="relative h-14 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-x-0 h-px top-0 bg-primary/50 animate-pulse" />
          <div className="absolute inset-x-0 h-px bottom-0 bg-primary/50 animate-pulse" />
        </div>

        <div className="flex items-center h-full px-4 gap-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2 border-r border-white/10 pr-6 h-8">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-bold font-mono text-white/50 uppercase tracking-widest whitespace-nowrap">Feed Live</span>
          </div>

          {/* Event Content */}
          <div className="relative flex-1 h-full overflow-hidden flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeEvent.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="flex items-center gap-4 w-full"
              >
                <div className={cn(
                  "p-2 rounded-lg border transition-colors",
                  getPriorityBorder(activeEvent.priority)
                )}>
                  {getEventIcon(activeEvent.type)}
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-widest">[{activeEvent.type}]</span>
                    <span className="text-[9px] font-mono text-white/30">{activeEvent.timestamp}</span>
                  </div>
                  <p className="text-sm text-white font-medium truncate max-w-[500px]">
                    {activeEvent.message}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls / Info */}
          <div className="flex items-center gap-4 pl-6 border-l border-white/10 h-8">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-white/40 uppercase">Buffer Overload</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn(
                    "w-3 h-1 rounded-full",
                    i === 3 ? "bg-amber-500" : "bg-white/20"
                  )} />
                ))}
              </div>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-primary" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <motion.div 
          key={currentIndex}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: "linear" }}
          className="absolute bottom-0 left-0 h-0.5 bg-primary/30"
        />
      </div>
    </div>
  );
};
