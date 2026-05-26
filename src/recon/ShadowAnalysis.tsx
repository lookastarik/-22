// src/recon/ShadowAnalysis.tsx
import { useState, useMemo } from 'react';
import { Sun, ShieldAlert, Sunrise, Sunset } from 'lucide-react';

interface ShadowAnalysisProps {
  center: [number, number];
  buildingHeight?: number;
}

export function ShadowAnalysis({ center, buildingHeight = 120 }: ShadowAnalysisProps) {
  const [time, setTime] = useState<number>(14); // 13:00 base
  const [season, setSeason] = useState<'summer' | 'equinox' | 'winter'>('summer');

  const solarStats = useMemo(() => {
    const lat = center[1]; // Approximately 55.75 for Moscow
    
    // Declination depends on season
    const declination = season === 'summer' ? 23.44 : season === 'equinox' ? 0 : -23.44;
    
    // Clock-angle to hour angle (-90deg at 6am, 0deg at noon, 90deg at 6pm)
    const hourAngle = (time - 12) * 15;
    
    const latRad = (lat * Math.PI) / 180;
    const declRad = (declination * Math.PI) / 180;
    const hourRad = (hourAngle * Math.PI) / 180;
    
    // Sin of elevation (altitude)
    const sinAlt = Math.sin(latRad) * Math.sin(declRad) + 
                  Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourRad);
    
    // Convert back to degree altitude
    let altitudeDeg = (Math.asin(sinAlt) * 180) / Math.PI;
    
    // Sun is below horizon constraint
    if (altitudeDeg < 0) {
      altitudeDeg = 0;
    }
    
    // Azimuth calculation helper (clockwise from South/North base)
    const cosAz = (Math.sin(declRad) - Math.sin(latRad) * sinAlt) / 
                  (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
    let azimuthDeg = (Math.acos(Math.min(Math.max(cosAz, -1), 1)) * 180) / Math.PI;
    if (hourAngle > 0) {
      azimuthDeg = 360 - azimuthDeg;
    }
    
    // Moscow-specific rotation offset to align with true north
    azimuthDeg = Math.round((azimuthDeg + 180) % 360);
    
    // Shadow length formula: Height / tan(Altitude)
    let shadowLength = 0;
    if (altitudeDeg > 1) {
      const altRad = (altitudeDeg * Math.PI) / 180;
      shadowLength = Math.round(buildingHeight / Math.tan(altRad));
    } else {
      shadowLength = buildingHeight * 10; // Extreme shade
    }

    // Solar intensity index (0 to 100%)
    const intensity = altitudeDeg > 0 ? Math.round(Math.sin((altitudeDeg * Math.PI) / 180) * 100) : 0;

    return {
      altitude: Math.round(altitudeDeg * 10) / 10,
      azimuth: azimuthDeg,
      shadowLength: altitudeDeg > 0 ? shadowLength : '∞',
      intensity
    };
  }, [center, time, season, buildingHeight]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 font-mono space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:animate-spin" />
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">SOLAR_SHADOW / КРИТИЧЕСКАЯ ОСВЕЩЕННОСТЬ</span>
        </div>
        <span className="text-[8px] bg-amber-950/40 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase">
          Sun Angle API
        </span>
      </div>

      {/* Season selectors */}
      <div className="grid grid-cols-3 gap-1">
        {(['summer', 'equinox', 'winter'] as const).map((seasonId) => (
          <button
            key={seasonId}
            onClick={() => setSeason(seasonId)}
            className={`py-1 text-[8px] rounded border capitalize text-center cursor-pointer transition-all ${
              season === seasonId
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-400 font-bold'
                : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {seasonId === 'summer' ? '🌞 Июнь' : seasonId === 'equinox' ? '🍂 Сент' : '❄️ Декаб'}
          </button>
        ))}
      </div>

      {/* Live state slider */}
      <div className="space-y-1 bg-black/30 border border-white/5 p-2 rounded">
        <div className="flex justify-between items-center text-[9px]">
          <span className="text-slate-400 uppercase">Счетчик времени:</span>
          <span className="text-amber-400 font-bold text-xs">{time}:00 UTC</span>
        </div>
        <input 
          type="range"
          min={6}
          max={20}
          step={1}
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
          className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[7px] text-slate-600 uppercase">
          <span className="flex items-center gap-0.5"><Sunrise className="w-2.5 h-2.5 text-slate-500" /> 06:00 зарю</span>
          <span className="flex items-center gap-0.5">13:00 зенит</span>
          <span className="flex items-center gap-0.5">20:00 закат <Sunset className="w-2.5 h-2.5 text-slate-500" /></span>
        </div>
      </div>

      {/* Grid numbers */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-black/30 border border-white/5 p-1.5 rounded text-center">
          <span className="text-[7.5px] text-slate-500 uppercase">Высота</span>
          <p className="text-xs font-bold text-amber-400">{solarStats.altitude}°</p>
        </div>
        <div className="bg-black/30 border border-white/5 p-1.5 rounded text-center">
          <span className="text-[7.5px] text-slate-500 uppercase">Азимут</span>
          <p className="text-xs font-bold text-white">{solarStats.azimuth}°</p>
        </div>
        <div className="bg-black/30 border border-white/5 p-1.5 rounded text-center">
          <span className="text-[7.5px] text-slate-500 uppercase">Длина Тени</span>
          <p className="text-xs font-bold text-emerald-400">
            {solarStats.shadowLength}{typeof solarStats.shadowLength === 'number' && 'm'}
          </p>
        </div>
      </div>

      {/* Intensity warning */}
      <div className="flex items-center gap-2 bg-slate-900 border border-amber-950/60 p-2 rounded">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="text-[8px] text-slate-400 space-y-0.5 leading-tight">
          <span className="text-slate-200 uppercase font-semibold">Индекс инсоляции: {solarStats.intensity}% //</span>
          <p>
            {solarStats.intensity > 70 
              ? 'Экстремальное воздействие. Отличная проходимость фасадов ритейла.'
              : solarStats.intensity > 30 
              ? 'Стабильный уровень. Нормативные показатели жилых зон.'
              : 'Критическое затемнение. Увеличена потребность в энергоресурсах.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Add polyfill for Math.clamped if needed
if (!(Math as any).clamped) {
  (Math as any).clamped = (val: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, val));
  };
}
