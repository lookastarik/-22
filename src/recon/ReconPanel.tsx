// src/recon/ReconPanel.tsx
import { 
  Building2, 
  MapPin, 
  Settings2, 
  TrendingUp, 
  Compass, 
  Database, 
  Locate, 
  ChevronRight, 
  Activity,
  Layers,
  X,
  Lock
} from 'lucide-react';
import { POIRadar } from './POIRadar';
import { ShadowAnalysis } from './ShadowAnalysis';
import { HistoricalImagery } from './HistoricalImagery';
import { TerrainProfile } from './TerrainProfile';

interface ReconPanelProps {
  selectedBuilding: any;
  onClose: () => void;
  language: 'ru' | 'en';
  
  // Isochone controls
  showIsochrones: boolean;
  setShowIsochrones: (show: boolean) => void;
  travelMode: 'walk' | 'bike' | 'drive';
  setTravelMode: (mode: 'walk' | 'bike' | 'drive') => void;
  
  // Camera Fly & Presets
  onFlyTo: (lng: number, lat: number, zoom: number, pitch: number, bearing: number) => void;
  onApplyPreset: (presetId: string) => void;
  
  // Historical year
  selectedYear: number;
  setSelectedYear: (year: number) => void;

  userRole?: string;
}

export function ReconPanel({
  selectedBuilding,
  onClose,
  language,
  showIsochrones,
  setShowIsochrones,
  travelMode,
  setTravelMode,
  onFlyTo,
  onApplyPreset,
  selectedYear,
  setSelectedYear,
  userRole = 'investor'
}: ReconPanelProps) {

  // Role Gate checks based on specifications
  // ISOCHRONES 15min is only for Investor/Admin, Shadow Analysis for Investor/Admin, Historical Imagery for Admin only!
  const hasInvestorAccess = userRole === 'investor' || userRole === 'admin';
  const hasAdminAccess = userRole === 'admin';

  return (
    <div className="w-[360px] max-w-full bg-slate-950/95 border-l border-slate-800 text-slate-300 font-mono h-full flex flex-col shadow-[0_0_50px_rgba(30,41,59,0.3)] z-40 relative pointer-events-auto select-none">
      
      {/* Dynamic scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />

      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-[11px] font-bold text-white tracking-widest uppercase">
              TERRAIN_RECON_SUITE
            </h2>
            <p className="text-[7.5px] text-slate-500 uppercase">Aegis Tactical Intel v1.0</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 px-2 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-all text-[11px] font-bold cursor-pointer border border-white/5 hover:border-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* Active Target Module info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[7.5px] text-slate-500 uppercase">Текущая цель анализа:</span>
              <h3 className="text-[11px] font-bold text-white uppercase truncate max-w-[210px]">
                {selectedBuilding ? (selectedBuilding.properties?.name || `BUILDING_REF_${selectedBuilding.id}`) : "КОРПУС НЕ ВЫБРАН"}
              </h3>
            </div>
            {selectedBuilding && (
              <span className="text-[8px] uppercase bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded">
                Active Code: #{selectedBuilding.id}
              </span>
            )}
          </div>

          {selectedBuilding ? (
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/5 text-[9px]">
              <div>
                <span className="text-slate-500 text-[8px] uppercase block">Высотность</span>
                <span className="text-slate-200 font-bold">{selectedBuilding.properties?.height || 55}m // Extruded</span>
              </div>
              <div>
                <span className="text-slate-500 text-[8px] uppercase block">Кадастровый Класс</span>
                <span className="text-slate-200 font-bold">A+ Commercial</span>
              </div>
            </div>
          ) : (
            <p className="text-[8.5px] text-slate-500 italic pb-1">
              Выберите любое 3D здание на карте для запуска сенсорного пакета глубокого гео-анализа.
            </p>
          )}
        </div>

        {/* Cinematic Presets Selector */}
        <div className="space-y-2">
          <span className="text-[8px] text-slate-500 tracking-wider uppercase block">🎬 Cinematic Presets // Угол Пилотирования</span>
          <div className="grid grid-cols-3 gap-1">
            <button 
              onClick={() => onApplyPreset('bird-eye')}
              className="py-1 text-[8px] font-bold font-mono uppercase bg-slate-900 border border-white/5 hover:border-cyan-500/40 text-slate-400 hover:text-white rounded transition-colors text-center cursor-pointer"
            >
              🔭 Воздух
            </button>
            <button 
              onClick={() => onApplyPreset('drone')}
              className="py-1 text-[8px] font-bold font-mono uppercase bg-slate-900 border border-white/5 hover:border-cyan-500/40 text-slate-400 hover:text-white rounded transition-colors text-center cursor-pointer"
            >
              🛸 Дрон
            </button>
            <button 
              onClick={() => onApplyPreset('street')}
              className="py-1 text-[8px] font-bold font-mono uppercase bg-slate-900 border border-white/5 hover:border-cyan-500/40 text-slate-400 hover:text-white rounded transition-colors text-center cursor-pointer"
            >
              🚶 Патруль
            </button>
            <button 
              onClick={() => onApplyPreset('orbit')}
              className="py-1 text-[8px] font-bold font-mono uppercase bg-slate-900 border border-white/5 hover:border-cyan-500/40 text-slate-400 hover:text-white rounded transition-colors text-center cursor-pointer"
            >
              🚁 Облёт
            </button>
            <button 
              onClick={() => onApplyPreset('strategic')}
              className="py-1 text-[8px] font-bold font-mono uppercase bg-slate-900 border border-white/5 hover:border-cyan-500/40 text-slate-400 hover:text-white rounded transition-colors text-center cursor-pointer"
            >
              🖥️ Центр
            </button>
          </div>
        </div>

        {/* MODULE 1: Isochrone rings */}
        {selectedBuilding && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">📡 ISO_COGNITIVE / ИЗОХРОННЫЕ СЕТИ</span>
              <input
                type="checkbox"
                checked={showIsochrones}
                onChange={(e) => setShowIsochrones(e.target.checked)}
                className="w-3 h-3 hover:scale-105 accent-cyan-400 cursor-pointer"
                id="isochrone-toggle"
              />
            </div>

            {showIsochrones && (
              <div className="space-y-2.5">
                {/* Active transport selector */}
                <div className="grid grid-cols-3 gap-1">
                  {(['walk', 'bike', 'drive'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTravelMode(mode)}
                      className={`py-1 text-[8px] font-bold uppercase border rounded transition-all cursor-pointer ${
                        travelMode === mode
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400'
                          : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mode === 'walk' ? '🚶 Пешком' : mode === 'bike' ? '🚴 Велосипед' : '🚗 Авто'}
                    </button>
                  ))}
                </div>

                {/* Isochrone Legend & Ring status */}
                <div className="space-y-1.5 text-[8.5px]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Сектор 5 минут
                    </span>
                    <span className="text-slate-500">Доступность идеальная</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Сектор 10 минут
                    </span>
                    <span className="text-slate-500">Доступность хорошая</span>
                  </div>
                  
                  {/* Role Gate for 15+ Min Isochrones according to RBAC */}
                  {hasInvestorAccess ? (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Сектор 15 минут
                      </span>
                      <span className="text-rose-400/80 font-bold">Периферийная грань</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-600 bg-black/40 border border-white/5 p-1 rounded">
                      <span className="flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-slate-500" /> 15m Isochrone Lock
                      </span>
                      <span className="text-[7.5px] uppercase text-amber-500">Investor Only</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE 2: POI Radar */}
        {selectedBuilding && (
          <POIRadar 
            center={selectedBuilding.properties?.centroid ? JSON.parse(selectedBuilding.properties.centroid) : [37.6173, 55.7558]} 
            onFlyTo={onFlyTo} 
          />
        )}

        {/* MODULE 3: Shadow solar analysis */}
        {selectedBuilding && (
          hasInvestorAccess ? (
            <ShadowAnalysis 
              center={selectedBuilding.properties?.centroid ? JSON.parse(selectedBuilding.properties.centroid) : [37.6173, 55.7558]} 
              buildingHeight={selectedBuilding.properties?.height || 95}
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">SOLAR_ANALYSIS // RESTRICTED</span>
              </div>
              <p className="text-[8.5px] text-slate-500">Доступ к солнечному вектору и прогнозированию теней заблокирован для базовой Demo сессии. Повысьте роль до Инвестора.</p>
            </div>
          )
        )}

        {/* MODULE 4: Historical Imagery slider */}
        {selectedBuilding && (
          hasAdminAccess ? (
            <HistoricalImagery 
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">HISTORIC_RECON // CLASSIFIED</span>
              </div>
              <p className="text-[8.5px] text-slate-500">Только администратор платформы имеет санкцию просматривать исторические слои застройки 2010-2026г.</p>
            </div>
          )
        )}

        {/* MODULE 5: Terrain cross-section */}
        {selectedBuilding && (
          hasInvestorAccess ? (
            <TerrainProfile 
              center={selectedBuilding.properties?.centroid ? JSON.parse(selectedBuilding.properties.centroid) : [37.6173, 55.7558]} 
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-amber-500">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">TERRAIN_PROFILE // LOCK</span>
              </div>
              <p className="text-[8.5px] text-slate-500">Топографический модуль высот заблокирован. Требуется верифицированный аккаунт.</p>
            </div>
          )
        )}

        {/* Sovereign Stack diagnostics */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 space-y-2 text-[8px] text-slate-500 uppercase">
          <div className="flex items-center gap-1 border-b border-white/5 pb-1 text-slate-400">
            <Database className="w-3 h-3 text-emerald-500" />
            <span className="font-bold">Sovereign OS Server Monitor</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Map Platform Node:</span>
              <span className="text-emerald-500 font-bold">MapLibre GL JS V5.1 (OSS)</span>
            </div>
            <div className="flex justify-between">
              <span>Local GIS Database:</span>
              <span className="text-emerald-500 font-bold">PostgreSQL v16 + PostGIS 3.4</span>
            </div>
            <div className="flex justify-between">
              <span>Access API protocol:</span>
              <span className="text-slate-400 font-bold">Direct Vector JSON Loader (SECURE)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
export default ReconPanel;
