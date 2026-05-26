// src/recon/TerrainProfile.tsx
import { useState } from 'react';
import { AreaChart, TrendingUp, Compass, ChevronRight } from 'lucide-react';

interface TerrainProfileProps {
  center: [number, number];
}

export function TerrainProfile({ center }: TerrainProfileProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [showData, setShowData] = useState(true);

  const points = [
    { name: 'Москва-Река', elevation: 112, dist: 0 },
    { name: 'Краснопресненская набережная', elevation: 120, dist: 120 },
    { name: 'Афимолл Плаза', elevation: 125, dist: 350 },
    { name: 'Орион Лофтс Сектор A', elevation: 128, dist: 500 },
    { name: 'Президент Тауэрс', elevation: 130, dist: 720 },
    { name: 'Пресненский Вал Высота', elevation: 137, dist: 1000 }
  ];

  const handleSweepAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setShowData(true);
    }, 1500);
  };

  // Convert points to SVG polyline coordinates
  const svgWidth = 320;
  const svgHeight = 65;
  const maxElev = 150;
  const minElev = 100;

  const pointsCoords = points.map((p, idx) => {
    const x = (p.dist / 1000) * svgWidth;
    const y = svgHeight - ((p.elevation - minElev) / (maxElev - minElev)) * svgHeight;
    return { ...p, x, y };
  });

  const pathData = pointsCoords.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
  }, '');

  const areaPathData = pathData + `L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 font-mono space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">TERRAIN_PROFILE / ТОПОГРАФИЧЕСКИЙ РАЗРЕЗ</span>
        </div>
        <span className="text-[8px] bg-slate-800 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded uppercase">
          DEM Grid v3
        </span>
      </div>

      <div className="bg-black/40 border border-white/5 p-2 rounded relative">
        {analyzing ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <Compass className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-[9px] text-slate-400 uppercase tracking-widest animate-pulse">СКАНИРОВАНИЕ ВЕРТИКАЛИ...</span>
          </div>
        ) : showData ? (
          <div className="space-y-3">
            {/* SVG Elev Elevation Graph */}
            <div className="relative border-b border-l border-slate-800 h-20 pt-2 pl-2">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Horizontal reference lines */}
                <line x1="0" y1={svgHeight * 0.2} x2={svgWidth} y2={svgHeight * 0.2} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 3" />
                <line x1="0" y1={svgHeight * 0.6} x2={svgWidth} y2={svgHeight * 0.6} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 3" />
                
                {/* Elevation Area */}
                <path d={areaPathData} fill="url(#elevationGrad)" />
                
                {/* Elevation Line */}
                <path d={pathData} fill="none" stroke="#06b6d4" strokeWidth="1.5" />
                
                {/* Data Points */}
                {pointsCoords.map((p, idx) => (
                  <g key={idx} className="group/item">
                    <circle cx={p.x} cy={p.y} r="2.5" fill="#ffffff" stroke="#06b6d4" strokeWidth="1" className="cursor-pointer hover:r-[4px] transition-all" />
                    <text x={p.x + 4} y={p.y - 4} fill="#94a3b8" fontSize="6.5" className="hidden sm:block opacity-60 group-hover/item:opacity-100 font-mono">
                      {p.elevation}m
                    </text>
                  </g>
                ))}
              </svg>
              
              {/* Y-axis Labels */}
              <div className="absolute left-1 top-2 text-[6.5px] text-slate-600 flex flex-col justify-between h-full pointer-events-none">
                <span>150m</span>
                <span>125m</span>
                <span>100m</span>
              </div>
            </div>

            {/* Micro elevation milestones */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[7px] text-slate-500 uppercase tracking-wide border-b border-white/5 pb-1 select-none">
                <span>Элемент Разреза</span>
                <div className="flex justify-between w-24">
                  <span>Расст.</span>
                  <span>Высота</span>
                </div>
              </div>
              
              {points.slice(0, 4).map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-[8.5px]">
                  <span className="text-slate-300 truncate flex items-center gap-1">
                    <ChevronRight className="w-2.5 h-2.5 text-cyan-500 shrink-0" />
                    {p.name}
                  </span>
                  <div className="flex justify-between w-24 text-right font-mono">
                    <span className="text-slate-500">{p.dist}m</span>
                    <span className="text-cyan-400 font-bold">{p.elevation}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <span className="text-[9px] text-slate-500">Топографическая сетка не инициализирована</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSweepAnalysis}
        className="w-full py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-cyan-950/20 hover:bg-cyan-950 text-cyan-400 border border-cyan-800/40 hover:border-cyan-500/60 transition-all cursor-pointer"
      >
        {analyzing ? 'АНАЛИЗ ВЫСОТЫ...' : 'ЗАПУСТИТЬ ЛОКАЛЬНУЮ РАЗВЕДКУ'}
      </button>
    </div>
  );
}
export default TerrainProfile;
