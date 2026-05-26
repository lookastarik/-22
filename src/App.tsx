import * as React from 'react';
import { useState, useMemo, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { Map, useControl, Layer, MapRef, ScaleControl } from 'react-map-gl/maplibre';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { 
  PathLayer, 
  ScatterplotLayer, 
  PolygonLayer,
  GeoJsonLayer,
} from '@deck.gl/layers';
import { createBuildingsLayer } from './layers/buildings';
import { animateCamera, CAMERA_PRESETS } from './camera/cinematicController';
import { generateFullIsochroneGeoJSON } from './recon/isochroneGenerator';
import { ReconPanel } from './recon/ReconPanel';
import { GoogleGenAI, Type } from "@google/genai";
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  Building2, 
  Shield, 
  TrendingUp, 
  MessageSquare, 
  Send,
  User,
  Info,
  Plus,
  Minus,
  RotateCcw,
  Layers,
  Map as MapIcon,
  Eye,
  EyeOff,
  Wallet,
  Coins,
  ShoppingCart,
  CheckCircle2,
  CheckSquare,
  Square,
  X,
  ExternalLink,
  MapPin,
  Key,
  Settings,
  LogOut,
  Search,
  Palette,
  Sun,
  Moon,
  Command,
  Camera,
  Video,
  Mic,
  Play,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Lock,
  Upload,
  Radar,
  Terminal,
  Zap,
  Target,
  AlertTriangle,
  Ruler,
  Maximize,
  Map as MapIconUI,
  Layers as LayersIcon,
  MousePointer2,
  Navigation,
  RotateCw,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useRoleAccess, checkPermission } from './roles/permissions';
import { RoleGate } from './roles/RoleGate';
import { DemoCabinet } from './cabinet/DemoCabinet';
import { InvestorCabinet } from './cabinet/InvestorCabinet';
import { AdminCabinet } from './cabinet/AdminCabinet';
import { GeospatialEditor } from './admin/GeospatialEditor';
import { AdminAssetCreator } from './admin/AdminAssetCreator';
import { BulkImportEngine } from './admin/BulkImportEngine';
import { soundService } from './services/soundService';
import { UITourWalkthrough } from './components/UITourWalkthrough';
import { adsbStream, FlightState } from './services/osint/adsbStream';
import { createAirTrafficLayer } from './layers/airTraffic';

// Types
interface BuildingInfo {
  id: number;
  x?: number;
  y?: number;
  properties: {
    height: number;
    roi?: number;
    status?: number;
    owner?: string;
  };
}

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  timestamp: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type MapMode = 'dark' | 'satellite' | 'topo' | 'hybrid' | 'light';
type MeasurementMode = 'none' | 'distance' | 'area';

// Firebase Error Handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">System Anomaly Detected</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              The application encountered an unexpected error. Our tactical systems are investigating the breach.
            </p>
            <div className="bg-black/40 rounded-xl p-4 mb-6 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-white break-all">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white hover:bg-slate-200 text-black font-bold py-3 rounded-xl transition-all active:scale-95 text-sm uppercase tracking-widest"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const translations = {
  en: {
    title: "YARDSOFT",
    subtitle: "Strategic Analysis Engine // v4.0.2",
    balance: "Balance",
    role: "Role",
    portfolio: "Strategic Assets",
    valuation: "Total Valuation",
    estRevenue: "Est. Revenue",
    monthlyYield: "Monthly Yield",
    avgRoi: "Average ROI",
    buyAsset: "Acquire Asset",
    owned: "Asset Secured",
    searchPlaceholder: "SEARCH STRATEGIC LOCATION...",
    aiAnalyst: "AI Analyst",
    aiPlaceholder: "ENTER STRATEGIC QUERY...",
    aiInitial: "Initialize strategic query to begin analysis.",
    marketValue: "Market Value",
    elevation: "Elevation",
    roiAnalysis: "ROI Analysis",
    currentAuthority: "Current Authority",
    risk: "High Risk",
    stable: "Stable Asset",
    dismiss: "Dismiss",
    settings: "Account Settings",
    apiManagement: "API Management",
    public: "Public",
    investor: "Investor",
    admin: "Admin",
    treasury: "Treasury",
    units: "UNITS",
    cycle: "CYC",
    encrypted: "ENCRYPTED",
    restricted: "Restricted_Access",
    sector: "Sector",
    anomalous: "Anomalous",
    stable_status: "Stable",
    search: "Search",
    theme: "Theme",
    language: "Language",
    mode: "Mode",
    light: "Light",
    dark: "Dark",
    legendTitle: "Strategic Map Legend",
    legendStable: "Stable Assets",
    legendStableDesc: "Secured properties with positive ROI and low volatility.",
    legendRisk: "High Risk / Anomalous",
    legendRiskDesc: "Properties showing negative ROI or structural anomalies. Pulsing indicates active monitoring.",
    legendOptimal: "Optimal Yield",
    legendOptimalDesc: "Top-tier assets with ROI exceeding 20%.",
    layers: "Data Layers",
    buildings: "3D Buildings",
    weather: "Atmospheric Intel",
    toggleLayer: "Toggle Visibility",
    signIn: "Authenticate",
    signOut: "Terminate Session",
    loginWithGoogle: "Login with Google Authority",
    authRequired: "Authentication Required",
    authDesc: "Access to strategic assets requires verified identity.",
    uploadDocumentation: "Upload Documentation",
    filters: "Strategic Filters",
    status: "Strategic Status",
    minRoi: "Min ROI",
    ownerAuthority: "Owner Authority",
    reset: "Reset Filters",
    apply: "Apply Strategic Filter",
    ownerPlaceholder: "Search by owner identity...",
    gridBrightness: "Grid Intensity",
    scanlineIntensity: "Scanline Intensity",
    systemConfig: "System Config",
    satellite: "Satellite",
    hybrid: "Hybrid",
    topographic: "Topo",
    measureDistance: "Measure Distance",
    measureArea: "Measure Area",
    clearMeasurements: "Clear Tools",
    mapMode: "Map Mode",
    parcels: "Parcels",
    loginWindowClosed: "Authentication canceled (the window was closed).",
    loginFailed: "Authentication failed. Error: ",
    loginSuccess: "Authentication successful.",
  },
  ru: {
    title: "YARDSOFT",
    subtitle: "Движок Стратегического Анализа // v4.0.2",
    balance: "Баланс",
    role: "Роль",
    portfolio: "Стратегические Активы",
    valuation: "Общая Оценка",
    estRevenue: "Ожид. Доход",
    monthlyYield: "Месячный Доход",
    avgRoi: "Средний ROI",
    buyAsset: "Приобрести Актив",
    owned: "Актив Закреплен",
    searchPlaceholder: "ПОИСК СТРАТЕГИЧЕСКОЙ ЛОКАЦИИ...",
    aiAnalyst: "ИИ Аналитик",
    aiPlaceholder: "ВВЕДИТЕ СТРАТЕГИЧЕСКИЙ ЗАПРОС...",
    aiInitial: "Инициализируйте стратегический запрос для начала анализа.",
    marketValue: "Рыночная Стоимость",
    elevation: "Высота",
    roiAnalysis: "Анализ ROI",
    currentAuthority: "Текущий Владелец",
    risk: "Высокий Риск",
    stable: "Стабильный Актив",
    dismiss: "Закрыть",
    settings: "Настройки Аккаунта",
    apiManagement: "Управление API",
    public: "Публичный",
    investor: "Инвестор",
    admin: "Админ",
    treasury: "Казна",
    units: "ЕД",
    cycle: "ЦИКЛ",
    encrypted: "ЗАШИФРОВАНО",
    restricted: "Доступ_Ограничен",
    sector: "Сектор",
    anomalous: "Аномалия",
    stable_status: "Стабильно",
    search: "Поиск",
    theme: "Тема",
    language: "Язык",
    mode: "Режим",
    light: "Светлый",
    dark: "Темный",
    legendTitle: "Легенда Стратегической Карты",
    legendStable: "Стабильные Активы",
    legendStableDesc: "Закрепленные объекты с положительным ROI и низкой волатильностью.",
    legendRisk: "Высокий Риск / Аномалия",
    legendRiskDesc: "Объекты с отрицательным ROI или структурными аномалиями. Пульсация означает активный мониторинг.",
    legendOptimal: "Оптимальная Доходность",
    legendOptimalDesc: "Активы высшего уровня с ROI более 20%.",
    layers: "Слои Данных",
    buildings: "3D Здания",
    weather: "Атмосферные Данные",
    toggleLayer: "Переключить Видимость",
    signIn: "Аутентификация",
    signOut: "Завершить Сеанс",
    loginWithGoogle: "Войти через Google Authority",
    authRequired: "Требуется Аутентификация",
    authDesc: "Доступ к стратегическим активам требует подтвержденной личности.",
    uploadDocumentation: "Загрузить Документацию",
    filters: "Стратегические Фильтры",
    status: "Стратегический Статус",
    minRoi: "Мин. ROI",
    ownerAuthority: "Владелец",
    reset: "Сбросить Фильтры",
    apply: "Применить Фильтр",
    ownerPlaceholder: "Поиск по владельцу...",
    gridBrightness: "Яркость Сетки",
    scanlineIntensity: "Яркость Сканирования",
    systemConfig: "Конфиг Системы",
    satellite: "Спутник",
    hybrid: "Гибрид",
    topographic: "Топография",
    measureDistance: "Измерить Расстояние",
    measureArea: "Измерить Площадь",
    clearMeasurements: "Очистить",
    mapMode: "Режим Карты",
    parcels: "Участки",
    loginWindowClosed: "Аутентификация отменена (окно было закрыто).",
    loginFailed: "Аутентификация не удалась. Ошибка: ",
    loginSuccess: "Аутентификация прошла успешно.",
  }
};

const themes = ['tactical', 'cyber', 'royal', 'arctic', 'desert'];

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  
  useEffect(() => {
    overlay.setProps(props);
  }, [props, overlay]);

  return null;
}

const TacticalHUD = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[55] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Main Data Top */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[12%] flex flex-col items-center gap-1"
        >
          <div className="w-16 h-px bg-primary/20" />
          <span className="text-[10px] font-mono font-bold text-primary tracking-[0.5em] uppercase opacity-80">Main Data</span>
          <span className="text-[18px] font-mono font-bold text-primary tracking-[0.2em]">00</span>
          <div className="flex gap-6 mt-2 opacity-30">
            <span className="text-[6px] font-mono text-primary tracking-widest">826 0363 775 P512</span>
            <span className="text-[6px] font-mono text-primary tracking-widest">A0. 88. 4. 95</span>
          </div>
        </motion.div>

        {/* Main Data Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-[12%] flex flex-col items-center gap-1"
        >
          <div className="flex gap-6 mb-2 opacity-30">
            <span className="text-[6px] font-mono text-primary tracking-widest">826 0363 775 P512</span>
            <span className="text-[6px] font-mono text-primary tracking-widest">A0. 88. 4. 95</span>
          </div>
          <span className="text-[18px] font-mono font-bold text-primary tracking-[0.2em]">00</span>
          <span className="text-[10px] font-mono font-bold text-primary tracking-[0.5em] uppercase opacity-80">Main Data</span>
          <div className="w-16 h-px bg-primary/20" />
        </motion.div>

        {/* Center Reticle */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          className="relative w-96 h-96 flex items-center justify-center"
        >
           <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute">
             <circle cx="100" cy="100" r="45" stroke="white" strokeWidth="0.5" fill="none" strokeDasharray="1 3" className="opacity-50" />
             <circle cx="100" cy="100" r="35" stroke="white" strokeWidth="1" fill="none" className="opacity-80" />
             <circle cx="100" cy="100" r="1.5" fill="white" />
             
             {/* Cross lines */}
             <line x1="100" y1="80" x2="100" y2="92" stroke="white" strokeWidth="1" />
             <line x1="100" y1="108" x2="100" y2="120" stroke="white" strokeWidth="1" />
             <line x1="80" y1="100" x2="92" y2="100" stroke="white" strokeWidth="1" />
             <line x1="108" y1="100" x2="120" y2="100" stroke="white" strokeWidth="1" />

             {/* Inner brackets */}
             <path d="M85 85 L90 85 L90 90" stroke="white" strokeWidth="0.5" fill="none" />
             <path d="M115 85 L110 85 L110 90" stroke="white" strokeWidth="0.5" fill="none" />
             <path d="M85 115 L90 115 L90 110" stroke="white" strokeWidth="0.5" fill="none" />
             <path d="M115 115 L110 115 L110 110" stroke="white" strokeWidth="0.5" fill="none" />
           </svg>
        </motion.div>

        {/* Side Brackets */}
        <div className="absolute left-[20%] sm:left-[28%] h-64 w-24 flex flex-col justify-between py-8 opacity-20">
           {[...Array(12)].map((_, i) => (
             <div key={i} className="flex items-center gap-2">
               <div className={cn("h-px bg-primary", i % 4 === 0 ? "w-4" : "w-2")} />
               {i % 4 === 0 && <span className="text-[6px] font-mono text-primary">{(100 - i * 8).toString().padStart(3, '0')}</span>}
             </div>
           ))}
        </div>
        <div className="absolute right-[20%] sm:right-[28%] h-64 w-24 flex flex-col justify-between py-8 items-end opacity-20">
           {[...Array(12)].map((_, i) => (
             <div key={i} className="flex items-center gap-2">
               {i % 4 === 0 && <span className="text-[6px] font-mono text-primary">{(100 - i * 8).toString().padStart(3, '0')}</span>}
               <div className={cn("h-px bg-primary", i % 4 === 0 ? "w-4" : "w-2")} />
             </div>
           ))}
        </div>

        {/* Corner Markers */}
        <div className="absolute top-[25%] left-[25%] flex flex-col gap-1 opacity-20">
          <span className="text-[8px] font-mono text-primary tracking-widest">A06.8024</span>
          <div className="w-4 h-4 border-t border-l border-primary" />
        </div>
        <div className="absolute top-[25%] right-[25%] flex flex-col items-end gap-1 opacity-20">
          <span className="text-[8px] font-mono text-primary tracking-widest">A06.8024</span>
          <div className="w-4 h-4 border-t border-r border-primary" />
        </div>
        <div className="absolute bottom-[25%] left-[25%] flex flex-col gap-1 opacity-20">
          <div className="w-4 h-4 border-b border-l border-primary" />
          <span className="text-[8px] font-mono text-primary tracking-widest">A06.8024</span>
        </div>
        <div className="absolute bottom-[25%] right-[25%] flex flex-col items-end gap-1 opacity-20">
          <div className="w-4 h-4 border-b border-r border-primary" />
          <span className="text-[8px] font-mono text-primary tracking-widest">A06.8024</span>
        </div>

        {/* Scanning Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-12 px-24 opacity-5 pointer-events-none">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const mapRef = React.useRef<MapRef>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // State
  const [viewState, setViewState] = useState({
    longitude: 37.6173,
    latitude: 55.7558,
    zoom: 15.5,
    pitch: 60,
    bearing: -20
  });
  
  const [hoverInfo, setHoverInfo] = useState<BuildingInfo | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<'demo' | 'investor' | 'admin'>('demo');
  const [balance, setBalance] = useState(5000000);
  const [portfolio, setPortfolio] = useState<number[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [basemap, setBasemap] = useState('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
  const [showBuildings, setShowBuildings] = useState(true);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('dark');
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>('none');
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measurementMenuOpen, setMeasurementMenuOpen] = useState(false);
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  const [mapModeMenuOpen, setMapModeMenuOpen] = useState(false);
  const [showParcels, setShowParcels] = useState(false);
  const [isFlyoverActive, setIsFlyoverActive] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'financials' | 'geospatial' | 'tenants' | 'legal'>('financials');
  const [showSoils, setShowSoils] = useState(false);
  const [showWetlands, setShowWetlands] = useState(false);
  const [showInfrastructure, setShowInfrastructure] = useState(false);
  const [hoverSoil, setHoverSoil] = useState<any>(null);
  const [hoverWetland, setHoverWetland] = useState<any>(null);
  const [hoverInfra, setHoverInfra] = useState<any>(null);

  // OSINT Air Traffic States
  const [flights, setFlights] = useState<FlightState[]>([]);
  const [showAirTraffic, setShowAirTraffic] = useState(true);
  const [hoverFlight, setHoverFlight] = useState<any>(null);

  // Terrain Recon Suite states
  const [isReconPanelOpen, setIsReconPanelOpen] = useState(false);
  const [showIsochrones, setShowIsochrones] = useState(false);
  const [travelMode, setTravelMode] = useState<'walk' | 'bike' | 'drive'>('walk');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Admin Creation Suite states
  const [geospatialEditorActive, setGeospatialEditorActive] = useState(false);
  const [drawnVertices, setDrawnVertices] = useState<[number, number][]>([]);
  const [assetCreatorOpen, setAssetCreatorOpen] = useState(false);
  const [lastDrawnPolygon, setLastDrawnPolygon] = useState<number[][][] | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Measurements Calculation
  const calculateDistance = (p1: [number, number], p2: [number, number]) => {
    const R = 6371e3;
    const φ1 = p1[1] * Math.PI/180;
    const φ2 = p2[1] * Math.PI/180;
    const Δφ = (p2[1]-p1[1]) * Math.PI/180;
    const Δλ = (p2[0]-p1[0]) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const totalDistance = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
        dist += calculateDistance(measurePoints[i], measurePoints[i+1]);
    }
    return dist;
  }, [measurePoints]);

  const totalArea = useMemo(() => {
    if (measurePoints.length < 3 || measurementMode !== 'area') return 0;
    // Simple shoelace formula for area (not perfectly geodesic but okay for small areas)
    let area = 0;
    for (let i = 0; i < measurePoints.length; i++) {
      const p1 = measurePoints[i];
      const p2 = measurePoints[(i + 1) % measurePoints.length];
      area += (p1[0] * p2[1]) - (p2[0] * p1[1]);
    }
    return Math.abs(area) * 111319 * 111319 / 2; // Rough conversion to sq m
  }, [measurePoints, measurementMode]);

  // New States
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const [interfaceStyle, setInterfaceStyle] = useState<'tactical' | 'civilian'>(() => {
    const saved = localStorage.getItem('yardsoft_interface_style');
    return (saved === 'civilian' ? 'civilian' : 'tactical');
  });
  const [colorScheme, setColorScheme] = useState('tactical');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [showLogo, setShowLogo] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ pulse, setPulse ] = useState(0);
  const [investorCabinetOpen, setInvestorCabinetOpen] = useState(false);
  const [isUiTourOpen, setIsUiTourOpen] = useState(false);

  // Sync state for entire interface styling (Tactical vs Civilian)
  useEffect(() => {
    localStorage.setItem('yardsoft_interface_style', interfaceStyle);
    if (interfaceStyle === 'tactical') {
      setColorScheme('tactical');
      setMode('dark');
      setMapMode('dark');
      setGridBrightness(0.12);
      setScanlineIntensity(0.3);
      setShowAirTraffic(true);
    } else {
      setColorScheme('arctic'); // Perfect crisp light background with beautiful blue borders
      setMode('light');
      setMapMode('light'); // Positron high-contrast light map
      setGridBrightness(0); // Totally remove target circles & coordinate overlays
      setScanlineIntensity(0); // Totally remove CRT/scanlines blinking elements
      setShowAirTraffic(false); // Civilian tracking disables real-time combat jets
    }
  }, [interfaceStyle]);

  useEffect(() => {
    // Auto trigger UI Tour on onboarding if not dismissed yet
    const hasSeenTour = localStorage.getItem('yardsoft_aegis_tour_dismissed');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsUiTourOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const [authStatusMessage, setAuthStatusMessage] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (authStatusMessage) {
      const timer = setTimeout(() => {
        setAuthStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authStatusMessage]);

  const mapStyles = useMemo(() => ({
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    satellite: {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Esri'
        }
      },
      layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }]
    },
    hybrid: {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Esri'
        },
        'labels': {
          type: 'raster',
          tiles: ['https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'], // This is wrong for labels only
          tileSize: 256
        }
      },
      layers: [
        { id: 'satellite', type: 'raster', source: 'satellite' },
        // Simple hybrid: just imagery for now, labeling with raster tiles is tricky without a proper style.json
      ]
    },
    topo: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  }), []);

  const currentMapStyle = useMemo(() => {
    return (mapStyles as any)[mapMode] || mapStyles.dark;
  }, [mapMode, mapStyles]);
  // Restore mock user from localStorage if present on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('tactical_user');
    const cachedRole = localStorage.getItem('yardsoft_role');
    if (cachedUser && cachedRole) {
      setUser(JSON.parse(cachedUser));
      setUserRole(cachedRole as any);
      setIsAuthReady(true);
    }
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('tactical_user');
        localStorage.removeItem('yardsoft_role');
        setUser(firebaseUser);
        setIsAuthReady(true);
      } else {
        const cachedUser = localStorage.getItem('tactical_user');
        if (!cachedUser) {
          setUser(null);
          setUserRole('demo');
          setPortfolio([]);
          setBalance(5000000);
          setIsAuthReady(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync User Profile from SQLite API
  useEffect(() => {
    if (localStorage.getItem('tactical_user')) return;
    if (!user || !isAuthReady) return;

    const syncUser = async () => {
      try {
        const response = await fetch(`/api/user/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role || 'demo');
          setBalance(data.balance ?? 5000000);
          setPortfolio(data.portfolio || []);
        } else {
          // Initialize new user profile in local SQL
          const newProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'investor',
            balance: 5000000,
            portfolio: [],
            createdAt: new Date().toISOString()
          };
          const createRes = await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProfile)
          });
          if (createRes.ok) {
            const data = await createRes.json();
            setUserRole(data.role);
            setBalance(data.balance);
            setPortfolio(data.portfolio);
          }
        }
      } catch (err) {
        console.error("SQL Sync error:", err);
      }
    };

    syncUser();
  }, [user, isAuthReady]);

  const handleLogin = async (role?: 'demo' | 'investor' | 'admin') => {
    if (role) {
      const mockUser = {
        uid: 'user_' + Math.random().toString(36).substring(2, 11),
        email: role === 'admin' ? 'admin@yardsoft.ru' : 'investor@example.com',
        displayName: role === 'admin' ? 'System Admin' : 'Luka Starik',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + role,
        role: role
      };
      
      setUserRole(role);
      setUser(mockUser);
      localStorage.setItem('tactical_user', JSON.stringify(mockUser));
      localStorage.setItem('yardsoft_role', role);
      setAuthStatusMessage({ text: t.loginSuccess, type: 'success' });
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthStatusMessage({ text: t.loginSuccess, type: 'success' });
    } catch (error: any) {
      if (error && error.code === 'auth/popup-closed-by-user') {
        console.warn("Authentication popup closed by user.");
        setAuthStatusMessage({ text: t.loginWindowClosed, type: 'info' });
        return;
      }
      console.error("Login failed:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setAuthStatusMessage({ text: `${t.loginFailed}${errorMsg}`, type: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('tactical_user');
      localStorage.removeItem('yardsoft_role');
      await signOut(auth);
      setProfileOpen(false);
      setUserRole('demo');
      setPortfolio([]);
      setBalance(5000000);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const [buildingMedia, setBuildingMedia] = useState<Record<number, MediaItem[]>>({});

  // Fetch media for selected building
  useEffect(() => {
    if (selectedBuilding) {
      fetch(`/api/v1/buildings/${selectedBuilding.id}/media`)
        .then(res => res.json())
        .then(data => {
          setBuildingMedia(prev => ({
            ...prev,
            [selectedBuilding.id]: data
          }));
        })
        .catch(err => console.error("Failed to fetch media:", err));
    }
  }, [selectedBuilding]);
  const [isCapturing, setIsCapturing] = useState<'photo' | 'video' | null>(null);

  // Advanced Filters State
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    statuses: ['stable', 'risk', 'anomalous'],
    minRoi: 0,
    owner: ''
  });
  const [gridBrightness, setGridBrightness] = useState(0.1);
  const [scanlineIntensity, setScanlineIntensity] = useState(0.3);

  const [buildingsData, setBuildingsData] = useState<any>(null);

  const portfolioDetailed = useMemo(() => {
    if (!buildingsData || !buildingsData.features) return [];
    return buildingsData.features.filter((f: any) => {
      const id = f.id ?? f.properties?.id;
      return id !== undefined && portfolio.includes(id);
    });
  }, [portfolio, buildingsData]);

  const fetchBuildings = useCallback(async () => {
    const headers: any = {};
    if (user) {
      headers['x-user-id'] = user.uid;
    }
    
    try {
      const res = await fetch('/api/v1/buildings', { headers });
      const data = await res.json();
      setBuildingsData(data);
    } catch (err) {
      console.error("Failed to fetch buildings:", err);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthReady) {
      fetchBuildings();
    }
  }, [isAuthReady, fetchBuildings]);

  const handlePolygonComplete = (coordinates: number[][][]) => {
    soundService.playSuccess();
    setLastDrawnPolygon(coordinates);
    setGeospatialEditorActive(false);
    setDrawnVertices([]);
    setAssetCreatorOpen(true);
  };

  const handleAdminCreateAsset = async (asset: any) => {
    try {
      const res = await fetch('/api/v1/buildings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'x-user-id': user.uid } : {})
        },
        body: JSON.stringify({
          height: asset.height,
          roi: asset.roi,
          status: asset.status,
          owner_id: asset.owner || "admin",
          cost: asset.cost,
          yield: asset.yield,
          coordinates: asset.polygon
        })
      });
      if (res.ok) {
        soundService.playSuccess();
        setLastDrawnPolygon(null);
        await fetchBuildings();
      } else {
        soundService.playDenied();
        console.error("Failed to save building");
      }
    } catch (err) {
      soundService.playDenied();
      console.error("Save building error:", err);
    }
  };

  const handleBulkImport = async (assets: any[]) => {
    try {
      const res = await fetch('/api/v1/buildings/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { 'x-user-id': user.uid } : {})
        },
        body: JSON.stringify({ assets })
      });
      if (res.ok) {
        soundService.playSuccess();
        await fetchBuildings();
      } else {
        soundService.playDenied();
        console.error("Failed to bulk save buildings");
      }
    } catch (err) {
      soundService.playDenied();
      console.error("Bulk save error:", err);
    }
  };

  const toggleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const filteredBuildings = useMemo(() => {
    if (!buildingsData) return null;
    return {
      ...buildingsData,
      features: buildingsData.features.filter((f: any) => {
        const props = f.properties;
        const status = props.status === 1 ? 'stable' : props.status === 2 ? 'risk' : props.status === 3 ? 'anomalous' : 'other';
        if (!filters.statuses.includes(status)) return false;
        if (props.roi < filters.minRoi) return false;
        if (filters.owner && !props.owner?.toLowerCase().includes(filters.owner.toLowerCase())) return false;
        return true;
      })
    };
  }, [buildingsData, filters]);

  const t = useMemo(() => {
    const base = translations[language];
    if (interfaceStyle === 'tactical') {
      return {
        ...base,
        title: language === 'en' ? "YARDSOFT // OSIRIS CORES" : "YARDSOFT // ТАКТИЧЕСКИЙ КОНТУР",
        subtitle: language === 'en' ? "Strategic OSINT Intel Hub // v4.0.2" : "Тактический Контур OSINT // v4.0.2",
        portfolio: language === 'en' ? "Strategic Assets" : "Стратегические Активы",
        balance: language === 'en' ? "Treasury Units" : "Казначейские Кредиты",
        searchPlaceholder: language === 'en' ? "SCAN SATELLITE QUADRANT..." : "СКАНИРОВАТЬ ГЕО-КВАДРАНТ...",
        aiAnalyst: language === 'en' ? "OSIRIS Tactical AI" : "ИИ-Тактик-Аналитик (ОСИРИС)",
        aiPlaceholder: language === 'en' ? "ENTER STRATEGIC QUERY..." : "ВВЕДИТЕ ТАКТИЧЕСКИЙ ЗАПРОС...",
        stable: language === 'en' ? "Stable Perimeter" : "Стабильный Сектор",
        risk: language === 'en' ? "Tactical Anomaly" : "Аномальный Сигнал",
        anomalous: language === 'en' ? "Anomalous Signal" : "Аномальный Сигнал",
        stable_status: language === 'en' ? "Secured" : "Стабилен",
      };
    } else {
      return {
        ...base,
        title: language === 'en' ? "YardSoft Real Estate" : "YardSoft Недвижимость",
        subtitle: language === 'en' ? "Commercial Portfolio Analytics" : "Аналитика Коммерческого Портфеля",
        portfolio: language === 'en' ? "My Property Portfolio" : "Мой Портфель Недвижимости",
        balance: language === 'en' ? "Investment Balance" : "Баланс Счета",
        searchPlaceholder: language === 'en' ? "Search properties, addresses..." : "Поиск адресов, координат...",
        aiAnalyst: language === 'en' ? "Investment Advisor AI" : "Инвестиционный Консультант",
        aiPlaceholder: language === 'en' ? "ASK ABOUT INVESTMENT STRATEGY..." : "СПРОСИТЕ ОБ ИНВЕСТИЦИОННОЙ СТРАТЕГИИ...",
        stable: language === 'en' ? "High Yield Option" : "Доходный Стабильный",
        risk: language === 'en' ? "Under Performance Risk" : "Зона Повышенного Внимания",
        anomalous: language === 'en' ? "Volatile Action Needed" : "Рекомендуется Наблюдение",
        stable_status: language === 'en' ? "Performing" : "Стабилен",
      };
    }
  }, [language, interfaceStyle]);

  // Pulse timer for tactical animations
  useEffect(() => {
    let frame: number;
    const update = () => {
      setPulse((Math.sin(Date.now() / 600) + 1) / 2);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Helper to calculate the 2D centroid center of any building polygon or multipolygon
  const getBuildingCenter = useCallback((buildingId: number): [number, number] | null => {
    if (!buildingsData || !buildingsData.features) return null;
    const feature = buildingsData.features.find((f: any) => f.properties.id === buildingId);
    if (!feature || !feature.geometry) return null;
    
    const { type, coordinates } = feature.geometry;
    if (type === 'Polygon' && coordinates && coordinates[0]) {
      const ring = coordinates[0];
      let sumLng = 0;
      let sumLat = 0;
      ring.forEach((coord: number[]) => {
        sumLng += coord[0];
        sumLat += coord[1];
      });
      return [sumLng / ring.length, sumLat / ring.length];
    } else if (type === 'MultiPolygon' && coordinates && coordinates[0] && coordinates[0][0]) {
      const ring = coordinates[0][0];
      let sumLng = 0;
      let sumLat = 0;
      ring.forEach((coord: number[]) => {
        sumLng += coord[0];
        sumLat += coord[1];
      });
      return [sumLng / ring.length, sumLat / ring.length];
    } else if (type === 'Point' && coordinates) {
      return [coordinates[0], coordinates[1]];
    }
    return null;
  }, [buildingsData]);

  // Keep viewState up-to-date in reference to prevent any dependency rebuild loop
  const viewStateRef = React.useRef(viewState);
  useEffect(() => {
    viewStateRef.current = viewState;
  }, [viewState]);

  const cameraAnimRef = React.useRef<() => void>(null);

  // Smooth cinematic fly to transition helper
  const cleanFlyToCinematic = useCallback((
    targetLng: number,
    targetLat: number,
    targetZoom?: number,
    targetPitch?: number,
    targetBearing?: number,
    duration: number = 2450,
    easing: any = 'cinematic'
  ) => {
    // Disable active drone orbit if flying
    setIsFlyoverActive(false);

    // Cancel current active camera transition
    if (cameraAnimRef.current) {
      cameraAnimRef.current();
    }

    cameraAnimRef.current = animateCamera(
      {
        longitude: viewStateRef.current.longitude,
        latitude: viewStateRef.current.latitude,
        zoom: viewStateRef.current.zoom,
        pitch: viewStateRef.current.pitch,
        bearing: viewStateRef.current.bearing
      },
      {
        longitude: targetLng,
        latitude: targetLat,
        zoom: targetZoom,
        pitch: targetPitch,
        bearing: targetBearing
      },
      duration,
      easing,
      (nextPose) => {
        setViewState(nextPose);
      },
      () => {
        cameraAnimRef.current = null;
      }
    );
  }, []);

  // Automatic Cinematic Snap on Building Selection
  useEffect(() => {
    if (selectedBuilding) {
      const center = getBuildingCenter(selectedBuilding.id);
      if (center) {
        const height = selectedBuilding.properties?.height || 55;
        const optimalZoom = Math.min(18.0, 16.5 + Math.log2(height / 40));
        const optimalPitch = Math.min(75, 55 + height / 10);
        
        // Beautiful framing offsets
        const offsetLng = -0.00015;
        const offsetLat = 0.0001;

        cleanFlyToCinematic(
          center[0] + offsetLng,
          center[1] + offsetLat,
          optimalZoom,
          optimalPitch,
          35, // bearing
          2600, // beautiful 2.6s cinematic glide
          'cinematic'
        );
      }
    }
  }, [selectedBuilding, cleanFlyToCinematic, getBuildingCenter]);

  // Keyboard Hotkeys Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing within input/textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'R') {
        e.preventDefault();
        soundService.playClick();
        setIsReconPanelOpen(prev => !prev);
      } else if (key === 'O') {
        e.preventDefault();
        soundService.playSonar();
        setIsFlyoverActive(prev => !prev);
      } else if (key === 'F') {
        e.preventDefault();
        if (selectedBuilding) {
          soundService.playSonar();
          const center = getBuildingCenter(selectedBuilding.id);
          if (center) {
            cleanFlyToCinematic(center[0], center[1], 17.5, 65, 35, 2500, 'cinematic');
          }
        }
      } else if (key === 'N') {
        e.preventDefault();
        soundService.playClick();
        setViewState(prev => ({ ...prev, bearing: 0 }));
      } else if (key === 'L') {
        e.preventDefault();
        soundService.playClick();
        setViewState(prev => ({ ...prev, pitch: 0 }));
      } else if (key === 'H') {
        e.preventDefault();
        soundService.playSonar();
        setSelectedYear(prev => {
          if (prev === 2010) return 2015;
          if (prev === 2015) return 2020;
          if (prev === 2020) return 2026;
          return 2010;
        });
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const presetIdx = parseInt(e.key) - 1;
        const preset = CAMERA_PRESETS[presetIdx];
        if (preset) {
          soundService.playSonar();
          if (selectedBuilding) {
            const center = getBuildingCenter(selectedBuilding.id);
            if (center) {
              cleanFlyToCinematic(center[0], center[1], preset.zoom, preset.pitch, preset.bearing);
              return;
            }
          }
          cleanFlyToCinematic(37.6173, 55.7558, preset.zoom, preset.pitch, preset.bearing);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBuilding, cleanFlyToCinematic, getBuildingCenter]);

  // Turn-off flyover when modal/selection is closed
  useEffect(() => {
    if (!selectedBuilding) {
      setIsFlyoverActive(false);
    }
  }, [selectedBuilding]);

  // OSINT ADS-B Air Traffic Stream subscription and connection
  useEffect(() => {
    adsbStream.connect();
    const unsubscribe = adsbStream.subscribe((updatedFlights) => {
      setFlights(updatedFlights);
    });

    return () => {
      unsubscribe();
      adsbStream.disconnect();
    };
  }, []);

  // Land id 3D Flyover Tour Engine Effect
  useEffect(() => {
    if (!isFlyoverActive || !selectedBuilding) {
      return;
    }
    const center = getBuildingCenter(selectedBuilding.id);
    if (!center) {
      setIsFlyoverActive(false);
      return;
    }

    let lastTime = performance.now();
    let animationFrameId: number;

    const animate = (time: number) => {
      const delta = time - lastTime;
      // Rotate bearing by 15 degrees per second (0.015 per ms)
      const bearingStep = delta * 0.015;
      lastTime = time;

      setViewState(prev => ({
        ...prev,
        longitude: center[0],
        latitude: center[1],
        bearing: (prev.bearing + bearingStep) % 360,
        pitch: 62,
        zoom: 17.5
      }));

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFlyoverActive, selectedBuilding, getBuildingCenter]);

  // Logo timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowLogo(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorScheme);
    document.documentElement.setAttribute('data-mode', mode);
  }, [colorScheme, mode]);

  // Game State
  const [totalYield, setTotalYield] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);

  // Yield Collection Effect
  useEffect(() => {
    const timer = setInterval(async () => {
      if (portfolio.length > 0 && totalYield > 0) {
        const newBalance = balance + totalYield;
        setBalance(newBalance);

        // Sync to SQLite if logged in
        if (user) {
          try {
            await fetch('/api/user/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: user.uid,
                balance: newBalance
              })
            });
          } catch (err) {
            console.error("Yield sync failed:", err);
          }
        }
      }
    }, 5000); // Collect every 5 seconds
    return () => clearInterval(timer);
  }, [portfolio, totalYield, balance, user]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const queryLower = searchQuery.toLowerCase();
      // Check if it looks like a real-estate or criteria query
      const isRealEstateQuery = queryLower.includes('roi') || 
                               queryLower.includes('cost') || 
                               queryLower.includes('price') ||
                               queryLower.includes('yield') || 
                               queryLower.includes('risk') || 
                               queryLower.includes('stable') || 
                               queryLower.includes('anomaly') || 
                               queryLower.includes('owner') ||
                               queryLower.includes('высота') ||
                               queryLower.includes('доход') ||
                               queryLower.includes('стоимость') ||
                               queryLower.includes('риск') ||
                               queryLower.includes('стабильн') ||
                               queryLower.includes('аномал') ||
                               queryLower.includes('владелец') ||
                               queryLower.includes('apn');

      if (isRealEstateQuery) {
        const smartRes = await fetch('/api/v1/ai/smart-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        });
        if (smartRes.ok) {
          const smartData = await smartRes.json();
          if (smartData.matchingIds && smartData.matchingIds.length > 0) {
            const firstMatchId = smartData.matchingIds[0];
            const center = getBuildingCenter(firstMatchId);
            if (center) {
              mapRef.current?.flyTo({
                center,
                zoom: 17,
                duration: 3000,
                essential: true
              });
              
              const feature = buildingsData?.features.find((f: any) => f.properties.id === firstMatchId);
              if (feature) {
                setSelectedBuilding({
                  id: firstMatchId,
                  properties: feature.properties
                });
              }
            }

            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `[AI NLP Search Analyst]: ${smartData.summary}` }
            ]);
            setChatOpen(true);
            setSearchQuery('');
            soundService.playSuccess();
            return;
          }
        }
      }

      // Default geographic address/coordinates search using OSM Nominatim
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current?.flyTo({
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 16,
          duration: 3000,
          essential: true
        });
        setSearchQuery('');
      } else {
        // Fallback to searching everything with smart-search
        const fallbackRes = await fetch('/api/v1/ai/smart-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          if (fbData.matchingIds && fbData.matchingIds.length > 0) {
            const firstId = fbData.matchingIds[0];
            const center = getBuildingCenter(firstId);
            if (center) {
              mapRef.current?.flyTo({ center, zoom: 17, duration: 3000 });
              const f = buildingsData?.features.find((feat: any) => feat.properties.id === firstId);
              if (f) {
                setSelectedBuilding({ id: firstId, properties: f.properties });
              }
            }
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: `[AI Fallback Parser]: ${fbData.summary}` }
            ]);
            setChatOpen(true);
            setSearchQuery('');
            soundService.playSuccess();
            return;
          }
        }
        console.warn("No search results found:", searchQuery);
        soundService.playDenied();
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, getBuildingCenter, buildingsData, soundService, setSelectedBuilding]);

  const basemaps = [
    { id: 'dark', name: 'Dark Matter', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
    { id: 'light', name: 'Positron', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
    { id: 'voyager', name: 'Voyager', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
  ];

  // Gemini Initialization
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  // Rule 1: "Quiet" Frontend - Layers
  const layers = useMemo(() => [
    showBuildings && filteredBuildings ? createBuildingsLayer(
      filteredBuildings,
      (info) => setHoverInfo(info),
      (info) => {
        if (measurementMode === 'none') {
          setSelectedBuilding(info);
        }
      },
      pulse,
      selectedBuilding?.id || null,
      viewState.zoom
    ) : null,

    // Geospatial Drawing Layers
    geospatialEditorActive && drawnVertices.length > 0 && new ScatterplotLayer({
      id: 'draw-points',
      data: drawnVertices,
      getPosition: (d: any) => d,
      getRadius: 2,
      getFillColor: [239, 68, 68], // vibrant tactical red
      getLineColor: [255, 255, 255],
      getLineWidth: 1,
      stroked: true,
      radiusMinPixels: 4,
      pickable: false
    }),

    geospatialEditorActive && drawnVertices.length > 1 && new PathLayer({
      id: 'draw-line',
      data: [{ path: drawnVertices }],
      getPath: (d: any) => d.path,
      getColor: [239, 68, 68, 200],
      getWidth: 3,
      widthMinPixels: 2,
      pickable: false
    }),

    geospatialEditorActive && drawnVertices.length > 2 && new PolygonLayer({
      id: 'draw-poly',
      data: [{ polygon: drawnVertices }],
      getPolygon: (d: any) => d.polygon,
      getFillColor: [239, 68, 68, 60],
      getLineColor: [239, 68, 68],
      getLineWidth: 2,
      pickable: false
    }),

    // Measurement Layers
    measurementMode !== 'none' && measurePoints.length > 0 && new ScatterplotLayer({
      id: 'measure-points',
      data: measurePoints,
      getPosition: (d: any) => d,
      getRadius: 2,
      getFillColor: [34, 197, 94], // primary green
      getLineColor: [255, 255, 255],
      getLineWidth: 1,
      stroked: true,
      radiusMinPixels: 4,
      pickable: false
    }),

    measurementMode !== 'none' && measurePoints.length > 1 && new PathLayer({
      id: 'measure-line',
      data: [{ path: measurePoints }],
      getPath: (d: any) => d.path,
      getColor: [34, 197, 94, 200],
      getWidth: 3,
      widthMinPixels: 2,
      pickable: false
    }),

    measurementMode === 'area' && measurePoints.length > 2 && new PolygonLayer({
      id: 'measure-poly',
      data: [{ polygon: measurePoints }],
      getPolygon: (d: any) => d.polygon,
      getFillColor: [34, 197, 94, 60],
      getLineColor: [34, 197, 94],
      getLineWidth: 2,
      pickable: false
    }),

    // Simulated Parcels (id.land feature)
    showParcels && viewState.zoom >= 14 && new PolygonLayer({
      id: 'parcels',
      data: ((): any[] => {
        const parcels = [];
        const step = 0.0015; 
        const latBase = Math.round(viewState.latitude / step) * step;
        const lonBase = Math.round(viewState.longitude / step) * step;
        for (let i = -6; i <= 6; i++) {
          for (let j = -6; j <= 6; j++) {
            const lat = latBase + i * step;
            const lon = lonBase + j * step;
            parcels.push([
                [lon, lat],
                [lon + step * 0.95, lat],
                [lon + step * 0.95, lat + step * 0.95],
                [lon, lat + step * 0.95],
                [lon, lat]
            ]);
          }
        }
        return parcels;
      })(),
      getPolygon: (d: any) => d,
      getFillColor: [255, 255, 255, 10],
      getLineColor: [255, 255, 255, 60],
      getLineWidth: 0.5,
      lineWidthMinPixels: 1,
      pickable: false
    }),

    // Simulated Soil Properties Overlay
    showSoils && viewState.zoom >= 13 && new PolygonLayer({
      id: 'soil-classification',
      data: ((): any[] => {
        const zones = [];
        const step = 0.003; 
        const latBase = Math.round(viewState.latitude / step) * step;
        const lonBase = Math.round(viewState.longitude / step) * step;
        const types = [
          { name: 'Sandy Loam // Ap-SL', color: [168, 85, 247], code: 'Ap-SL' },
          { name: 'Silty Clay // Bt-SC', color: [59, 130, 246], code: 'Bt-SC' },
          { name: 'Heavy Clay loam // Ah-CL', color: [16, 185, 129], code: 'Ah-CL' },
          { name: 'Loamy Sand // Ap-LS', color: [245, 158, 11], code: 'Ap-LS' }
        ];
        for (let i = -5; i <= 5; i++) {
          for (let j = -5; j <= 5; j++) {
            const lat = latBase + i * step;
            const lon = lonBase + j * step;
            const typeIdx = Math.abs((i * 7 + j * 13)) % types.length;
            const t = types[typeIdx];
            zones.push({
              polygon: [
                [lon, lat],
                [lon + step * 0.96, lat],
                [lon + step * 0.96, lat + step * 0.96],
                [lon, lat + step * 0.96],
                [lon, lat]
              ],
              name: t.name,
              code: t.code,
              color: t.color
            });
          }
        }
        return zones;
      })(),
      getPolygon: (d: any) => d.polygon,
      getFillColor: (d: any): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 40],
      getLineColor: (d: any): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 120],
      getLineWidth: 1.5,
      lineWidthMinPixels: 1,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          setHoverSoil({ ...info.object, x: info.x, y: info.y });
        } else {
          setHoverSoil(null);
        }
      },
      updateTriggers: {
        getFillColor: [viewState.latitude, viewState.longitude],
        getLineColor: [viewState.latitude, viewState.longitude]
      }
    }),

    // Simulated Wetlands Overlay
    showWetlands && viewState.zoom >= 13 && new PolygonLayer({
      id: 'wetlands-overlay',
      data: ((): any[] => {
        const wetlands = [];
        const step = 0.0025;
        const latBase = Math.round(viewState.latitude / step) * step;
        const lonBase = Math.round(viewState.longitude / step) * step;
        const zones = [
          { type: 'Palustrine Forested Wetland // NWI-PFO1A', color: [14, 116, 144] },
          { type: 'FEMA Floodway // Zone AE - 100YR', color: [239, 68, 68] },
          { type: 'Freshwater Emergent Wetland // NWI-PEM1C', color: [3, 105, 161] }
        ];
        for (let i = -6; i <= 6; i++) {
          for (let j = -6; j <= 6; j++) {
            if ((i + j) % 3 === 0) {
              const lat = latBase + i * step + 0.0003;
              const lon = lonBase + j * step + 0.0003;
              const zIdx = Math.abs((i * 11 + j * 17)) % zones.length;
              const z = zones[zIdx];
              wetlands.push({
                polygon: [
                  [lon, lat],
                  [lon + step * 0.7, lat + step * 0.2],
                  [lon + step * 0.6, lat + step * 0.8],
                  [lon + step * 0.1, lat + step * 0.7],
                  [lon, lat]
                ],
                type: z.type,
                color: z.color
              });
            }
          }
        }
        return wetlands;
      })(),
      getPolygon: (d: any) => d.polygon,
      getFillColor: (d: any): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 45],
      getLineColor: (d: any): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 160],
      getLineWidth: 2,
      lineWidthMinPixels: 1.5,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          setHoverWetland({ ...info.object, x: info.x, y: info.y });
        } else {
          setHoverWetland(null);
        }
      },
      updateTriggers: {
        getFillColor: [viewState.latitude, viewState.longitude]
      }
    }),

    // Simulated Infrastructure Corridor Path Layer
    showInfrastructure && viewState.zoom >= 12 && new PathLayer({
      id: 'infra-corridors',
      data: ((): any[] => {
        const lines = [];
        const step = 0.015;
        const latBase = Math.round(viewState.latitude / step) * step;
        const lonBase = Math.round(viewState.longitude / step) * step;
        
        lines.push({
          path: [
            [lonBase - 0.05, latBase + 0.003],
            [lonBase + 0.05, latBase + 0.003]
          ],
          name: 'HV Transmission Corridor // 500kV Grid',
          color: [249, 115, 22]
        });
        
        lines.push({
          path: [
            [lonBase + 0.004, latBase - 0.05],
            [lonBase + 0.004, latBase + 0.05]
          ],
          name: 'HP Natural Gas Pipeline // 1200 PSI Trunk',
          color: [234, 179, 8]
        });
        
        return lines;
      })(),
      getPath: (d: any) => d.path,
      getColor: (d: any) => d.color,
      getWidth: 5,
      widthMinPixels: 2.5,
      pickable: true,
      onHover: (info: any) => {
        if (info.object) {
          setHoverInfra({ ...info.object, x: info.x, y: info.y });
        } else {
          setHoverInfra(null);
        }
      },
      updateTriggers: {
        getColor: [viewState.latitude, viewState.longitude]
      }
    }),

    // Simulated Isochrone rings Layer
    showIsochrones && selectedBuilding && getBuildingCenter(selectedBuilding.id) && new GeoJsonLayer({
      id: 'isochrones-layer',
      data: generateFullIsochroneGeoJSON(getBuildingCenter(selectedBuilding.id)!, travelMode),
      pickable: true,
      stroked: true,
      filled: true,
      extruded: false,
      getFillColor: (f: any) => {
        const mins = f.properties.minutes;
        if (mins === 5) return [16, 185, 129, 35];   // 5 min - emerald (translucent)
        if (mins === 10) return [245, 158, 11, 25];  // 10 min - amber
        return [239, 68, 68, 15];                    // 15 min - rose
      },
      getLineColor: (f: any) => {
        const mins = f.properties.minutes;
        if (mins === 5) return [16, 185, 129, 110];
        if (mins === 10) return [245, 158, 11, 90];
        return [239, 68, 68, 70];
      },
      getLineWidth: 2,
      lineWidthMinPixels: 1.5,
      updateTriggers: {
        getFillColor: [selectedBuilding, travelMode],
        getLineColor: [selectedBuilding, travelMode]
      }
    }),

    // OSINT Air Traffic Layers (Trips, points, texts)
    ...createAirTrafficLayer(flights, (info) => setHoverFlight(info), userRole, showAirTraffic)
  ].filter(Boolean), [showBuildings, filteredBuildings, pulse, selectedBuilding, viewState.zoom, measurementMode, measurePoints, showParcels, showSoils, showWetlands, showInfrastructure, geospatialEditorActive, drawnVertices, viewState.latitude, viewState.longitude, showIsochrones, travelMode, getBuildingCenter, flights, showAirTraffic, userRole]);

  const handleBuyBuilding = async (id: number, cost: number, yieldAmount: number) => {
    if (balance >= cost && !portfolio.includes(id)) {
      const newBalance = balance - cost;
      const newPortfolio = [...portfolio, id];
      
      setBalance(newBalance);
      setPortfolio(newPortfolio);
      setTotalYield(prev => prev + yieldAmount);
      setPortfolioValue(prev => prev + cost);

      // Sync to SQLite if logged in
      if (user) {
        try {
          await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: user.uid,
              balance: newBalance,
              portfolio: newPortfolio
            })
          });
        } catch (err) {
          console.error("SQL Save error:", err);
        }
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/v1/buildings');
      const data = await response.json();
      const buildings = data.features || [];

      const rows = buildings.map((f: any) => {
        const p = f.properties;
        const row: any = { id: p.id, height: p.height };
        
        if (userRole === 'investor' || userRole === 'admin') {
          row.market_value = p.cost;
          row.monthly_yield = p.yield;
          row.roi = p.roi;
          row.status = p.status === 2 ? 'Risk' : 'Stable';
        } else {
          row.market_value = p.cost;
        }

        if (userRole === 'admin') {
          row.owner = p.owner || 'Restricted';
        }

        return row;
      });

      if (rows.length === 0) return;

      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yardsoft_export_${userRole}_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const startCapture = async (type: 'photo' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: type === 'video' 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCapturing(type);
    } catch (err) {
      console.error("Failed to access media devices:", err);
    }
  };

  const stopCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(null);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !selectedBuilding) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const url = canvas.toDataURL('image/jpeg');
      
      try {
        const res = await fetch(`/api/v1/buildings/${selectedBuilding.id}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'photo', url })
        });
        const newItem = await res.json();
        
        setBuildingMedia(prev => ({
          ...prev,
          [selectedBuilding.id]: [newItem, ...(prev[selectedBuilding.id] || [])]
        }));
        stopCapture();
      } catch (err) {
        console.error("Failed to save photo:", err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBuilding) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const url = reader.result as string;
      try {
        const res = await fetch(`/api/v1/buildings/${selectedBuilding.id}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'photo', url })
        });
        const newItem = await res.json();
        
        setBuildingMedia(prev => ({
          ...prev,
          [selectedBuilding.id]: [newItem, ...(prev[selectedBuilding.id] || [])]
        }));
      } catch (err) {
        console.error("Failed to upload photo:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const averageROI = useMemo(() => {
    if (portfolioValue === 0) return 0;
    return (totalYield * 12 / portfolioValue) * 100;
  }, [totalYield, portfolioValue]);

  // Rule 3: AI Agent Tooling (Function Calling)
  const searchBuildingsTool = {
    name: "search_buildings",
    parameters: {
      type: Type.OBJECT,
      description: "Search for buildings based on geographic and business metrics.",
      properties: {
        center_lat: { type: Type.NUMBER, description: "Latitude of search center" },
        center_lon: { type: Type.NUMBER, description: "Longitude of search center" },
        radius_m: { type: Type.NUMBER, description: "Search radius in meters" },
        min_roi: { type: Type.NUMBER, description: "Minimum ROI percentage" },
        status: { type: Type.STRING, description: "Building status (active, risk, sold)" }
      },
      required: ["center_lat", "center_lon", "radius_m"]
    }
  };

  const analyzeBuildingTool = {
    name: "analyze_building",
    parameters: {
      type: Type.OBJECT,
      description: "Analyze a specific building's investment potential by querying its market value, monthly yield, and ROI.",
      properties: {
        building_id: { type: Type.NUMBER, description: "The unique ID of the building to analyze." }
      },
      required: ["building_id"]
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({ 
            role: m.role === 'user' ? 'user' : 'model', 
            parts: [{ text: m.content }] 
          })), 
          { role: 'user', parts: [{ text: currentInput }] }
        ],
        config: {
          systemInstruction: "You are a real estate analyst for YardSoft. Use the search_buildings tool to find properties and analyze_building to get detailed investment metrics for a specific building. Always provide a concise investment recommendation based on the data.",
          tools: [{ functionDeclarations: [searchBuildingsTool, analyzeBuildingTool] }]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          let toolData;
          if (call.name === 'search_buildings') {
            const res = await fetch('/api/v1/ai/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(call.args)
            });
            toolData = await res.json();
          } else if (call.name === 'analyze_building') {
            const res = await fetch('/api/v1/ai/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(call.args)
            });
            toolData = await res.json();
          }

          if (toolData) {
            const finalResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: [
                { role: 'user', parts: [{ text: currentInput }] },
                { role: 'model', parts: [{ text: `Executing ${call.name}...` }] },
                { role: 'user', parts: [{ text: `Tool result: ${JSON.stringify(toolData)}` }] }
              ]
            });
            
            setMessages(prev => [...prev, { role: 'assistant', content: finalResponse.text || "I've analyzed the data for you." }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm not sure how to help with that." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppErrorBoundary>
      <div className="relative w-full h-screen bg-base overflow-hidden font-sans text-slate-200">
      
      {/* Cinematic Overlays */}
      {interfaceStyle === 'tactical' && (
        <>
          <div className="cinematic-overlay" />
          <div className="cinematic-vignette" />
          <TacticalHUD />

          {/* Tactical Alert Banner */}
          <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: [0, 1, 1, 0], y: [ -20, 0, 0, -20] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 10 }}
              className="bg-white/20 border border-white/50 px-4 py-1 rounded flex items-center gap-3 backdrop-blur-sm"
            >
              <AlertTriangle className="w-3 h-3 text-white animate-pulse" />
              <span className="text-[8px] font-mono font-bold text-white uppercase tracking-[0.3em]">Warning: Market_Anomaly_Detected // Sector_01</span>
            </motion.div>
          </div>

          {/* Tactical Compass (Image 1 Inspiration) */}
          <div className="absolute top-24 right-6 z-40 pointer-events-none hidden lg:block">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full text-primary/20">
                <circle cx="48" cy="48" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="48" cy="48" r="36" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </svg>
              <motion.div 
                animate={{ rotate: viewState.bearing }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-px h-full bg-primary/40 absolute top-0 left-1/2" />
                <div className="w-full h-px bg-primary/40 absolute top-1/2 left-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[8px] font-mono font-bold text-primary">N</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-[8px] font-mono font-bold text-slate-500">S</div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 text-[8px] font-mono font-bold text-slate-500">W</div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 text-[8px] font-mono font-bold text-slate-500">E</div>
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-accent),1)]" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Logo Splash */}
      <AnimatePresence>
        {showLogo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-base pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary-accent),0.3)] mb-6">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <h1 className="homm-heading text-4xl sm:text-6xl tracking-[0.3em] sm:tracking-[0.5em]">{t.title}</h1>
              <p className="text-[8px] sm:text-xs text-primary font-mono mt-4 tracking-[0.5em] sm:tracking-[1em] uppercase opacity-50">{t.subtitle}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20" />
      </div>

      {/* Search Bar */}
      <div className="absolute top-20 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="framer-glass rounded-xl flex items-center px-4 py-2 group focus-within:ring-1 ring-primary/30 transition-all">
            <div className="relative flex items-center justify-center">
              <Search className={cn("w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors", isSearching && "opacity-0")} />
              {isSearching && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent border-none outline-none px-3 text-xs font-display tracking-widest text-slate-200 placeholder:text-slate-600"
            />
            <div className="flex items-center gap-2">
              {searchQuery.trim() && (
                <motion.button 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={handleSearch}
                  className="p-1 hover:bg-white/5 rounded-lg text-primary transition-colors"
                  title="Execute Search"
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              )}
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  "p-1 rounded-lg transition-colors flex items-center gap-1.5",
                  filtersOpen ? "bg-primary/20 text-primary" : "glass-hover text-slate-500"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {filtersOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-slate-500 bg-slate-800/30 px-1.5 py-0.5 rounded border border-white/5">
                <Command className="w-2.5 h-2.5" />
                <span>ENTER</span>
              </div>
            </div>
          </div>

          {/* Advanced Filters Dropdown */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                className="framer-glass rounded-2xl p-6 shadow-2xl space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.status}</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'stable', label: t.stable_status, color: 'text-white' },
                        { id: 'risk', label: t.risk, color: 'text-white' },
                        { id: 'anomalous', label: t.anomalous, color: 'text-slate-400' }
                      ].map(status => (
                        <button
                          key={status.id}
                          onClick={() => toggleStatusFilter(status.id)}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left",
                            filters.statuses.includes(status.id) 
                              ? "bg-white/5 border-white/10 shadow-inner" 
                              : "border-transparent opacity-40 grayscale hover:grayscale-0 hover:opacity-70"
                          )}
                        >
                          {filters.statuses.includes(status.id) ? (
                            <CheckSquare className={cn("w-4 h-4", status.color)} />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                          <span className={cn("text-[10px] font-bold uppercase tracking-widest", status.color)}>
                            {status.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.minRoi} (%)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range"
                        min="0"
                        max="30"
                        value={filters.minRoi}
                        onChange={(e) => setFilters(prev => ({ ...prev, minRoi: parseInt(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-mono text-primary w-8">{filters.minRoi}%</span>
                    </div>
                  </div>
                </div>

                {userRole === 'admin' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.ownerAuthority}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input 
                        type="text"
                        value={filters.owner}
                        onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}
                        placeholder={t.ownerPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-xs text-slate-300 outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => setFilters({ statuses: ['stable', 'risk', 'anomalous'], minRoi: 0, owner: '' })}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {t.reset}
                  </button>
                  <button 
                    onClick={() => setFiltersOpen(false)}
                    className="px-6 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-[10px] font-bold uppercase tracking-widest text-primary transition-all"
                  >
                    {t.apply}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Rule 1: High Performance Map */}
      <div className="relative w-full h-full z-0">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={e => setViewState(e.viewState)}
          mapStyle={currentMapStyle}
          style={{ width: '100%', height: '100%' }}
          reuseMaps
          transitionDuration={2000}
          onClick={(e) => {
            if (geospatialEditorActive) {
              const { lngLat } = e;
              setDrawnVertices(prev => [...prev, [lngLat.lng, lngLat.lat]]);
              return;
            }
            if (measurementMode !== 'none') {
               const { lngLat } = e;
               setMeasurePoints(prev => [...prev, [lngLat.lng, lngLat.lat]]);
               return;
            }
          }}
          cursor={geospatialEditorActive ? 'crosshair' : measurementMode !== 'none' ? 'crosshair' : 'grab'}
        >
          <Layer
            id="3d-buildings"
            source="carto"
            source-layer="building"
            type="fill-extrusion"
            minzoom={13}
            paint={{
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0, mode === 'dark' ? '#0f172a' : '#cbd5e1',
                100, mode === 'dark' ? '#1e293b' : '#94a3b8'
              ],
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': 0.8
            }}
          />
          <DeckGLOverlay layers={layers} />
          <ScaleControl position="bottom-right" unit="imperial" />
        </Map>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col p-4 sm:p-4 z-20">
        {/* Authentication Status Notification Banner */}
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <AnimatePresence>
            {authStatusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "px-4 py-2 border rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md text-[10px] font-mono tracking-wider uppercase",
                  authStatusMessage.type === 'error' && "bg-red-950/90 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
                  authStatusMessage.type === 'success' && "bg-emerald-950/90 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                  authStatusMessage.type === 'info' && "bg-slate-900/90 border-slate-700 text-slate-300 shadow-slate-950/20"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  authStatusMessage.type === 'error' && "bg-red-500 animate-pulse",
                  authStatusMessage.type === 'success' && "bg-emerald-500 animate-pulse",
                  authStatusMessage.type === 'info' && "bg-slate-400 animate-pulse"
                )} />
                <span>{authStatusMessage.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tactical Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{ opacity: gridBrightness }}>
          <div className="tactical-grid" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/20 z-20" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white/20 z-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rounded-full z-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white/10 rounded-full z-20" />
          
          {/* Corner Brackets */}
          <div className="absolute top-10 left-10 w-10 h-10 border-t-2 border-l-2 border-white/30 z-20" />
          <div className="absolute top-10 right-10 w-10 h-10 border-t-2 border-r-2 border-white/30 z-20" />
          <div className="absolute bottom-10 left-10 w-10 h-10 border-b-2 border-l-2 border-white/30 z-20" />
          <div className="absolute bottom-10 right-10 w-10 h-10 border-b-2 border-r-2 border-white/30 z-20" />
          
          <div className="scanline-anim" style={{ opacity: scanlineIntensity }} />
        </div>
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 pointer-events-auto">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-accent),0.5)] border border-white/20">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="homm-heading text-2xl">{t.title}</span>
              <span className="text-primary font-display font-light text-lg tracking-[0.3em]">GEO</span>
            </h1>
            <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-[0.4em] font-mono">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Style Selector Pill Widget */}
            <div className="framer-glass flex items-center p-0.5 rounded-full border border-white/10 select-none mr-1">
              <button
                onClick={() => {
                  setInterfaceStyle('tactical');
                  soundService.playSonar();
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all",
                  interfaceStyle === 'tactical'
                    ? "bg-red-600 text-white font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                    : "text-slate-400 hover:text-slate-200"
                )}
                title="Tactical OSINT Operations HUD"
              >
                <Shield className="w-2.5 h-2.5" />
                <span className="hidden xs:inline">Tactical HUD</span>
              </button>
              <button
                onClick={() => {
                  setInterfaceStyle('civilian');
                  soundService.playClick();
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all",
                  interfaceStyle === 'civilian'
                    ? "bg-emerald-600 text-white font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "text-slate-400 hover:text-slate-600"
                )}
                title="Civilian Asset Advisory Dashboard"
              >
                <TrendingUp className="w-2.5 h-2.5" />
                <span className="hidden xs:inline">Civilian Panel</span>
              </button>
            </div>

            <button 
              onClick={() => setIsReconPanelOpen(!isReconPanelOpen)}
              className={`framer-glass w-8 h-8 rounded-full flex items-center justify-center glass-hover transition-all ${isReconPanelOpen ? 'text-cyan-400 border border-cyan-500/40' : 'text-white/50 hover:text-white'}`}
              title="Terrain Recon Suite (R)"
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
            </button>

            <button 
              onClick={handleExportCSV}
              className="framer-glass w-8 h-8 rounded-full flex items-center justify-center glass-hover transition-all text-white/50 hover:text-white"
              title="Export Map Data (CSV)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="framer-glass w-8 h-8 rounded-full flex items-center justify-center glass-hover transition-all text-white/50 hover:text-white"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-72 framer-glass rounded-xl p-5 z-50 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em]">{t.settings}</h3>
                    <button onClick={() => setSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.theme}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {themes.map(th => (
                          <button
                            key={th}
                            onClick={() => setColorScheme(th)}
                            className={cn(
                              "px-2 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all",
                              colorScheme === th 
                                ? "bg-primary/20 border-primary/50 text-primary" 
                                : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10"
                            )}
                          >
                            {th}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.mode}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMode('light')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all",
                            mode === 'light' 
                              ? "bg-primary/20 border-primary/50 text-primary" 
                              : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          <Sun className="w-3 h-3" />
                          {t.light}
                        </button>
                        <button
                          onClick={() => setMode('dark')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all",
                            mode === 'dark' 
                              ? "bg-primary/20 border-primary/50 text-primary" 
                              : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          <Moon className="w-3 h-3" />
                          {t.dark}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.language}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLanguage('en')}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all",
                            language === 'en' 
                              ? "bg-primary/20 border-primary/50 text-primary" 
                              : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setLanguage('ru')}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all",
                            language === 'ru' 
                              ? "bg-primary/20 border-primary/50 text-primary" 
                              : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          Русский
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sovereign State: Cyber-Military Role Simulator */}
            <div className="hidden md:flex items-center gap-1.5 mr-2 pointer-events-auto bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1">
              <span className="text-[7px] text-slate-500 font-mono font-bold uppercase tracking-widest mr-1">SIM_ROLE:</span>
              <button 
                onClick={() => handleLogin('demo')} 
                className={cn(
                  "px-2 py-0.5 text-[8px] font-mono font-bold tracking-wider rounded transition-all uppercase border",
                  userRole === 'demo' ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]" : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                DEMO
              </button>
              <button 
                onClick={() => handleLogin('investor')} 
                className={cn(
                  "px-2 py-0.5 text-[8px] font-mono font-bold tracking-wider rounded transition-all uppercase border",
                  userRole === 'investor' ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_8px_rgba(var(--primary-accent),0.2)]" : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                INVESTOR
              </button>
              <button 
                onClick={() => handleLogin('admin')} 
                className={cn(
                  "px-2 py-0.5 text-[8px] font-mono font-bold tracking-wider rounded transition-all uppercase border",
                  userRole === 'admin' ? "bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]" : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                )}
              >
                ADMIN
              </button>
            </div>

            {user && (
              <>
                <div className="hidden sm:flex framer-glass rounded-full px-4 py-2 items-center gap-3">
                  <Wallet className="w-3.5 h-3.5 text-secondary" />
                  <div className="flex flex-col">
                    <span className="text-[8px] text-slate-500 uppercase font-bold leading-none tracking-widest">{t.treasury}</span>
                    <span className="text-xs font-mono font-bold text-secondary">
                      ${balance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* UI Tour Walkthrough Activator */}
                <button 
                  onClick={() => {
                    soundService.playSonar();
                    setIsUiTourOpen(true);
                  }}
                  className="hidden sm:flex ml-2 border border-cyan-500/40 bg-cyan-500/10 pl-3 pr-4 py-1.5 items-center gap-2 rounded-xl text-cyan-400 hover:bg-cyan-500/20 transition-all uppercase font-mono tracking-widest text-[9px] font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] active:scale-95 cursor-pointer pointer-events-auto animate-pulse"
                >
                  <Command className="w-3.5 h-3.5" />
                  <span>{language === 'ru' ? 'ИНФО_ТУР' : 'UI_TOUR'}</span>
                </button>

                {/* Console System Activator */}
                <button 
                  onClick={() => setInvestorCabinetOpen(!investorCabinetOpen)}
                  className="hidden sm:flex ml-2 border border-primary/40 bg-primary/10 pl-3 pr-4 py-1.5 items-center gap-2 rounded-xl text-primary hover:bg-primary/20 transition-all uppercase font-mono tracking-widest text-[9px] font-bold shadow-[0_0_15px_rgba(var(--primary-accent),0.2)] active:scale-95 cursor-pointer pointer-events-auto"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span>{userRole === 'admin' ? 'ROOT_CON' : userRole === 'investor' ? 'PORTFOLIO_CON' : 'OBS_CON'}</span>
                </button>
              </>
            )}

            <div className="relative pointer-events-auto">
              {!user ? (
                <button 
                  onClick={() => handleLogin('demo')}
                  className="framer-button h-8 px-4 rounded-full border-primary/30 text-primary hover:bg-primary/10 transition-all shadow-[0_0_15px_rgba(var(--primary-accent),0.2)]"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:inline">{t.signIn}</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-8 h-8 rounded-xl overflow-hidden border-2 border-primary/50 shadow-[0_0_15px_rgba(var(--primary-accent),0.3)] transition-all"
                  >
                    <img 
                      src={user.photoURL || "https://picsum.photos/seed/user/100/100"} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="p-6 bg-white/10 border-b border-slate-800">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-black" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-white">{user.email}</h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Shield className={cn("w-3 h-3", userRole === 'admin' ? "text-white" : "text-slate-400")} />
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                  {userRole === 'demo' ? 'Public Access' : userRole === 'investor' ? 'Investor Mode' : 'System Admin'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <div className="space-y-2">
                            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2">Account Settings</h4>
                            <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors text-sm text-slate-300">
                              <Settings className="w-4 h-4" />
                              Preferences
                            </button>
                            <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors text-sm text-slate-300">
                              <Key className="w-4 h-4" />
                              API Management
                            </button>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-2">API Key</h4>
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-400 flex items-center justify-between">
                              <span>YS-••••••••••••42X</span>
                              <button className="text-white hover:text-slate-200">Copy</button>
                            </div>
                          </div>

                          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors text-sm text-white">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Map Controls */}
        <div className="absolute right-4 sm:right-6 top-20 sm:top-24 flex flex-col gap-3 pointer-events-auto">
          {/* Custom Tools (from id.land) */}
          <div className="flex flex-col items-end gap-3 mb-4">
            {/* Map Mode Selector */}
            <div className="relative pointer-events-auto">
              <button 
                onClick={() => setMapModeMenuOpen(!mapModeMenuOpen)}
                className="framer-glass rounded-xl p-3 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl border border-white/5"
                title={t.mapMode}
              >
                <MapIconUI className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {mapModeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-full mr-3 top-0 w-64 framer-glass rounded-xl p-3 z-50 space-y-4"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-widest px-1">Basemap</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {[
                          { id: 'dark', label: t.dark, icon: Moon },
                          { id: 'satellite', label: t.satellite, icon: Camera },
                          { id: 'hybrid', label: t.hybrid, icon: Eye },
                          { id: 'topo', label: t.topographic, icon: Navigation },
                          { id: 'light', label: t.light, icon: Sun },
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setMapMode(m.id as MapMode); setMapModeMenuOpen(false); }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                              mapMode === m.id ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                            )}
                          >
                            <m.icon className="w-3.5 h-3.5" />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-1.5">
                      <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-widest px-1">Overlays</h4>
                      <button
                        onClick={() => setShowBuildings(!showBuildings)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          showBuildings ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-3.5 h-3.5" />
                          {t.buildings}
                        </div>
                        {showBuildings ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setShowParcels(!showParcels)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          showParcels ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Maximize className="w-3.5 h-3.5" />
                          {t.parcels}
                        </div>
                        {showParcels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setShowSoils(!showSoils)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          showSoils ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                        )}
                        title="USDA Soil Taxonomy zones layer"
                      >
                        <div className="flex items-center gap-3">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          {language === 'en' ? "Soil Taxonomy Overlay" : "Классификация Почв"}
                        </div>
                        {showSoils ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setShowWetlands(!showWetlands)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          showWetlands ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                        )}
                        title="Palustrine Wetlands and FEMA Floodway hazards"
                      >
                        <div className="flex items-center gap-3">
                          <Radar className="w-3.5 h-3.5 text-blue-400" />
                          {language === 'en' ? "Wetlands & Floodplain" : "Зоны Затопления / NWI"}
                        </div>
                        {showWetlands ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setShowInfrastructure(!showInfrastructure)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          showInfrastructure ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                        )}
                        title="HV Electrical grid and high-pressure gas corridors"
                      >
                        <div className="flex items-center gap-3">
                          <Target className="w-3.5 h-3.5 text-amber-500" />
                          {language === 'en' ? "Infrastructure Grids" : "ЛЭП & Трубопроводы"}
                        </div>
                        {showInfrastructure ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => setShowAirTraffic(!showAirTraffic)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          showAirTraffic ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                        )}
                        title="ADS-B Live Air Traffic Layer"
                      >
                        <div className="flex items-center gap-3">
                          <Navigation className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          {language === 'en' ? "OSINT Air Traffic" : "ОСИНТ Авиатрафик"}
                        </div>
                        {showAirTraffic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Measurement Tools */}
            <div className="relative pointer-events-auto">
              <button 
                onClick={() => setMeasurementMenuOpen(!measurementMenuOpen)}
                className={cn(
                  "framer-glass rounded-xl p-3 flex items-center justify-center transition-all shadow-xl border",
                  measurementMode !== 'none' ? "bg-secondary/20 border-secondary text-secondary" : "text-slate-400 hover:text-white border-white/5"
                )}
                title="Measurement Tools"
              >
                <Ruler className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {measurementMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-full mr-3 top-0 w-48 framer-glass rounded-xl p-2 z-50 space-y-1"
                  >
                    {[
                      { id: 'distance', label: t.measureDistance, icon: Ruler },
                      { id: 'area', label: t.measureArea, icon: Maximize },
                      { id: 'none', label: t.clearMeasurements, icon: X },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => { 
                          if (m.id === 'none') {
                            setMeasurementMode('none');
                            setMeasurePoints([]);
                          } else {
                            setMeasurementMode(m.id as MeasurementMode);
                            setMeasurePoints([]);
                          }
                          setMeasurementMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                          measurementMode === m.id ? "bg-secondary text-base" : "text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <m.icon className="w-3.5 h-3.5" />
                        {m.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-col items-end gap-4 z-[120]">
            <div className="flex flex-col apple-glass-dark border border-white/20 rounded-xl p-1.5 gap-1.5 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl bg-black/80 pointer-events-auto">
              {/* Zoom In */}
              <button 
                onClick={() => {
                  setViewState(v => ({ ...v, zoom: Math.min(v.zoom + 1, 20) }));
                  soundService.playClick();
                }}
                className="w-10 h-10 bg-white/5 hover:bg-white/20 border border-white/10 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-white hover:text-cyan-400 transition-all active:scale-95 group"
                title="Zoom In"
              >
                <Plus className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </button>
              
              {/* Zoom Out */}
              <button 
                onClick={() => {
                  setViewState(v => ({ ...v, zoom: Math.max(v.zoom - 1, 1) }));
                  soundService.playClick();
                }}
                className="w-10 h-10 bg-white/5 hover:bg-white/20 border border-white/10 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-white hover:text-cyan-400 transition-all active:scale-95 group"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </button>
              
              <div className="h-px bg-white/10 mx-2" />
              
              {/* Tilt Up */}
              <button 
                onClick={() => {
                  setViewState(v => ({ ...v, pitch: Math.min(v.pitch + 15, 85) }));
                  soundService.playClick();
                }}
                className="w-10 h-10 bg-white/5 hover:bg-white/20 border border-white/10 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-white hover:text-cyan-400 transition-all active:scale-95 group"
                title="Tilt Up"
              >
                <ChevronUp className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </button>
              
              {/* Tilt Down */}
              <button 
                onClick={() => {
                  setViewState(v => ({ ...v, pitch: Math.max(v.pitch - 15, 0) }));
                  soundService.playClick();
                }}
                className="w-10 h-10 bg-white/5 hover:bg-white/20 border border-white/10 hover:border-cyan-500/50 rounded-lg flex items-center justify-center text-white hover:text-cyan-400 transition-all active:scale-95 group"
                title="Tilt Down"
              >
                <ChevronDown className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </button>
              
              <div className="h-px bg-white/10 mx-2" />
              
              {/* Reset Navigation */}
              <button 
                onClick={() => {
                  setViewState(v => ({ 
                    ...v, 
                    pitch: 60, 
                    bearing: -20, 
                    zoom: 15.5,
                    latitude: 55.7558,
                    longitude: 37.6173
                  }));
                  soundService.playSonar();
                }}
                className="w-10 h-10 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800/40 hover:border-cyan-500/60 rounded-lg flex items-center justify-center text-cyan-400 transition-all active:scale-95 group"
                title="Reset Navigation"
              >
                <RotateCcw className="w-4 h-4 group-hover:animate-spin" />
              </button>
            </div>
          </div>
        </div>

        {/* Measurement Display */}
        {measurementMode !== 'none' && measurePoints.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 framer-glass rounded-2xl px-6 py-4 flex flex-col items-center gap-2 pointer-events-auto border border-secondary/30 z-50 shadow-[0_0_40px_rgba(0,0,0,0.4)]"
          >
             <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">{t.measureDistance}</span>
                  <span className="text-xl font-mono font-bold text-secondary">
                    {totalDistance > 1000 ? `${(totalDistance/1000).toFixed(2)} km` : `${totalDistance.toFixed(0)} m`}
                  </span>
                </div>
                {measurementMode === 'area' && measurePoints.length >= 3 && (
                  <>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">{t.measureArea}</span>
                      <span className="text-xl font-mono font-bold text-primary">
                        {(totalArea / 4046.86).toFixed(2)} ac
                      </span>
                    </div>
                  </>
                )}
             </div>
             <div className="flex items-center gap-3 w-full border-t border-white/5 pt-2 mt-1">
                <button 
                  onClick={() => setMeasurePoints([])}
                  className="flex-1 text-[8px] text-slate-400 hover:text-white uppercase font-bold tracking-[0.2em] transition-colors"
                >
                  Reset Points
                </button>
                <div className="w-px h-2 bg-white/10" />
                <button 
                  onClick={() => {
                    setMeasurementMode('none');
                    setMeasurePoints([]);
                  }}
                  className="flex-1 text-[8px] text-red-400 hover:text-red-300 uppercase font-bold tracking-[0.2em] transition-colors"
                >
                  {t.dismiss}
                </button>
             </div>
          </motion.div>
        )}

        {/* Hover Info Widget - Rule 2: Dynamic Data Mapping */}
        <AnimatePresence>
          {hoverInfo && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-auto mb-4 sm:mb-6 w-full max-w-[280px] sm:max-w-xs framer-glass rounded-xl p-4 sm:p-5 pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-4 sm:mb-5">
                <div>
                  <h3 className="text-lg font-display font-bold text-[var(--text-main)] tracking-tight uppercase">{t.sector} #{hoverInfo.id}</h3>
                  <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Sector_ID: {hoverInfo.id}</p>
                </div>
                <div className={cn(
                  "px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                  hoverInfo.properties.status === 2 
                    ? "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                    : "bg-secondary/10 text-secondary border-secondary/30 shadow-[0_0_10px_rgba(var(--secondary-accent),0.2)]"
                )}>
                  {hoverInfo.properties.status === 2 ? t.anomalous : t.stable_status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.elevation}</p>
                  <p className="text-xl font-mono text-[var(--text-main)]">{hoverInfo.properties.height}<span className="text-[10px] text-slate-500 ml-1">m</span></p>
                </div>
                
                {/* Rule 2: RLS Protected Fields */}
                {hoverInfo.properties.roi !== undefined ? (
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-primary uppercase font-bold flex items-center gap-1 tracking-widest">
                      <TrendingUp className="w-2.5 h-2.5" /> Yield_ROI
                    </p>
                    <p className="text-xl font-mono text-primary font-bold">{hoverInfo.properties.roi}<span className="text-[10px] ml-1">%</span></p>
                  </div>
                ) : (
                  <div className="space-y-0.5 opacity-50">
                    <p className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-1 tracking-widest">
                      <Shield className="w-2.5 h-2.5" /> ROI_LOCK
                    </p>
                    <p className="text-[9px] font-display font-medium text-slate-600 italic uppercase">{t.encrypted}</p>
                  </div>
                )}
              </div>

              {/* Game Mechanics: Cost & Buy Button */}
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.marketValue}</p>
                    <p className="text-lg font-mono text-primary font-bold">${(hoverInfo.properties as any).cost?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[8px] text-secondary uppercase font-bold tracking-widest">{t.estRevenue}</p>
                    <p className="text-xs font-mono text-secondary font-bold">+${(hoverInfo.properties as any).yield?.toLocaleString()}<span className="text-[9px] text-slate-500">/{t.cycle}</span></p>
                  </div>
                </div>

                {portfolio.includes(hoverInfo.id) ? (
                  <div className="w-full bg-secondary/10 border border-secondary/30 rounded-lg py-2.5 px-3 flex items-center justify-center gap-2 text-secondary text-[10px] font-display font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(var(--secondary-accent),0.1)]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t.owned}
                  </div>
                ) : (
                  <button 
                    onClick={() => handleBuyBuilding(hoverInfo.id, (hoverInfo.properties as any).cost, (hoverInfo.properties as any).yield)}
                    disabled={balance < (hoverInfo.properties as any).cost || !checkPermission(userRole, 'canTrade')}
                    className={cn(
                      "w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-display font-bold uppercase tracking-[0.2em] transition-all energy-border",
                      balance >= (hoverInfo.properties as any).cost && checkPermission(userRole, 'canTrade')
                        ? "bg-primary text-white hover:bg-primary/80 shadow-[0_0_20px_rgba(var(--primary-accent),0.4)] active:scale-[0.98]"
                        : "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    )}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {checkPermission(userRole, 'canTrade') ? t.buyAsset : '🔒 Demo Only'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Chat - Rule 3: Autonomous Intelligence */}
        <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex flex-col items-end gap-3 pointer-events-auto z-50">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                className="w-[calc(100vw-2rem)] sm:w-80 h-[50vh] sm:h-[450px] max-h-[500px] framer-glass rounded-2xl flex flex-col overflow-hidden"
              >
                <div className="p-3 border-b border-border bg-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary-accent),0.5)]">
                      <Terminal className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-display font-bold text-[var(--text-main)] uppercase tracking-widest">{t.aiAnalyst}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
                        <p className="text-[8px] text-secondary font-mono uppercase tracking-widest">Strategic_Intelligence_Unit</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide bg-[#050505]">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <Radar className="w-6 h-6 text-slate-700 animate-pulse" />
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase leading-relaxed tracking-widest">
                        {t.aiInitial}
                      </p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex flex-col max-w-[85%]",
                      m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}>
                      <div className={cn(
                        "px-3 py-2 rounded-xl text-[10px] font-mono leading-relaxed",
                        m.role === 'user' 
                          ? "bg-primary/20 text-primary border border-primary/30 rounded-tr-none" 
                          : "bg-white/5 text-slate-300 border border-white/10 rounded-tl-none"
                      )}>
                        <span className="opacity-40 mr-1">[{m.role === 'user' ? 'USER' : 'INTEL'}]:</span>
                        {m.content}
                      </div>
                      <span className="text-[7px] text-slate-600 mt-1 uppercase font-mono">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-primary p-2">
                      <div className="flex gap-1">
                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-3 bg-primary" />
                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-3 bg-primary" />
                        <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-3 bg-primary" />
                      </div>
                      <span className="text-[8px] font-mono uppercase tracking-widest animate-pulse">Decrypting_Data...</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-base/80 border-t border-border">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
                      <Terminal className="w-3 h-3" />
                    </div>
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t.aiPlaceholder}
                      className="w-full bg-base border border-border rounded-lg py-2.5 pl-8 pr-10 text-[9px] font-mono tracking-widest text-[var(--text-main)] focus:outline-none focus:border-primary transition-all placeholder:text-slate-700"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isTyping}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-primary rounded-md flex items-center justify-center hover:bg-primary/80 transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(var(--primary-accent),0.3)]"
                    >
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => {
              setChatOpen(!chatOpen);
            }}
            className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-accent),0.4)] hover:scale-105 transition-all active:scale-95 energy-border"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Building Details Modal */}
      <AnimatePresence>
        {selectedBuilding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-base/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(20px)" }}
              className="relative w-full h-full sm:h-auto sm:max-w-xl framer-glass sm:rounded-2xl overflow-hidden flex flex-col max-h-full sm:max-h-[90vh]"
            >
              {/* Header Image / Pattern */}
              <div className="h-24 sm:h-28 bg-gradient-to-br from-primary to-base relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <button 
                  onClick={() => setSelectedBuilding(null)}
                  className="absolute top-3 right-3 p-1.5 bg-base/40 glass-hover rounded-full text-white transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute -bottom-5 left-6 w-12 h-12 bg-primary rounded-xl shadow-[0_0_20px_rgba(var(--primary-accent),0.5)] flex items-center justify-center border-4 border-base">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="p-5 sm:p-6 pt-8 sm:pt-10 overflow-y-auto flex-1 scrollbar-hide">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-[var(--text-main)] tracking-tight uppercase">{t.portfolio}</h2>
                    <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[9px] tracking-widest uppercase">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{t.sector}_01 // ID: {selectedBuilding.id}</span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] border",
                    selectedBuilding.properties.status === 2 
                      ? "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                      : "bg-secondary/10 text-secondary border-secondary/30 shadow-[0_0_10px_rgba(var(--secondary-accent),0.2)]"
                  )}>
                    {selectedBuilding.properties.status === 2 ? t.risk : t.stable}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-3 h-3 text-slate-500" />
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.marketValue}</p>
                    </div>
                    <p className="text-sm sm:text-base font-mono font-bold text-primary">
                      ${(selectedBuilding.properties as any).cost?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-secondary" />
                      <p className="text-[8px] text-secondary uppercase font-bold tracking-widest">{t.monthlyYield}</p>
                    </div>
                    <p className="text-sm sm:text-base font-mono font-bold text-secondary">
                      +${(selectedBuilding.properties as any).yield?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Maximize className="w-3 h-3 text-primary" />
                      <p className="text-[8px] text-primary uppercase font-bold tracking-widest">{t.acreage}</p>
                    </div>
                    <p className="text-sm sm:text-base font-mono font-bold text-primary">
                      {(selectedBuilding.properties.roi ? (selectedBuilding.properties.roi * 0.45).toFixed(2) : 2.45)} ac
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3 h-3 text-slate-500" />
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.parcelID}</p>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-[var(--text-main)] truncate">
                      APN-{(selectedBuilding.id * 1024).toString(16).toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.elevation}</p>
                    </div>
                    <p className="text-sm sm:text-base font-mono font-bold text-[var(--text-main)]">{selectedBuilding.properties.height}m</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3 h-3 text-primary" />
                      <p className="text-[8px] text-primary uppercase font-bold tracking-widest">{t.roiAnalysis}</p>
                    </div>
                    <p className={cn(
                      "text-sm sm:text-base font-mono font-bold",
                      selectedBuilding.properties.roi !== undefined ? "text-primary" : "text-slate-600 italic text-xs"
                    )}>
                      {selectedBuilding.properties.roi !== undefined ? `${selectedBuilding.properties.roi}%` : t.encrypted}
                    </p>
                  </div>
                </div>

                {/* 4-TABBED TACTICAL EXPANSION (YardSoft Aegis) */}
                <div className="mb-6 bg-surface/85 rounded-xl border border-border/80 overflow-hidden font-mono">
                  {/* Tab list */}
                  <div className="flex border-b border-border/75 bg-base/60 text-[8px] xs:text-[9px] font-bold uppercase tracking-wider">
                    <button
                      onClick={() => setActiveModalTab('financials')}
                      className={cn(
                        "flex-1 py-2.5 text-center transition-all border-r border-border/40 focus:outline-none",
                        activeModalTab === 'financials'
                          ? "bg-primary/10 text-primary border-b-2 border-b-primary"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      )}
                    >
                      💰 Financials
                    </button>
                    <button
                      onClick={() => setActiveModalTab('geospatial')}
                      className={cn(
                        "flex-1 py-2.5 text-center transition-all border-r border-border/40 focus:outline-none",
                        activeModalTab === 'geospatial'
                          ? "bg-secondary/10 text-secondary border-b-2 border-b-secondary"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      )}
                    >
                      🛰️ Geospatial
                    </button>
                    <button
                      onClick={() => setActiveModalTab('tenants')}
                      className={cn(
                        "flex-1 py-2.5 text-center transition-all border-r border-border/40 focus:outline-none",
                        activeModalTab === 'tenants'
                          ? "bg-cyan-500/10 text-cyan-400 border-b-2 border-b-cyan-500"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      )}
                    >
                      👥 Tenants
                    </button>
                    <button
                      onClick={() => setActiveModalTab('legal')}
                      className={cn(
                        "flex-1 py-2.5 text-center transition-all focus:outline-none",
                        activeModalTab === 'legal'
                          ? "bg-red-500/10 text-red-400 border-b-2 border-b-red-500"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      )}
                    >
                      📜 Legal (ЕГРН)
                    </button>
                  </div>

                  {/* Tab Body */}
                  <div className="p-4 text-[10.5px] sm:text-xs space-y-3">
                    {/* FINANCIALS TAB */}
                    {activeModalTab === 'financials' && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-slate-500 uppercase text-[8px] font-bold">Рентный Бизнес / Strategy</span>
                          <span className="text-primary font-bold text-[9px] uppercase">READY RENTAL BUSINESS (РРБ)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-slate-300">
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Годовой Валовый Доход (Gross)</p>
                            <p className="text-xs font-bold text-white font-mono">
                              ₽{(((selectedBuilding.properties as any).yield || 0) * 12).toLocaleString() || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Операционная Комиссия (10%)</p>
                            <p className="text-xs font-bold text-red-400 font-mono font-bold">
                              -₽{Math.round((((selectedBuilding.properties as any).yield || 0) * 12 * 0.1)).toLocaleString() || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Чистый Поток NOI (После 10% Fee)</p>
                            <p className="text-xs font-bold text-secondary font-mono font-bold">
                              ₽{Math.round((((selectedBuilding.properties as any).yield || 0) * 12 * 0.9)).toLocaleString() || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Чистый Cap Rate (Окупаемость)</p>
                            <p className="text-xs font-bold text-cyan-400 font-mono font-bold font-bold">
                              {(((selectedBuilding.properties as any).cost || 0) > 0 
                                ? (((selectedBuilding.properties as any).yield * 12 * 0.9) / (selectedBuilding.properties as any).cost * 100).toFixed(2) 
                                : '10.50')}%
                            </p>
                          </div>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                          <div className="flex justify-between text-[8px] font-mono text-slate-400">
                            <span>Капитализация объекта</span>
                            <span className="text-white font-bold">
                              {(((selectedBuilding.properties as any).cost || 0) > 0 
                                ? ((selectedBuilding.properties as any).cost / ((selectedBuilding.properties as any).yield * 12 * 0.9)).toFixed(1) 
                                : '9.5')} лет (Окупаемость)
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1">
                            <div 
                              className="bg-primary h-full rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(10, (10 / (((selectedBuilding.properties as any).cost || 1) / ((selectedBuilding.properties as any).yield * 12 * 0.9 || 1))) * 100))}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GEOSPATIAL TAB */}
                    {activeModalTab === 'geospatial' && (
                      <div className="space-y-2.5 text-slate-300">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-slate-500 uppercase text-[8px] font-bold">Координаты & Пространство</span>
                          <span className="text-secondary font-bold text-[8px] font-mono">Sector H3 // #8811800000ff</span>
                        </div>
                        <div className="space-y-1 bg-black/45 p-2 rounded-lg border border-white/5 text-[9.5px] space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Широта (Lat):</span>
                            <span className="text-slate-200 font-mono font-bold">{selectedBuilding.geometry?.coordinates?.[0]?.[0]?.[1]?.toFixed(6) || '55.748334'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Долгота (Lon):</span>
                            <span className="text-slate-200 font-mono font-bold">{selectedBuilding.geometry?.coordinates?.[0]?.[0]?.[0]?.toFixed(6) || '37.535891'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Высота от земли (Height):</span>
                            <span className="text-slate-200 font-mono font-bold">{selectedBuilding.properties.height || 45}м (Этажность: ~{Math.max(1, Math.round((selectedBuilding.properties.height || 45) / 3.3))})</span>
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-500 leading-relaxed uppercase">
                          * Пространственная привязка выполнена с точностью до 0.1м по СК-95 ЕГРН. Использован суверенный растровый тайлсет Deck.gl.
                        </p>
                      </div>
                    )}

                    {/* TENANTS TAB */}
                    {activeModalTab === 'tenants' && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-slate-500 uppercase text-[8px] font-bold">Tenant Mix & Sentiment</span>
                          <span className="text-cyan-400 font-bold text-[8px] font-mono">92.4% Положительный Сентимент</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                            <div>
                              <p className="text-[10px] font-bold text-white">ООО "ЯрдСофт Технолоджис" (HQ)</p>
                              <p className="text-[7.5px] text-slate-500 uppercase">Якорный Арендатор (Анкор) // Офисы</p>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">60% площади</span>
                          </div>

                          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                            <div>
                              <p className="text-[10px] font-bold text-white">Супермаркет ВкусВилл // Премиум</p>
                              <p className="text-[7.5px] text-slate-500 uppercase">Сопутствующий // Торговля</p>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">25% площади</span>
                          </div>

                          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                            <div>
                              <p className="text-[10px] font-bold text-white">Кофейня Даблби / Рестораны</p>
                              <p className="text-[7.5px] text-slate-500 uppercase">Вспомогательный // Общепит</p>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">15% площади</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LEGAL TAB */}
                    {activeModalTab === 'legal' && (
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                          <span className="text-slate-500 uppercase text-[8px] font-bold">Юридическая экспертиза (Due Diligence)</span>
                          <span className="text-red-400 font-bold text-[8px] font-mono">ЕГРН Реестр РФ</span>
                        </div>
                        
                        <div className="text-[9.5px] font-mono text-slate-300 space-y-1.5 bg-black/40 p-2.5 rounded-lg border border-white/5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Кадастровый номер:</span>
                            <span className="text-slate-200 font-bold">77:01:0001024:{selectedBuilding.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Категория земель:</span>
                            <span className="text-slate-100 font-bold">Населенные пункты (ЗК РФ ст. 7)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">ВРИ (Росреестр П/0336):</span>
                            <span className="text-slate-100 font-bold">4.1 (Предпринимательство / Офисы)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Огнестойкость (123-ФЗ):</span>
                            <span className="text-slate-100 font-bold">Степень II (Коммерческие Мультикомплексы)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Энергоэффективность:</span>
                            <span className="text-slate-100 font-bold text-emerald-400">Класс A+ [Повышенный] // OPEX -25%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Физический износ (ВСН):</span>
                            <span className="text-slate-100 font-bold">12% [Хорошее техническое состояние]</span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[8px]">
                            <span className="text-slate-500">Обременения/Аресты:</span>
                            <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                              ЧИСТО // НЕТ ЗАЛОГОВ И АРЕСТОВ
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Strategic Documentation Section */}
                  <div className="bg-base/40 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-[0.2em]">Strategic Documentation</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsFlyoverActive(!isFlyoverActive)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 border",
                            isFlyoverActive
                              ? "bg-secondary text-slate-950 border-secondary shadow-[0_0_12px_rgba(var(--secondary-accent),0.5)]"
                              : "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
                          )}
                          title="Trigger 3D Flyover"
                        >
                          <RotateCw className={cn("w-3.5 h-3.5", isFlyoverActive && "animate-spin")} />
                          {isFlyoverActive ? (language === 'en' ? "Stop Flyover" : "Окрестности") : (language === 'en' ? "3D Flyover" : "3D Облёт")}
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 bg-secondary/10 glass-hover text-secondary rounded-lg transition-colors"
                          title={t.uploadDocumentation}
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => startCapture('photo')}
                          className="p-1.5 bg-primary/10 glass-hover text-primary rounded-lg transition-colors"
                          title="Capture Photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => startCapture('video')}
                          className="p-1.5 bg-secondary/10 glass-hover text-secondary rounded-lg transition-colors"
                          title="Record Video"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Media Gallery */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {buildingMedia[selectedBuilding.id]?.map((item, i) => (
                        <div key={`${item.id || 'media'}_${i}`} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border group">
                          {item.type === 'photo' ? (
                            <img src={item.url} alt="Documentation" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[7px] font-mono text-white uppercase">{item.type}</span>
                          </div>
                        </div>
                      ))}
                      {(!buildingMedia[selectedBuilding.id] || buildingMedia[selectedBuilding.id].length === 0) && (
                        <div className="w-full py-3 flex flex-col items-center justify-center border-2 border-dashed border-border/30 rounded-lg">
                          <EyeOff className="w-4 h-4 text-slate-700 mb-1" />
                          <p className="text-[7px] text-slate-600 uppercase font-bold tracking-widest">No documentation secured</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Camera Preview Overlay */}
                  <AnimatePresence>
                    {isCapturing && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
                      >
                        <video 
                          ref={videoRef} 
                          className="w-full h-full object-cover"
                          autoPlay 
                          playsInline 
                          muted 
                        />
                        <div className="absolute bottom-12 flex gap-8 items-center">
                          <button 
                            onClick={stopCapture}
                            className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md"
                          >
                            <X className="w-8 h-8" />
                          </button>
                          <button 
                            onClick={isCapturing === 'photo' ? capturePhoto : stopCapture}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
                          >
                            <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform" />
                          </button>
                        </div>
                        <div className="absolute top-12 text-white font-mono text-xs uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                          {isCapturing === 'photo' ? 'Tactical Imaging Mode' : 'Strategic Video Uplink'}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between p-4 bg-base/60 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-600" />
                      <div>
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.currentAuthority}</p>
                        <p className="text-xs font-display font-medium text-slate-300 uppercase tracking-wide">
                          {selectedBuilding.properties.owner || t.restricted}
                        </p>
                      </div>
                    </div>
                    {selectedBuilding.properties.owner && (
                      <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setSelectedBuilding(null)}
                      className="flex-1 bg-surface glass-hover text-slate-400 font-display font-bold py-3 rounded-lg transition-all active:scale-95 uppercase tracking-widest text-[10px] border border-border"
                    >
                      {t.dismiss}
                    </button>
                    {!portfolio.includes(selectedBuilding.id) && (
                      <button 
                        onClick={() => {
                          handleBuyBuilding(selectedBuilding.id, (selectedBuilding.properties as any).cost, (selectedBuilding.properties as any).yield);
                          setSelectedBuilding(null);
                        }}
                        disabled={balance < (selectedBuilding.properties as any).cost || !checkPermission(userRole, 'canTrade')}
                        className={cn(
                          "flex-[2] font-display font-bold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px] energy-border",
                          balance >= (selectedBuilding.properties as any).cost && checkPermission(userRole, 'canTrade')
                            ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-accent),0.4)]" 
                            : "bg-base text-slate-600 cursor-not-allowed border border-border"
                        )}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {checkPermission(userRole, 'canTrade') ? t.buyAsset : '🔒 Demo Only'}
                      </button>
                    )}
                  </div>

                  {/* Live Feed Section (Image 3 Inspiration) */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live_Tactical_Feed
                      </h3>
                      <span className="text-[7px] font-mono text-slate-600 uppercase">Cam_01 // 24FPS</span>
                    </div>
                    <div className="aspect-video bg-black rounded-xl border border-white/5 relative overflow-hidden group">
                      <img 
                        src={`https://picsum.photos/seed/${selectedBuilding.id}/640/360?grayscale`} 
                        alt="Live Feed" 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[8px] font-mono text-white uppercase tracking-widest">Recording...</span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <div className="w-1 h-3 bg-primary/40" />
                        <div className="w-1 h-3 bg-primary/40" />
                        <div className="w-1 h-3 bg-primary/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {hoverInfo && hoverInfo.x !== undefined && hoverInfo.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.1 }}
            style={{ 
              left: hoverInfo.x + 12, 
              top: hoverInfo.y + 12,
              position: 'absolute'
            }}
            className="pointer-events-none z-[100] framer-glass px-2.5 py-1.5 rounded-lg border border-white/10"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary-accent),0.5)]" />
                  <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                    ID: {hoverInfo.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1 h-1 rounded-full",
                    hoverInfo.properties.status === 2 ? "bg-red-500" : "bg-secondary"
                  )} />
                  <span className="text-[7px] font-display font-bold text-slate-500 uppercase tracking-widest">
                    {hoverInfo.properties.status === 2 ? t.anomalous : t.stable_status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">{t.marketValue}</span>
                  <span className="text-[9px] font-mono font-bold text-primary">
                    ${(hoverInfo.properties as any).cost?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[7px] text-secondary uppercase font-bold tracking-widest">{t.monthlyYield}</span>
                  <span className="text-[9px] font-mono font-bold text-secondary">
                    +${(hoverInfo.properties as any).yield?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">{t.elevation}</span>
                  <span className="text-[9px] font-mono font-bold text-white">
                    {hoverInfo.properties.height}m
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Overlays Tooltips */}
      <AnimatePresence>
        {hoverSoil && hoverSoil.x !== undefined && hoverSoil.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            style={{ 
              left: hoverSoil.x + 12, 
              top: hoverSoil.y + 12,
              position: 'absolute'
            }}
            className="pointer-events-none z-[100] bg-zinc-950/90 border border-purple-500/40 text-purple-200 px-3 py-2 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          >
            <div className="flex flex-col gap-1 min-w-[200px]">
              <div className="flex items-center gap-1.5 border-b border-purple-500/20 pb-1 mb-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">USDA Soil Classification</span>
              </div>
              <div className="text-xs font-bold text-white font-display mb-0.5">{hoverSoil.name}</div>
              <div className="flex items-center justify-between text-[8px] font-mono text-purple-300 uppercase">
                <span>Taxonomy Code:</span>
                <span className="bg-purple-500/20 px-1 py-0.5 rounded border border-purple-500/30 text-[9px] font-bold">{hoverSoil.code}</span>
              </div>
            </div>
          </motion.div>
        )}

        {hoverWetland && hoverWetland.x !== undefined && hoverWetland.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            style={{ 
              left: hoverWetland.x + 12, 
              top: hoverWetland.y + 12,
              position: 'absolute'
            }}
            className="pointer-events-none z-[100] bg-zinc-950/90 border border-blue-500/40 text-blue-200 px-3 py-2 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            <div className="flex flex-col gap-1 min-w-[220px]">
              <div className="flex items-center gap-1.5 border-b border-blue-500/20 pb-1 mb-1">
                <Radar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Environmental Intel</span>
              </div>
              <div className="text-xs font-bold text-white font-display mb-0.5">Hydrologic Wetland Hazard</div>
              <div className="text-[9px] font-mono text-blue-300 leading-relaxed">{hoverWetland.type}</div>
              <div className="text-[7px] text-slate-500 font-mono uppercase tracking-widest mt-1">Source: USFWS NWI Dataset</div>
            </div>
          </motion.div>
        )}

        {hoverInfra && hoverInfra.x !== undefined && hoverInfra.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            style={{ 
              left: hoverInfra.x + 12, 
              top: hoverInfra.y + 12,
              position: 'absolute'
            }}
            className="pointer-events-none z-[100] bg-zinc-950/90 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <div className="flex flex-col gap-1 min-w-[220px]">
              <div className="flex items-center gap-1.5 border-b border-amber-500/20 pb-1 mb-1">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Utility Grid Corridor</span>
              </div>
              <div className="text-xs font-bold text-white font-display mb-0.5">Industrial Right-Of-Way</div>
              <div className="text-[9px] font-mono text-amber-300 leading-relaxed">{hoverInfra.name}</div>
              <div className="text-[7px] text-slate-500 font-mono uppercase tracking-widest mt-1">Status: Operational Grid Line</div>
            </div>
          </motion.div>
        )}

        {/* Real-time ADSB Flight Telemetry Overlay Tooltip */}
        {hoverFlight && hoverFlight.x !== undefined && hoverFlight.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            style={{ 
              left: hoverFlight.x + 12, 
              top: hoverFlight.y + 12,
              position: 'absolute'
            }}
            className={cn(
              "pointer-events-none z-[125] bg-zinc-950/95 border text-white px-3 py-2.5 rounded-lg backdrop-blur-md shadow-2xl min-w-[240px]",
              hoverFlight.properties.category === 'MILITARY' ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.25)]" :
              hoverFlight.properties.category === 'GOV' ? "border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]" :
              hoverFlight.properties.category === 'VIP_JET' ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.25)]" :
              "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            )}
          >
            <div className="flex flex-col gap-1.5 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Radar className={cn(
                    "w-3.5 h-3.5",
                    hoverFlight.properties.category === 'MILITARY' ? "text-red-400" :
                    hoverFlight.properties.category === 'GOV' ? "text-purple-400" :
                    hoverFlight.properties.category === 'VIP_JET' ? "text-yellow-400" :
                    "text-cyan-400"
                  )} />
                  <span className="text-[10px] font-bold tracking-wider text-slate-300">OSINT Telemetry</span>
                </div>
                <span className={cn(
                  "text-[8px] px-1 py-0.5 rounded font-bold uppercase",
                  hoverFlight.properties.category === 'MILITARY' ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                  hoverFlight.properties.category === 'GOV' ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                  hoverFlight.properties.category === 'VIP_JET' ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                  "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                )}>
                  {hoverFlight.properties.category}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                <span className="text-slate-400">CALLSIGN</span>
                <span className="font-bold text-white tracking-widest">{hoverFlight.properties.callsign}</span>
              </div>

              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
                <span className="text-slate-400">ICAO HEX</span>
                <span className="text-slate-200">{hoverFlight.properties.icao}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] mt-1">
                <div className="flex justify-between col-span-1">
                  <span className="text-slate-500">ALT:</span>
                  <span className="text-emerald-400 font-bold">{hoverFlight.properties.altitude} m</span>
                </div>
                <div className="flex justify-between col-span-1">
                  <span className="text-slate-500">SPD:</span>
                  <span className="text-cyan-400">{hoverFlight.properties.speed} km/h</span>
                </div>
                <div className="flex justify-between col-span-1">
                  <span className="text-slate-500">LAT:</span>
                  <span className="text-slate-330">{hoverFlight.properties.latitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between col-span-1">
                  <span className="text-slate-500">LON:</span>
                  <span className="text-slate-330">{hoverFlight.properties.longitude.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber-Tactical Cabinets Layer */}
      <AnimatePresence>
        {investorCabinetOpen && userRole === 'demo' && (
          <DemoCabinet 
            isOpen={investorCabinetOpen}
            onClose={() => setInvestorCabinetOpen(false)}
            t={t}
          />
        )}
        {investorCabinetOpen && userRole === 'investor' && (
          <InvestorCabinet 
            isOpen={investorCabinetOpen}
            onClose={() => setInvestorCabinetOpen(false)}
            balance={balance}
            portfolioValue={portfolioValue}
            portfolio={portfolioDetailed}
            onSelectAsset={(asset: any) => setSelectedBuilding(asset)}
            t={t}
          />
        )}
        {investorCabinetOpen && userRole === 'admin' && (
          <AdminCabinet 
            isOpen={investorCabinetOpen}
            onClose={() => setInvestorCabinetOpen(false)}
            buildings={buildingsData?.features || []}
            onTriggerDrawMode={() => setGeospatialEditorActive(true)}
            onTriggerCreateAsset={() => setAssetCreatorOpen(true)}
            onTriggerBulkImport={() => setBulkImportOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Admin Creation Suite Layout Overlays */}
      {userRole === 'admin' && (
        <GeospatialEditor
          viewState={viewState}
          vertices={drawnVertices}
          setVertices={setDrawnVertices}
          onPolygonComplete={handlePolygonComplete}
          isActive={geospatialEditorActive}
          onToggle={() => {
            setGeospatialEditorActive(prev => {
              const next = !prev;
              if (!next) setDrawnVertices([]);
              return next;
            });
          }}
        />
      )}

      <AnimatePresence>
        {assetCreatorOpen && userRole === 'admin' && (
          <AdminAssetCreator
            isOpen={assetCreatorOpen}
            onClose={() => {
              setAssetCreatorOpen(false);
              setLastDrawnPolygon(null);
            }}
            onSubmit={handleAdminCreateAsset}
            initialPolygon={lastDrawnPolygon || undefined}
            user={user}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkImportOpen && userRole === 'admin' && (
          <BulkImportEngine
            isOpen={bulkImportOpen}
            onClose={() => setBulkImportOpen(false)}
            onImport={handleBulkImport}
          />
        )}
      </AnimatePresence>

      {/* Terrain Recon Suite Sidebar Drawer */}
      <AnimatePresence>
        {isReconPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 360 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 360 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed top-0 right-0 h-full w-[360px] z-[80] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto"
          >
            <ReconPanel
              selectedBuilding={selectedBuilding}
              onClose={() => setIsReconPanelOpen(false)}
              language={language}
              showIsochrones={showIsochrones}
              setShowIsochrones={setShowIsochrones}
              travelMode={travelMode}
              setTravelMode={setTravelMode}
              onFlyTo={(lng, lat, zoom, pitch, bearing) => cleanFlyToCinematic(lng, lat, zoom, pitch, bearing)}
              onApplyPreset={(presetId) => {
                let preset;
                if (presetId === 'bird-eye') preset = CAMERA_PRESETS[0];
                else if (presetId === 'drone') preset = CAMERA_PRESETS[1];
                else if (presetId === 'street') preset = CAMERA_PRESETS[2];
                else if (presetId === 'orbit') preset = CAMERA_PRESETS[3];
                else if (presetId === 'strategic') preset = CAMERA_PRESETS[4];
                if (preset) {
                  if (selectedBuilding) {
                    const center = getBuildingCenter(selectedBuilding.id);
                    if (center) {
                      cleanFlyToCinematic(center[0], center[1], preset.zoom, preset.pitch, preset.bearing);
                      return;
                    }
                  }
                  cleanFlyToCinematic(viewState.longitude, viewState.latitude, preset.zoom, preset.pitch, preset.bearing);
                }
              }}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              userRole={userRole}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Tour Walkthrough Onboarding (YardSoft Aegis) */}
      <UITourWalkthrough
        isOpen={isUiTourOpen}
        onClose={() => {
          localStorage.setItem('yardsoft_aegis_tour_dismissed', 'true');
          setIsUiTourOpen(false);
        }}
        language={language}
        onSetSimRole={(role) => handleLogin(role)}
        onToggleCabinet={(open) => setInvestorCabinetOpen(open)}
        onSetSelectedBuilding={(b) => setSelectedBuilding(b)}
        onSetIsFlyoverActive={(active) => setIsFlyoverActive(active)}
      />
    </div>
    </AppErrorBoundary>
  );
}
