// src/admin/GeospatialEditor.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Trash2, Check, RotateCcw, MapPin, Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';

interface GeospatialEditorProps {
  viewState: any;
  vertices: [number, number][];
  setVertices: React.Dispatch<React.SetStateAction<[number, number][]>>;
  onPolygonComplete: (coordinates: number[][][]) => void;
  isActive: boolean;
  onToggle: () => void;
}

export const GeospatialEditor = ({ 
  viewState, 
  vertices,
  setVertices,
  onPolygonComplete, 
  isActive,
  onToggle 
}: GeospatialEditorProps) => {

  const completePolygon = () => {
    if (vertices.length >= 3) {
      // Create closed loop
      const closedLoop = [...vertices, vertices[0]];
      onPolygonComplete([closedLoop]); // Wrap in coordinates hierarchy
    }
  };

  const resetPolygon = () => {
    setVertices([]);
  };

  // Estimate area of polygon (Shoelace formula)
  const calculateArea = () => {
    if (vertices.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i][0] * vertices[j][1];
      area -= vertices[j][0] * vertices[i][1];
    }
    // Convert coordinate degrees to approximate square meters
    // At Moscow latitude (55.75), 1 deg lat is approx 111,320m, 1 deg lon is approx 62,500m
    const latFactor = 111320;
    const lonFactor = 111320 * Math.cos((viewState?.latitude || 55.75) * Math.PI / 180);
    return Math.abs(area / 2) * latFactor * lonFactor;
  };

  return (
    <div className="absolute top-24 right-6 z-50 space-y-3 pointer-events-auto">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-2xl bg-black border cursor-pointer",
          isActive 
            ? "bg-red-950/40 border-red-500/70 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
            : "border-slate-800 text-slate-400 hover:text-white"
        )}
      >
        <Hexagon className={cn("w-5 h-5", isActive && "animate-spin")} style={{ animationDuration: '6s' }} />
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="w-72 bg-black/90 backdrop-blur-md rounded-2xl p-5 border border-red-500/30 space-y-4 shadow-2xl font-mono"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-red-500 animate-pulse" />
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Geospatial_Editor
                </h3>
              </div>
              <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-[8px] text-red-400 font-bold">
                {vertices.length > 0 ? 'DRAWING' : 'IDLE'}
              </div>
            </div>

            <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-500 uppercase">Vertices</span>
                <span className="text-red-400 font-bold">{vertices.length}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-500 uppercase">Area (est.)</span>
                <span className="text-red-400 font-bold">
                  {calculateArea().toFixed(0)} m²
                </span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-500 uppercase">Status</span>
                <span className={cn(
                  "font-bold",
                  vertices.length >= 3 ? "text-emerald-400" : "text-amber-400"
                )}>
                  {vertices.length >= 3 ? 'READY' : 'ADD_VERTICES'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl leading-normal">
              <p className="text-[8px] text-red-400 flex items-start gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>
                  Кликай по карте для добавления точек. Минимум 3 точки для создания полигона здания.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={resetPolygon}
                disabled={vertices.length === 0}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer"
                title="Clear polygon"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setVertices(v => v.slice(0, -1))}
                disabled={vertices.length === 0}
                className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer"
                title="Undo last point"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={completePolygon}
                disabled={vertices.length < 3}
                className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer"
                title="Complete polygon"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vertex List with limited height */}
            {vertices.length > 0 && (
              <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-hide border-t border-white/5 pt-2">
                {vertices.map((v, i) => (
                  <div key={i} className="flex justify-between text-[8px] font-mono p-1 bg-white/5 rounded">
                    <span className="text-slate-500">V_{i}</span>
                    <span className="text-white">{v[0].toFixed(5)}, {v[1].toFixed(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
