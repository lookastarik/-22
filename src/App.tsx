import * as React from 'react';
import { useState, useMemo, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { Map, useControl, Layer, MapRef, ScaleControl } from 'react-map-gl/maplibre';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { 
  PathLayer, 
  ScatterplotLayer, 
  PolygonLayer,
} from '@deck.gl/layers';
import { createBuildingsLayer } from './layers/buildings';
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
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<'anonymous' | 'investor' | 'admin'>('anonymous');
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
  const [colorScheme, setColorScheme] = useState('tactical');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [showLogo, setShowLogo] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ pulse, setPulse ] = useState(0);
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
  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser) {
        setUserRole('anonymous');
        setPortfolio([]);
        setBalance(5000000);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync User Profile from SQLite API
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const syncUser = async () => {
      try {
        const response = await fetch(`/api/user/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role || 'anonymous');
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

  const handleLogin = async () => {
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
      await signOut(auth);
      setProfileOpen(false);
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

  useEffect(() => {
    const fetchBuildings = async () => {
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
    };

    if (isAuthReady) {
      fetchBuildings();
    }
  }, [user, isAuthReady]);

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

  const t = translations[language];

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
        // Show some feedback if no results found
        console.warn("No search results found for:", searchQuery);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

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
    })
  ].filter(Boolean), [showBuildings, filteredBuildings, pulse, selectedBuilding, viewState.zoom, measurementMode, measurePoints, showParcels]);

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
            if (measurementMode !== 'none') {
               const { lngLat } = e;
               setMeasurePoints(prev => [...prev, [lngLat.lng, lngLat.lat]]);
               return;
            }
          }}
          cursor={measurementMode !== 'none' ? 'crosshair' : 'grab'}
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

            {user && (
              <div className="hidden sm:flex framer-glass rounded-full px-4 py-2 items-center gap-3">
                <Wallet className="w-3.5 h-3.5 text-secondary" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase font-bold leading-none tracking-widest">{t.treasury}</span>
                  <span className="text-xs font-mono font-bold text-secondary">
                    ${balance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="relative pointer-events-auto">
              {!user ? (
                <button 
                  onClick={handleLogin}
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
                                  {userRole === 'anonymous' ? 'Public Access' : userRole === 'investor' ? 'Investor Mode' : 'System Admin'}
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
          <div className="flex flex-col items-end gap-4">
            <div className="flex flex-col tactical-glass energy-border rounded-xl overflow-hidden shadow-xl pointer-events-auto">
              <button 
                onClick={() => setViewState(v => ({ ...v, zoom: v.zoom + 1 }))}
                className="p-3 hover:bg-slate-800 transition-colors border-b border-slate-800 text-slate-400"
                title="Zoom In"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewState(v => ({ ...v, zoom: v.zoom - 1 }))}
                className="p-3 hover:bg-slate-800 transition-colors border-b border-slate-800 text-slate-400"
                title="Zoom Out"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewState(v => ({ ...v, pitch: 60, bearing: -20 }))}
                className="p-3 hover:bg-slate-800 transition-colors text-slate-400"
                title="Reset View"
              >
                <RotateCcw className="w-5 h-5" />
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
                    disabled={balance < (hoverInfo.properties as any).cost}
                    className={cn(
                      "w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-display font-bold uppercase tracking-[0.2em] transition-all energy-border",
                      balance >= (hoverInfo.properties as any).cost
                        ? "bg-primary text-white hover:bg-primary/80 shadow-[0_0_20px_rgba(var(--primary-accent),0.4)] active:scale-[0.98]"
                        : "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    )}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {t.buyAsset}
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

                <div className="space-y-4">
                  {/* Strategic Documentation Section */}
                  <div className="bg-base/40 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-[0.2em]">Strategic Documentation</h3>
                      <div className="flex gap-2">
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
                      {buildingMedia[selectedBuilding.id]?.map(item => (
                        <div key={item.id} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border group">
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
                        disabled={balance < (selectedBuilding.properties as any).cost}
                        className={cn(
                          "flex-[2] font-display font-bold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px] energy-border",
                          balance >= (selectedBuilding.properties as any).cost 
                            ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-accent),0.4)]" 
                            : "bg-base text-slate-600 cursor-not-allowed border border-border"
                        )}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {t.buyAsset}
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
    </div>
    </AppErrorBoundary>
  );
}
