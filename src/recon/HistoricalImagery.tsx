// src/recon/HistoricalImagery.tsx
import { useState } from 'react';
import { Camera, CalendarRange, Layers, Eye } from 'lucide-react';

interface HistoricalImageryProps {
  onYearChange?: (year: number) => void;
  selectedYear: number;
}

const YEAR_DETAILS = {
  2010: {
    status: "Строительные Котлованы & Краны",
    desc: "Бывшая промзона № 4 'Западный Порт'. Начат нулевой цикл строительства фундамента башни. Активная крановая техника, повышенная грунтовая активность.",
    co2: "185 ppm local",
    infra: "0% completed"
  },
  2015: {
    status: "Завершение Несущих Каркасов",
    desc: "Армированный железобетонный корпус вырос до 42 этажей. Начало монтажа фасадных энергосберегающих панелей. Подключение к городской ТЭЦ.",
    co2: "172 ppm local",
    infra: "45% completed"
  },
  2020: {
    status: "Сдача в Эксплуатацию",
    desc: "Полное фасадное остекление, сертификация BREEAM Outstanding. Главные арендаторы заселяют офисные блоки. Завершение благоустройства набережной.",
    co2: "115 ppm local",
    infra: "95% completed"
  },
  2026: {
    status: "Авангардный Квантовый Узел",
    desc: "Текущее эталонное состояние. Интеграция 5G/6G передатчиков, локальных солнечных концентраторов. Эксплуатируемая кровля с тактической вертолетной площадкой.",
    co2: "84 ppm local",
    infra: "100% completed"
  }
};

export function HistoricalImagery({ onYearChange, selectedYear }: HistoricalImageryProps) {
  const years = [2010, 2015, 2020, 2026] as const;
  const currentDetails = YEAR_DETAILS[selectedYear as keyof typeof YEAR_DETAILS] || YEAR_DETAILS[2026];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 font-mono space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarRange className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">HISTORIC_RECON / РЕТРОСПЕКТИВА И СНИМКИ</span>
        </div>
        <span className="text-[8px] bg-slate-800 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded uppercase">
          SAT-X CORRIDOR
        </span>
      </div>

      {/* Grid of years */}
      <div className="grid grid-cols-4 gap-1">
        {years.map((yr) => (
          <button
            key={yr}
            onClick={() => onYearChange?.(yr)}
            className={`py-1.5 rounded text-[10px] font-bold border transition-all text-center cursor-pointer ${
              selectedYear === yr
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)] animate-pulse'
                : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {yr}
          </button>
        ))}
      </div>

      {/* Details Box */}
      <div className="bg-black/40 border border-white/5 p-2 rounded relative overflow-hidden">
        {/* Dynamic decorative radar lines */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/10 animate-[scanline_3s_infinite]" />
        
        <div className="flex justify-between items-center text-[8px] border-b border-white/5 pb-1 mb-1.5">
          <span className="text-cyan-400 font-bold uppercase flex items-center gap-1">
            <Camera className="w-2.5 h-2.5 text-cyan-500" /> СЕНСОР СНИМКА №{selectedYear}
          </span>
          <span className="text-slate-500 font-mono">GRID SCALE LO_RES</span>
        </div>

        <div className="space-y-1.5 leading-relaxed">
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-200">
            <span>Статус застройки:</span>
            <span className="text-cyan-400 uppercase text-[8.5px] font-bold">{currentDetails.status}</span>
          </div>
          <p className="text-[8.5px] text-slate-400 text-justify">{currentDetails.desc}</p>
          
          <div className="grid grid-cols-2 gap-1 border-t border-white/5 pt-1.5 mt-1.5 text-[8px] text-slate-500 uppercase">
            <div>
              <span>Углеродный выброс: </span>
              <span className="font-bold text-slate-300">{currentDetails.co2}</span>
            </div>
            <div className="text-right">
              <span>Готовность Ряда: </span>
              <span className="font-bold text-cyan-400">{currentDetails.infra}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default HistoricalImagery;
