// src/recon/POIRadar.tsx
import { useState, useMemo } from 'react';
import { 
  Train, 
  UtensilsCrossed, 
  ShoppingBag, 
  GraduationCap, 
  Hospital, 
  Trees, 
  Crosshair, 
  Radar, 
  Locate 
} from 'lucide-react';

interface POIRadarProps {
  center: [number, number]; // [lng, lat]
  onFlyTo: (lng: number, lat: number, zoom: number, pitch: number, bearing: number) => void;
}

export interface POIItem {
  name: string;
  category: 'transit' | 'food' | 'retail' | 'education' | 'medical' | 'parks' | 'competitors';
  offsetLng: number;
  offsetLat: number;
}

const STATIC_POI_TEMPLATES: POIItem[] = [
  { name: 'Метро Выставочная (L1)', category: 'transit', offsetLng: 0.0019, offsetLat: 0.0011 },
  { name: 'ТПУ Деловой Центр (L2)', category: 'transit', offsetLng: -0.0022, offsetLat: -0.0014 },
  { name: 'Метро Международная (L4)', category: 'transit', offsetLng: -0.0042, offsetLat: 0.0012 },
  { name: 'Пресненский Патрульный Узел', category: 'transit', offsetLng: 0.0035, offsetLat: 0.0032 },
  
  { name: 'Ресторан Кролик и Ко', category: 'food', offsetLng: 0.0008, offsetLat: -0.0006 },
  { name: 'Дым & Пар Сити Клаб', category: 'food', offsetLng: -0.0011, offsetLat: 0.0015 },
  { name: 'Кофейня Даблби Командная', category: 'food', offsetLng: -0.0003, offsetLat: -0.0004 },
  { name: 'Комбинат тактического питания', category: 'food', offsetLng: 0.0021, offsetLat: -0.0019 },

  { name: 'Афимолл Сити Центр Галерея', category: 'retail', offsetLng: 0.0015, offsetLat: -0.0002 },
  { name: 'Супермаркет ВкусВилл Премиум', category: 'retail', offsetLng: -0.0008, offsetLat: 0.0009 },
  { name: 'Оружейный Склад ЯрдСофт Армс', category: 'retail', offsetLng: 0.0018, offsetLat: 0.0025 },

  { name: 'Школа Бизнес Капитал МГУ', category: 'education', offsetLng: -0.0031, offsetLat: -0.0025 },
  { name: 'Компьютерная Академия ИТ', category: 'education', offsetLng: 0.0025, offsetLat: 0.0018 },

  { name: 'Медицинский Центр Клиника Сити', category: 'medical', offsetLng: -0.0015, offsetLat: -0.0019 },
  { name: 'Пункт тактической скорой помощи', category: 'medical', offsetLng: 0.0031, offsetLat: 0.0011 },

  { name: 'Парк Красная Пресня Сад', category: 'parks', offsetLng: 0.0048, offsetLat: 0.0052 },
  { name: 'Красногвардейские Пруды Резерв', category: 'parks', offsetLng: 0.0062, offsetLat: 0.0048 },

  { name: 'Блэкстоун Инвест Траст (Конкурент)', category: 'competitors', offsetLng: -0.0018, offsetLat: 0.0016 },
  { name: 'Альфа Финанс Капитал Офис', category: 'competitors', offsetLng: 0.0028, offsetLat: -0.0012 },
  { name: 'ВТБ Капитал Холдинг Трейд', category: 'competitors', offsetLng: 0.0011, offsetLat: -0.0022 }
];

export const POI_CATEGORIES = [
  { id: 'transit', label: 'Транспорт', icon: Train, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20' },
  { id: 'food', label: 'Питание', icon: UtensilsCrossed, color: 'text-amber-400 border-amber-500/20 bg-amber-950/20' },
  { id: 'retail', label: 'Маркеты', icon: ShoppingBag, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20' },
  { id: 'education', label: 'Образов.', icon: GraduationCap, color: 'text-purple-400 border-purple-500/20 bg-purple-950/20' },
  { id: 'medical', label: 'Медицина', icon: Hospital, color: 'text-red-400 border-red-500/20 bg-red-950/20' },
  { id: 'parks', label: 'Парки', icon: Trees, color: 'text-green-400 border-green-500/20 bg-green-950/20' },
  { id: 'competitors', label: 'Конкуренты', icon: Crosshair, color: 'text-pink-400 border-pink-500/20 bg-pink-950/20' }
] as const;

export function POIRadar({ center, onFlyTo }: POIRadarProps) {
  const [activeCategory, setActiveCategory] = useState<string>('transit');

  // Calculates distance in meters using Cosine Rule / Haversine (with local coordinate scaling)
  const poisWithDistances = useMemo(() => {
    return STATIC_POI_TEMPLATES.map((poi) => {
      const poiLng = center[0] + poi.offsetLng;
      const poiLat = center[1] + poi.offsetLat;

      // Latitude degrees to meters ~ 111,139m
      const dLat = poi.offsetLat * 111139;
      // Longitude degrees to meters at 55.75N ~ 111,139 * cos(55.75) ~ 62,560m
      const dLng = poi.offsetLng * 62560;
      
      const distance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

      return {
        ...poi,
        lng: poiLng,
        lat: poiLat,
        distance
      };
    })
    .filter(p => p.category === activeCategory)
    .sort((a, b) => a.distance - b.distance);
  }, [center, activeCategory]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 font-mono space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">POI_RADAR / СЕНСОРНЫЙ КОНТУР</span>
        </div>
        <span className="text-[8px] bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded uppercase">
          Radius: 1000m
        </span>
      </div>

      {/* Grid of category selectors */}
      <div className="grid grid-cols-4 gap-1">
        {POI_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`py-1 px-1 rounded flex flex-col items-center justify-center border text-[7.5px] transition-all font-bold cursor-pointer ${
                isActive 
                  ? 'bg-slate-800 border-white/20 text-white shadow-inner shadow-black'
                  : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
              <span className="truncate max-w-full text-center">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* List result */}
      <div className="space-y-1 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {poisWithDistances.length === 0 ? (
          <p className="text-[9px] text-slate-500 text-center py-2">Сенсоры не обнаружили объектов в секторе</p>
        ) : (
          poisWithDistances.map((poi, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between bg-black/30 border border-white/5 hover:border-white/10 px-2.5 py-1.5 rounded transition-all text-[9.5px] font-mono group"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-slate-200 truncate font-medium group-hover:text-cyan-300 transition-colors">
                  {poi.name}
                </span>
                <span className="text-[7.5px] text-slate-500 uppercase tracking-wide">
                  LAT: {poi.lat.toFixed(5)} / LON: {poi.lng.toFixed(5)}
                </span>
              </div>

              <button
                onClick={() => onFlyTo(poi.lng, poi.lat, 17.8, 65, 10 + idx * 45)}
                title="Pano to coordinate"
                className="flex items-center gap-1.5 bg-cyan-950/20 hover:bg-cyan-950 text-cyan-400 border border-cyan-800/40 hover:border-cyan-500/60 px-2 py-1 rounded text-[8px] font-bold group-hover:scale-[1.03] transition-all font-mono"
              >
                <span>{poi.distance}m</span>
                <Locate className="w-2.5 h-2.5 text-cyan-400 group-hover:animate-spin" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
