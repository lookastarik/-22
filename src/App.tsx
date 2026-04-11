import * as React from 'react';
import { useState, useMemo, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { Map, useControl, Layer, MapRef, Marker } from 'react-map-gl/maplibre';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { createBuildingsLayer } from './layers/buildings';
import { GoogleGenAI, Type } from "@google/genai";
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  getDocFromServer
} from 'firebase/firestore';
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
  ChevronDown,
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
  ChevronUp,
  Lock,
  Upload,
  Activity,
  Cpu,
  Radar,
  Terminal,
  Zap,
  Radio,
  Target,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from './lib/utils';

// Types
interface BuildingInfo {
  id: number | string;
  x?: number;
  y?: number;
  properties: {
    height: number;
    roi?: number;
    status?: number;
    owner?: string;
    title?: string;
    cost?: number;
    yield?: number;
    type?: string;
    address?: string;
    description?: string;
    sqft?: number;
    yearBuilt?: number;
    parkingSpaces?: number;
  };
  geometry?: {
    type: string;
    coordinates: [number, number];
  };
}

interface Asset {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  cost: number;
  yield: number;
  roi: number;
  status: number;
  type: string;
  ownerUid: string;
  address: string;
  description: string;
  sqft?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  createdAt: any;
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
    strategicBriefing: "Strategic Briefing",
    briefingTitle: "MARKET ANALYSIS 2026",
    briefingRisk: "GEOPOLITICAL RISKS",
    briefingOpportunity: "WINDOW OF OPPORTUNITY",
    tacticalDashboard: "Tactical Dashboard",
    systemStatus: "System Status",
    satelliteUplink: "Satellite Uplink",
    activeNodes: "Active Nodes",
    threatLevel: "Threat Level",
    nominal: "Nominal",
    coordinates: "Coordinates",
    globalValuation: "Global Valuation",
    sectorAnalysis: "Sector Analysis",
    gridBrightness: "Grid Intensity",
    scanlineIntensity: "Screen Scanlines",
    buildingScanlines: "Building Scanlines",
    systemConfig: "System Config",
    createAsset: "Create Asset",
    assetTitle: "Asset Title",
    assetType: "Asset Type",
    assetCost: "Initial Cost",
    assetYield: "Monthly Yield",
    assetDescription: "Strategic Description",
    assetAddress: "Strategic Address",
    assetLat: "Latitude",
    assetLon: "Longitude",
    assetCreating: "Initializing Asset...",
    assetCreated: "Asset Secured",
    retail: "Retail",
    office: "Office",
    warehouse: "Warehouse",
    residential: "Residential",
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
    strategicBriefing: "Стратегический Брифинг",
    briefingTitle: "АНАЛИЗ РЫНКА 2026",
    briefingRisk: "ГЕОПОЛИТИЧЕСКИЕ РИСКИ",
    briefingOpportunity: "ОКНО ВОЗМОЖНОСТЕЙ",
    tacticalDashboard: "Тактическая Панель",
    systemStatus: "Статус Системы",
    satelliteUplink: "Спутниковая Связь",
    activeNodes: "Активные Узлы",
    threatLevel: "Уровень Угрозы",
    nominal: "Номинальный",
    coordinates: "Координаты",
    globalValuation: "Глобальная Оценка",
    sectorAnalysis: "Анализ Сектора",
    gridBrightness: "Яркость Сетки",
    scanlineIntensity: "Сканирование Экрана",
    buildingScanlines: "Сканирование Зданий",
    systemConfig: "Конфиг Системы",
    createAsset: "Создать Объект",
    assetTitle: "Название Объекта",
    assetType: "Тип Объекта",
    assetCost: "Стоимость",
    assetYield: "Месячный Доход",
    assetDescription: "Описание",
    assetAddress: "Адрес",
    assetLat: "Широта",
    assetLon: "Долгота",
    assetCreating: "Инициализация Объекта...",
    assetCreated: "Объект Закреплен",
    retail: "Торговля",
    office: "Офис",
    warehouse: "Склад",
    residential: "Жилое",
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

const ParallaxCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      className={cn("depth-card", className)}
    >
      <div style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
};

const TacticalHUD = ({ lat, lon }: { lat: number, lon: number }) => {
  const latInt = Math.abs(Math.floor(lat)).toString().padStart(2, '0');
  const lonInt = Math.abs(Math.floor(lon)).toString().padStart(2, '0');
  
  const latDec = (Math.abs(lat) % 1).toFixed(4).substring(2);
  const lonDec = (Math.abs(lon) % 1).toFixed(4).substring(2);

  return (
    <div className="fixed inset-0 pointer-events-none z-[55] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Main Data Top */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[8%] sm:top-[12%] flex flex-col items-center gap-1 scale-75 sm:scale-100"
        >
          <div className="w-16 h-px bg-primary/20" />
          <span className="text-[10px] font-mono font-bold text-primary tracking-[0.5em] uppercase opacity-80">Main Data</span>
          <span className="text-[18px] font-mono font-bold text-primary tracking-[0.2em]">{latInt}.<span className="text-xs opacity-50">{latDec}</span></span>
          <div className="flex gap-6 mt-2 opacity-30">
            <span className="text-[6px] font-mono text-primary tracking-widest">{lat.toFixed(6)}</span>
            <span className="text-[6px] font-mono text-primary tracking-widest">A0. {latDec}. {lonDec}</span>
          </div>
        </motion.div>

        {/* Main Data Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-[8%] sm:bottom-[12%] flex flex-col items-center gap-1 scale-75 sm:scale-100"
        >
          <div className="flex gap-6 mb-2 opacity-30">
            <span className="text-[6px] font-mono text-primary tracking-widest">{lon.toFixed(6)}</span>
            <span className="text-[6px] font-mono text-primary tracking-widest">A0. {latDec}. {lonDec}</span>
          </div>
          <span className="text-[18px] font-mono font-bold text-primary tracking-[0.2em]">{lonInt}.<span className="text-xs opacity-50">{lonDec}</span></span>
          <span className="text-[10px] font-mono font-bold text-primary tracking-[0.5em] uppercase opacity-80">Main Data</span>
          <div className="w-16 h-px bg-primary/20" />
        </motion.div>

        {/* Center Reticle */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          className="relative w-64 h-64 sm:w-96 sm:h-96 flex items-center justify-center"
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
        <div className="absolute left-[5%] sm:left-[28%] h-64 w-24 hidden sm:flex flex-col justify-between py-8 opacity-20 scale-75 sm:scale-100">
           {[...Array(12)].map((_, i) => (
             <div key={i} className="flex items-center gap-2">
               <div className={cn("h-px bg-primary", i % 4 === 0 ? "w-4" : "w-2")} />
               {i % 4 === 0 && <span className="text-[6px] font-mono text-primary">{(100 - i * 8).toString().padStart(3, '0')}</span>}
             </div>
           ))}
        </div>
        <div className="absolute right-[5%] sm:right-[28%] h-64 w-24 hidden sm:flex flex-col justify-between py-8 items-end opacity-20 scale-75 sm:scale-100">
           {[...Array(12)].map((_, i) => (
             <div key={i} className="flex items-center gap-2">
               {i % 4 === 0 && <span className="text-[6px] font-mono text-primary">{(100 - i * 8).toString().padStart(3, '0')}</span>}
               <div className={cn("h-px bg-primary", i % 4 === 0 ? "w-4" : "w-2")} />
             </div>
           ))}
        </div>

        {/* Corner Markers */}
        <div className="absolute top-[15%] sm:top-[25%] left-[10%] sm:left-[25%] hidden sm:flex flex-col gap-1 opacity-20 scale-75 sm:scale-100">
          <span className="text-[8px] font-mono text-primary tracking-widest">A06.8024</span>
          <div className="w-4 h-4 border-t border-l border-primary" />
        </div>
        <div className="absolute top-[15%] sm:top-[25%] right-[10%] sm:right-[25%] hidden sm:flex flex-col items-end gap-1 opacity-20 scale-75 sm:scale-100">
          <span className="text-[8px] font-mono text-primary tracking-widest">A06.8024</span>
          <div className="w-4 h-4 border-t border-r border-primary" />
        </div>
        <div className="absolute bottom-[15%] sm:bottom-[25%] left-[10%] sm:left-[25%] hidden sm:flex flex-col gap-1 opacity-20 scale-75 sm:scale-100">
          <div className="w-4 h-4 border-b border-l border-primary" />
          <span className="text-[8px] font-mono text-primary tracking-widest">A06.8024</span>
        </div>
        <div className="absolute bottom-[15%] sm:bottom-[25%] right-[10%] sm:right-[25%] hidden sm:flex flex-col items-end gap-1 opacity-20 scale-75 sm:scale-100">
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
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
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
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // New States
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const [colorScheme, setColorScheme] = useState('tactical');
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [showLogo, setShowLogo] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchMarker, setSearchMarker] = useState<{ lat: number, lon: number, name: string } | null>(null);
  const [pulse, setPulse] = useState(0);
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
    } catch (error) {
      console.error("Login failed:", error);
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
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Advanced Filters State
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    statuses: ['stable', 'risk', 'anomalous'],
    minRoi: 0,
    owner: ''
  });
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [gridBrightness, setGridBrightness] = useState(0.1);
  const [scanlineIntensity, setScanlineIntensity] = useState(0.3);
  const [buildingScanlineIntensity, setBuildingScanlineIntensity] = useState(0.2);
  const [mapCoords, setMapCoords] = useState({ lat: 55.7558, lon: 37.6173 });
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  // Real-time Assets Listener
  useEffect(() => {
    if (!isAuthReady) return;

    const q = query(collection(db, "assets"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets: Asset[] = [];
      snapshot.forEach((doc) => {
        assets.push({ id: doc.id, ...doc.data() } as Asset);
      });
      setUserAssets(assets);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "assets");
    });

    return () => unsubscribe();
  }, [isAuthReady]);

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
    
    // Combine static buildings with user assets
    const userFeatures = userAssets.map(asset => ({
      type: 'Feature',
      id: asset.id,
      geometry: {
        type: 'Point',
        coordinates: [asset.longitude, asset.latitude]
      },
      properties: {
        id: asset.id,
        title: asset.title,
        height: 20, // Default height for user assets
        cost: asset.cost,
        yield: asset.yield,
        roi: asset.roi,
        status: asset.status + 1, // Map status to 1, 2, 3
        owner: asset.ownerUid === user?.uid ? 'YOU' : 'OTHER',
        type: asset.type,
        isUserAsset: true,
        address: asset.address,
        description: asset.description,
        sqft: asset.sqft,
        yearBuilt: asset.yearBuilt,
        parkingSpaces: asset.parkingSpaces
      }
    }));

    const combinedFeatures = [...buildingsData.features, ...userFeatures];

    return {
      ...buildingsData,
      features: combinedFeatures.filter((f: any) => {
        const props = f.properties;
        const status = props.status === 1 ? 'stable' : props.status === 2 ? 'risk' : props.status === 3 ? 'anomalous' : 'other';
        if (!filters.statuses.includes(status)) return false;
        if (props.roi < filters.minRoi) return false;
        if (filters.owner && !props.owner?.toLowerCase().includes(filters.owner.toLowerCase())) return false;
        return true;
      })
    };
  }, [buildingsData, filters, userAssets, user]);

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

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firestore is offline. Check your configuration.");
        }
      }
    };
    testConnection();
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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await response.json();
      
      setSearchResults(data);
      
      if (data && data.length === 1) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 3000,
            essential: true
          });
          
          setSearchMarker({ lat: latitude, lon: longitude, name: display_name });
          setSearchResults([]);
        }
      } else if (data && data.length === 0) {
        console.warn("No search results found for:", searchQuery);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const selectSearchResult = (result: any) => {
    const { lat, lon, display_name } = result;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) return;

    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      duration: 3000,
      essential: true
    });
    
    setSearchMarker({ lat: latitude, lon: longitude, name: display_name });
    setSearchResults([]);
    setSearchQuery(display_name);
  };

  const [newAsset, setNewAsset] = useState({
    title: '',
    type: 'retail',
    cost: 0,
    yield: 0,
    description: '',
    address: '',
    latitude: 55.7558,
    longitude: 37.6173,
    sqft: 0,
    yearBuilt: new Date().getFullYear(),
    parkingSpaces: 0
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateAsset = async () => {
    if (!user) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const roi = newAsset.cost > 0 ? (newAsset.yield * 12 / newAsset.cost) * 100 : 0;
      const assetData = {
        ...newAsset,
        roi,
        status: 0, // Default stable
        ownerUid: user.uid,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "assets"), assetData);
      setCreateModalOpen(false);
      setNewAsset({
        title: '',
        type: 'retail',
        cost: 0,
        yield: 0,
        description: '',
        address: '',
        latitude: viewState.latitude,
        longitude: viewState.longitude,
        sqft: 0,
        yearBuilt: new Date().getFullYear(),
        parkingSpaces: 0
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "assets");
      setCreateError(error instanceof Error ? error.message : "Failed to create asset. Check your connection.");
    } finally {
      setIsCreating(false);
    }
  };

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
      (info) => setSelectedBuilding(info),
      pulse,
      selectedBuilding?.id || null,
      viewState.zoom,
      buildingScanlineIntensity
    ) : null
  ].filter(Boolean), [showBuildings, filteredBuildings, pulse, selectedBuilding, viewState.zoom, buildingScanlineIntensity]);

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
      setIsRecording(false);
      recordedChunksRef.current = [];
    } catch (err) {
      console.error("Failed to access media devices:", err);
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        if (selectedBuilding) {
          try {
            const res = await fetch(`/api/v1/buildings/${selectedBuilding.id}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'video', url })
            });
            const newItem = await res.json();
            setBuildingMedia(prev => ({
              ...prev,
              [selectedBuilding.id]: [newItem, ...(prev[selectedBuilding.id] || [])]
            }));
          } catch (err) {
            console.error("Failed to save video:", err);
          }
        }
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCapture();
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

    const type = file.type.startsWith('video/') ? 'video' : 'photo';
    const reader = new FileReader();
    reader.onloadend = async () => {
      const url = reader.result as string;
      try {
        const res = await fetch(`/api/v1/buildings/${selectedBuilding.id}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, url })
        });
        const newItem = await res.json();
        
        setBuildingMedia(prev => ({
          ...prev,
          [selectedBuilding.id]: [newItem, ...(prev[selectedBuilding.id] || [])]
        }));
      } catch (err) {
        console.error("Failed to upload media:", err);
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
          systemInstruction: "You are a real estate analyst for Yard Invest. Use the search_buildings tool to find properties and analyze_building to get detailed investment metrics for a specific building. Always provide a concise investment recommendation based on the data.",
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
      <div className="crt-flicker" />
      <div className="screen-scan-overlay" style={{ opacity: scanlineIntensity }} />
      <TacticalHUD lat={viewState.latitude} lon={viewState.longitude} />

      {/* Tactical Alert Banner */}
      <div className="absolute top-36 md:top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
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
              <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-6 overflow-hidden p-4">
                <img 
                  src="https://storage.googleapis.com/ais-studio-user-uploads/lookastarik%40gmail.com/1712852995_logo.png" 
                  alt="Yard Invest Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="homm-heading text-4xl sm:text-6xl tracking-[0.3em] sm:tracking-[0.5em]">YARD INVEST</h1>
              <p className="text-[8px] sm:text-xs text-primary font-mono mt-4 tracking-[0.5em] sm:tracking-[1em] uppercase opacity-50">Strategic Asset Management System</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="absolute bottom-4 left-4 sm:top-4 sm:right-4 sm:bottom-auto sm:left-auto z-50 flex items-center gap-2">
        {!user ? (
          <button 
            onClick={handleLogin}
            className="apple-glass px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 border border-primary/30 text-primary hover:bg-primary/10 transition-all shadow-[0_0_15px_rgba(var(--primary-accent),0.2)] pointer-events-auto"
          >
            <Key className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{t.signIn}</span>
          </button>
        ) : (
          <div className="relative pointer-events-auto">
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 rounded-xl overflow-hidden border-2 border-primary/50 shadow-[0_0_15px_rgba(var(--primary-accent),0.3)] hover:scale-105 transition-all active:scale-95"
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
                  className="absolute right-0 mt-3 w-64 apple-glass rounded-2xl shadow-2xl border border-white/10 p-4 z-50 space-y-4"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                        <img 
                          src={user.photoURL || "https://picsum.photos/seed/user/100/100"} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-display font-bold text-white truncate uppercase">{user.displayName || "Anonymous Operative"}</p>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[6px] font-bold uppercase tracking-tighter border",
                            userRole === 'admin' ? "bg-white/20 text-white border-white/30" :
                            userRole === 'investor' ? "bg-primary/20 text-primary border-primary/30" :
                            "bg-slate-500/20 text-slate-400 border-slate-500/30"
                          )}>
                            {t[userRole] || userRole}
                          </span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-xs text-slate-300">
                        <User className="w-4 h-4" />
                        {t.settings}
                      </button>
                      <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-xs text-slate-300">
                        <Shield className="w-4 h-4" />
                        {t.apiManagement}
                      </button>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors text-sm text-white"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.signOut}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20" />
      </div>

      {/* Search Bar */}
      <div className="absolute top-20 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="apple-glass rounded-xl flex items-center px-4 py-2 sm:py-2.5 group focus-within:ring-1 ring-primary/30 transition-all">
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults([]);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-transparent border-none outline-none px-3 text-xs font-display tracking-widest text-slate-200 placeholder:text-slate-600"
            />
            <div className="flex items-center gap-2">
              {(searchQuery.trim() || searchMarker) && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSearchMarker(null);
                  }}
                  className="p-1 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {searchQuery.trim() && (
                <button 
                  onClick={handleSearch}
                  className="p-1 hover:bg-white/5 rounded-lg text-primary transition-colors"
                  title="Execute Search"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
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

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="apple-glass rounded-xl overflow-hidden border border-white/10 shadow-2xl mt-2 pointer-events-auto"
              >
                <div className="max-h-60 overflow-y-auto scrollbar-hide">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSearchResult(result)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none text-left"
                    >
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-display font-bold text-slate-200 uppercase tracking-wider line-clamp-1">
                          {result.display_name.split(',')[0]}
                        </p>
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-tight line-clamp-1">
                          {result.display_name.split(',').slice(1).join(',').trim()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced Filters Dropdown */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="apple-glass rounded-2xl p-6 shadow-2xl border border-white/5 space-y-6"
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
          onMove={e => {
            if (isNaN(e.viewState.latitude) || isNaN(e.viewState.longitude)) return;
            setViewState(e.viewState);
            setMapCoords({ lat: e.viewState.latitude, lon: e.viewState.longitude });
          }}
          mapStyle={basemap}
          style={{ width: '100%', height: '100%' }}
          reuseMaps
          transitionDuration={2000}
        >
          {selectedBuilding && 
           selectedBuilding.geometry && 
           selectedBuilding.geometry.coordinates && 
           !isNaN(selectedBuilding.geometry.coordinates[0]) && 
           !isNaN(selectedBuilding.geometry.coordinates[1]) && (
            <Marker
              longitude={selectedBuilding.geometry.coordinates[0]}
              latitude={selectedBuilding.geometry.coordinates[1]}
              anchor="bottom"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center pointer-events-none"
              >
                <div className="relative">
                  {/* Animated Circle */}
                  <div className="w-16 h-16 border-2 border-primary rounded-full animate-ping absolute -inset-4 opacity-20" />
                  <div className="w-12 h-12 border-2 border-primary rounded-full flex items-center justify-center bg-primary/20 backdrop-blur-md shadow-[0_0_30px_rgba(var(--primary-accent-rgb),0.5)] pulsate-glow">
                    <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-accent-rgb),1)] pulsate-glow" />
                  </div>
                  
                  {/* Hanging Arrow */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2"
                  >
                    <ChevronDown className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(var(--primary-accent-rgb),0.8)] pulsate-glow" />
                  </motion.div>
                </div>
              </motion.div>
            </Marker>
          )}

          {searchMarker && !isNaN(searchMarker.lon) && !isNaN(searchMarker.lat) && (
            <Marker
              longitude={searchMarker.lon}
              latitude={searchMarker.lat}
              anchor="bottom"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center pointer-events-none"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-secondary/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-8 h-8 bg-secondary/20 backdrop-blur-sm rounded-full shadow-[0_0_20px_rgba(var(--secondary-accent-rgb),0.3)] flex items-center justify-center border-2 border-secondary/40 pulsate-glow-secondary">
                    <Target className="w-5 h-5 text-secondary" />
                  </div>
                </div>
                <div className="mt-2 px-3 py-1 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full shadow-xl max-w-[150px]">
                  <span className="text-[8px] font-display font-bold text-white uppercase tracking-tight line-clamp-1">
                    {searchMarker.name}
                  </span>
                </div>
              </motion.div>
            </Marker>
          )}

          {/* Multiple Search Results Markers */}
          {searchResults.length > 0 && searchResults.map((result, idx) => {
            const lon = parseFloat(result.lon);
            const lat = parseFloat(result.lat);
            if (isNaN(lon) || isNaN(lat)) return null;
            
            return (
              <Marker
                key={`result-${idx}`}
                longitude={lon}
                latitude={lat}
                anchor="bottom"
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex flex-col items-center pointer-events-none"
                >
                  <div className="relative">
                    <div className="w-6 h-6 bg-secondary/10 backdrop-blur-sm rounded-full border border-secondary/30 flex items-center justify-center pulsate-glow-secondary">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                    </div>
                  </div>
                </motion.div>
              </Marker>
            );
          })}
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
        </Map>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col p-4 sm:p-6 z-20">
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
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4 pointer-events-auto">
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
              className="apple-glass rounded-full p-2 flex items-center justify-center glass-hover transition-all"
              title="Export Map Data (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button 
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="apple-glass rounded-full p-2 flex items-center justify-center glass-hover transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-72 apple-glass rounded-xl shadow-2xl p-5 z-50 space-y-5"
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

                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3 h-3 text-slate-500" />
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.scanlineIntensity}</label>
                        </div>
                        <span className="text-[10px] font-mono text-primary">{(scanlineIntensity * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={scanlineIntensity} 
                        onChange={(e) => setScanlineIntensity(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.buildingScanlines}</label>
                        </div>
                        <span className="text-[10px] font-mono text-primary">{(buildingScanlineIntensity * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={buildingScanlineIntensity} 
                        onChange={(e) => setBuildingScanlineIntensity(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="hidden sm:flex apple-glass rounded-full px-4 py-2 items-center gap-3">
              <Wallet className="w-3.5 h-3.5 text-secondary" />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-bold leading-none tracking-widest">{t.treasury}</span>
                <span className="text-xs font-mono font-bold text-secondary">
                  ${balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="relative pointer-events-auto hidden sm:block">
              <button 
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="apple-glass rounded-full px-4 py-2 flex items-center gap-3 glass-hover transition-all"
              >
                <Shield className={cn("w-3.5 h-3.5", userRole === 'admin' ? "text-white" : "text-primary")} />
                <span className="text-[10px] font-display font-bold uppercase tracking-widest">
                  {userRole === 'anonymous' ? t.public : userRole === 'investor' ? t.investor : t.admin}
                </span>
              </button>

              <AnimatePresence>
                {roleMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50"
                  >
                    {[
                      { 
                        id: 'anonymous', 
                        label: 'Public Access', 
                        desc: 'Basic map data, building heights, and market values.',
                        icon: Eye
                      },
                      { 
                        id: 'investor', 
                        label: 'Investor Mode', 
                        desc: 'Full access to ROI metrics and yield analysis.',
                        icon: TrendingUp
                      },
                      { 
                        id: 'admin', 
                        label: 'System Admin', 
                        desc: 'Unrestricted access to all system data.',
                        icon: Shield
                      }
                    ].map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setUserRole(role.id as any);
                          setRoleMenuOpen(false);
                        }}
                        className={cn(
                          "group relative w-full flex flex-col gap-0.5 p-2.5 rounded-lg transition-all text-left",
                          userRole === role.id ? "bg-white/20 border border-white/30" : "glass-hover border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <role.icon className={cn("w-3.5 h-3.5", userRole === role.id ? "text-white" : "text-slate-500")} />
                          <span className={cn("text-xs font-bold", userRole === role.id ? "text-white" : "text-slate-300")}>
                            {role.label}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-tight">
                          {role.desc}
                        </p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative pointer-events-auto">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-full flex items-center justify-center glass-hover transition-colors"
              >
                <User className="w-4 h-4 text-slate-300" />
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
            </div>
          </div>
        </header>

        {/* Map Controls */}
        <div className="absolute right-4 sm:right-6 top-20 sm:top-24 flex flex-col gap-3 pointer-events-auto">
          {/* Layers Control */}
          <div className="relative">
            <button 
              onClick={() => setLayersMenuOpen(!layersMenuOpen)}
              className={cn(
                "apple-glass rounded-lg p-2 flex items-center justify-center transition-all border shadow-lg",
                layersMenuOpen ? "bg-primary/20 border-primary/40 text-primary" : "border-white/5 text-slate-400 glass-hover"
              )}
              title={t.layers}
            >
              <Layers className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {layersMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  className="absolute right-full mr-3 top-0 w-56 apple-glass rounded-xl shadow-2xl border border-white/10 p-4 z-50 space-y-4"
                >
                  <div className="space-y-3">
                    <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.theme}</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {basemaps.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setBasemap(m.url)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all",
                            basemap === m.url ? "bg-primary/20 text-primary border border-primary/30" : "text-slate-400 hover:bg-white/5"
                          )}
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.layers}</h4>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setShowBuildings(!showBuildings)}
                        className={cn(
                          "flex items-center justify-between w-full p-2 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all",
                          showBuildings ? "bg-primary/20 text-primary border border-primary/30" : "text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-3.5 h-3.5" />
                          {t.buildings}
                        </div>
                        {showBuildings ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>

                      <button
                        disabled
                        className="flex items-center justify-between w-full p-2 rounded-lg text-[10px] font-display uppercase tracking-wider text-slate-600 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-3.5 h-3.5" />
                          Future Layer
                        </div>
                        <Lock className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend Toggle */}
          <button 
            onClick={() => {
              setLegendOpen(!legendOpen);
              if (!legendOpen && window.innerWidth < 640) setChatOpen(false);
            }}
            className={cn(
              "apple-glass rounded-lg p-2 flex items-center justify-center transition-all border shadow-lg",
              legendOpen ? "bg-primary/20 border-primary/40 text-primary" : "border-white/5 text-slate-400 glass-hover"
            )}
            title="Toggle Map Legend"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Zoom Controls */}
          <div className="flex flex-col items-end gap-4">
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 apple-glass rounded-xl border border-white/5 pointer-events-auto">
              <div className="flex flex-col items-end">
                <span className="text-[7px] text-slate-500 uppercase font-bold tracking-[0.3em]">{t.coordinates}</span>
                <span className="text-[10px] font-mono text-primary">
                  {mapCoords.lat.toFixed(4)}°N / {mapCoords.lon.toFixed(4)}°E
                </span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Radio className="w-3 h-3 text-secondary pulsate-glow" />
                  <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping" />
                </div>
                <span className="text-[8px] font-mono text-secondary uppercase tracking-widest">{t.satelliteUplink}</span>
              </div>
            </div>

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

        {/* Hover Info Widget - Rule 2: Dynamic Data Mapping */}
        <AnimatePresence>
          {hoverInfo && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-auto mb-4 sm:mb-6 w-full max-w-[280px] sm:max-w-xs apple-glass rounded-xl p-4 sm:p-5 pointer-events-auto shadow-2xl"
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
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="w-[calc(100vw-2rem)] sm:w-80 h-[50vh] sm:h-[450px] max-h-[500px] flex flex-col overflow-hidden"
              >
                <ParallaxCard className="flex-1 flex flex-col">
                  <div className="apple-glass rounded-2xl border border-border bg-base/40 backdrop-blur-xl shadow-2xl flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border bg-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(var(--primary-accent),0.5)] pulsate-glow">
                      <Terminal className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-display font-bold text-[var(--text-main)] uppercase tracking-widest">{t.aiAnalyst}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-secondary pulsate-glow" />
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
              </div>
            </ParallaxCard>
          </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => {
              setChatOpen(!chatOpen);
              if (!chatOpen && window.innerWidth < 640) setLegendOpen(false);
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full h-full sm:h-auto sm:max-w-xl apple-glass sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full sm:max-h-[90vh]"
            >
              {/* Header Image / Pattern */}
              <div className="h-24 sm:h-28 bg-gradient-to-br from-primary to-base relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <button 
                  onClick={() => setSelectedBuilding(null)}
                  className="absolute top-3 right-3 p-2 sm:p-1.5 bg-base/40 glass-hover rounded-full text-white transition-colors z-10"
                >
                  <X className="w-5 h-5 sm:w-4 h-4" />
                </button>
                <div className="absolute -bottom-5 left-6 w-12 h-12 bg-primary rounded-xl shadow-[0_0_20px_rgba(var(--primary-accent),0.5)] flex items-center justify-center border-4 border-base">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="p-5 sm:p-6 pt-8 sm:pt-10 overflow-y-auto flex-1 scrollbar-hide">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-[var(--text-main)] tracking-tight uppercase">
                      {selectedBuilding.properties.title || t.portfolio}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[9px] tracking-widest uppercase">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>
                        {selectedBuilding.properties.address || `${t.sector}_01 // ID: ${selectedBuilding.id}`}
                      </span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-3 h-3 text-slate-500" />
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.marketValue}</p>
                    </div>
                    <p className="text-lg font-mono font-bold text-primary">
                      ${(selectedBuilding.properties as any).cost?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-secondary" />
                      <p className="text-[8px] text-secondary uppercase font-bold tracking-widest">{t.monthlyYield}</p>
                    </div>
                    <p className="text-lg font-mono font-bold text-secondary">
                      +${(selectedBuilding.properties as any).yield?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
                        {selectedBuilding.properties.type ? t.assetType : t.elevation}
                      </p>
                    </div>
                    <p className="text-lg font-mono font-bold text-[var(--text-main)] uppercase">
                      {selectedBuilding.properties.type ? t[selectedBuilding.properties.type] : `${selectedBuilding.properties.height}m`}
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-3 h-3 text-primary" />
                      <p className="text-[8px] text-primary uppercase font-bold tracking-widest">{t.roiAnalysis}</p>
                    </div>
                    <p className={cn(
                      "text-lg font-mono font-bold",
                      selectedBuilding.properties.roi !== undefined ? "text-primary" : "text-slate-600 italic text-xs"
                    )}>
                      {selectedBuilding.properties.roi !== undefined ? `${selectedBuilding.properties.roi}%` : t.encrypted}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Strategic Documentation Section */}
                  {selectedBuilding.properties.description && (
                    <div className="bg-base/40 rounded-xl p-4 border border-border/50 mb-4">
                      <h3 className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{t.assetDescription}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {selectedBuilding.properties.description}
                      </p>
                    </div>
                  )}

                  {/* Strategic Specifications */}
                  {(selectedBuilding.properties.sqft || selectedBuilding.properties.yearBuilt || selectedBuilding.properties.parkingSpaces) && (
                    <div className="grid grid-cols-3 gap-3">
                      {selectedBuilding.properties.sqft && (
                        <div className="bg-base/40 rounded-xl p-3 border border-border/50">
                          <p className="text-[7px] text-slate-500 uppercase font-bold tracking-widest mb-1">Area_SQFT</p>
                          <p className="text-xs font-mono font-bold text-slate-300">{selectedBuilding.properties.sqft.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedBuilding.properties.yearBuilt && (
                        <div className="bg-base/40 rounded-xl p-3 border border-border/50">
                          <p className="text-[7px] text-slate-500 uppercase font-bold tracking-widest mb-1">Year_Built</p>
                          <p className="text-xs font-mono font-bold text-slate-300">{selectedBuilding.properties.yearBuilt}</p>
                        </div>
                      )}
                      {selectedBuilding.properties.parkingSpaces !== undefined && (
                        <div className="bg-base/40 rounded-xl p-3 border border-border/50">
                          <p className="text-[7px] text-slate-500 uppercase font-bold tracking-widest mb-1">Parking_Slots</p>
                          <p className="text-xs font-mono font-bold text-slate-300">{selectedBuilding.properties.parkingSpaces}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="bg-base/40 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-[0.2em]">Strategic Documentation</h3>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 glass-hover text-secondary rounded-lg transition-colors border border-secondary/20"
                          title={t.uploadDocumentation}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">{t.uploadDocumentation}</span>
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
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedMedia(item)}
                          className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border group cursor-pointer"
                        >
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
                          {isCapturing === 'photo' ? (
                            <button 
                              onClick={capturePhoto}
                              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
                            >
                              <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform" />
                            </button>
                          ) : (
                            <button 
                              onClick={isRecording ? stopRecording : startRecording}
                              className={cn(
                                "w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all",
                                isRecording ? "border-red-500" : "border-white"
                              )}
                            >
                              <div className={cn(
                                "transition-all",
                                isRecording ? "w-8 h-8 bg-red-500 rounded-sm" : "w-16 h-16 bg-white rounded-full"
                              )} />
                            </button>
                          )}
                        </div>
                        <div className="absolute top-12 text-white font-mono text-xs uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                          {isCapturing === 'photo' ? 'Tactical Imaging Mode' : 'Strategic Video Uplink'}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Full-screen Media Preview */}
                  <AnimatePresence>
                    {selectedMedia && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setSelectedMedia(null)}
                      >
                        <div className="relative max-w-4xl w-full max-h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedMedia(null)}
                            className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
                          >
                            <X className="w-8 h-8" />
                          </button>
                          {selectedMedia.type === 'photo' ? (
                            <img src={selectedMedia.url} alt="Strategic Documentation" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10" />
                          ) : (
                            <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10" />
                          )}
                          <div className="absolute -bottom-12 left-0 text-white/50 font-mono text-[10px] uppercase tracking-[0.2em]">
                            Strategic Intel // {new Date(selectedMedia.timestamp).toLocaleString()}
                          </div>
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

      {/* Tactical Dashboard Sidebar */}
      <AnimatePresence>
        {dashboardOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute left-0 sm:left-4 top-0 sm:top-24 bottom-0 sm:bottom-24 w-full sm:w-72 z-40 flex flex-col gap-4 pointer-events-none p-4 sm:p-0 bg-base/80 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none"
          >
            <div className="flex sm:hidden justify-between items-center mb-4 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="homm-heading text-xl">{t.title}</h2>
              </div>
              <button onClick={() => setDashboardOpen(false)} className="p-2 apple-glass rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Info */}
            <ParallaxCard className="sm:hidden pointer-events-auto mb-4">
              <div className="apple-glass rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center border border-secondary/30">
                      <Wallet className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.treasury}</p>
                      <p className="text-sm font-mono font-bold text-secondary">${balance.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.role}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{userRole}</p>
                  </div>
                </div>
              </div>
            </ParallaxCard>

            {/* System Status Card */}
            <ParallaxCard className="pointer-events-auto">
              <div className="apple-glass rounded-2xl p-5 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/30 pulsate-glow">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em]">{t.systemStatus}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-primary pulsate-glow" />
                        <span className="text-[8px] font-mono text-primary uppercase tracking-widest">{t.nominal}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">{t.threatLevel}</span>
                    <span className="text-[9px] font-mono text-white">LOW_0.12</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="175.9" strokeDashoffset="44" className="text-primary shadow-[0_0_10px_rgba(var(--primary-accent),0.5)]" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-white">75%</span>
                      <span className="text-[5px] text-slate-500 uppercase">Sync</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-2.5 h-2.5 text-slate-500" />
                        <span className="text-[7px] text-slate-400 uppercase font-bold tracking-widest">{t.activeNodes}</span>
                      </div>
                      <span className="text-[8px] font-mono text-white">12,402</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[6px] text-slate-500 uppercase font-bold tracking-widest">Network_Load</span>
                        <span className="text-[7px] font-mono text-primary">24%</span>
                      </div>
                      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '24%' }}
                          className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-accent),0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ParallaxCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute left-4 top-4 z-50 pointer-events-auto flex flex-col gap-2">
        <button 
          onClick={() => setDashboardOpen(!dashboardOpen)}
          className={cn(
            "w-10 h-10 apple-glass rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white transition-all shadow-xl",
            dashboardOpen && "hidden sm:flex"
          )}
        >
          {dashboardOpen ? <ChevronUp className="-rotate-90 w-5 h-5" /> : <ChevronUp className="rotate-90 w-5 h-5" />}
        </button>
        {user && (
          <button 
            onClick={() => {
              setNewAsset(prev => ({ ...prev, latitude: viewState.latitude, longitude: viewState.longitude }));
              setCreateModalOpen(true);
            }}
            className="w-10 h-10 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl flex items-center justify-center text-primary transition-all shadow-xl"
            title={t.createAsset}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Map Legend */}
      <AnimatePresence>
        {legendOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="absolute bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-64 apple-glass rounded-xl shadow-2xl border border-white/10 p-4 sm:p-5 z-40 pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em]">{t.legendTitle}</h3>
              <button onClick={() => setLegendOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Target className="w-3 h-3" />, label: 'Asset_Target', color: 'text-primary' },
                  { icon: <Shield className="w-3 h-3" />, label: 'Secure_Zone', color: 'text-secondary' },
                  { icon: <Zap className="w-3 h-3" />, label: 'High_Yield', color: 'text-white' },
                  { icon: <AlertTriangle className="w-3 h-3" />, label: 'Risk_Node', color: 'text-white' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className={cn(item.color)}>{item.icon}</div>
                    <span className="text-[7px] font-mono text-slate-400 uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.stable}</span>
                  <div className="w-12 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{t.risk}</span>
                  <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-1/2" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase tracking-[0.3em]">
                <span>System Status: Nominal</span>
                <span>v4.0.2</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Asset Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg apple-glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">{t.createAsset}</h2>
                    <p className="text-[10px] font-mono text-primary uppercase tracking-widest">{t.restricted}</p>
                  </div>
                </div>
                <button onClick={() => setCreateModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {createError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-red-400 font-medium">{createError}</p>
                    </div>
                    <button onClick={() => setCreateError(null)}>
                      <X className="w-4 h-4 text-red-500/50 hover:text-red-500" />
                    </button>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetTitle}</label>
                    <input 
                      type="text"
                      value={newAsset.title}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      placeholder="Strategic Node Alpha..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetType}</label>
                      <select 
                        value={newAsset.type}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors appearance-none"
                      >
                        <option value="retail">{t.retail}</option>
                        <option value="office">{t.office}</option>
                        <option value="warehouse">{t.warehouse}</option>
                        <option value="residential">{t.residential}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetCost}</label>
                      <input 
                        type="number"
                        value={newAsset.cost}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetYield}</label>
                      <input 
                        type="number"
                        value={newAsset.yield}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, yield: parseFloat(e.target.value) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">ROI %</label>
                      <div className="w-full bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 text-sm text-primary font-mono">
                        {newAsset.cost > 0 ? ((newAsset.yield * 12 / newAsset.cost) * 100).toFixed(2) : '0.00'}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetAddress}</label>
                    <input 
                      type="text"
                      value={newAsset.address}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">SQFT</label>
                      <input 
                        type="number"
                        value={newAsset.sqft}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, sqft: parseFloat(e.target.value) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        placeholder="2500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Year Built</label>
                      <input 
                        type="number"
                        value={newAsset.yearBuilt}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, yearBuilt: parseInt(e.target.value) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        placeholder="2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Parking</label>
                      <input 
                        type="number"
                        value={newAsset.parkingSpaces}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, parkingSpaces: parseInt(e.target.value) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        placeholder="12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetLat}</label>
                      <input 
                        type="number"
                        step="0.000001"
                        value={newAsset.latitude}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetLon}</label>
                      <input 
                        type="number"
                        step="0.000001"
                        value={newAsset.longitude}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetDescription}</label>
                    <textarea 
                      value={newAsset.description}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors h-24 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-black/20">
                <button 
                  onClick={handleCreateAsset}
                  disabled={isCreating || !newAsset.title || !newAsset.cost}
                  className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(var(--primary-accent),0.4)] flex items-center justify-center gap-3"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t.assetCreating}
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      {t.createAsset}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {hoverInfo && hoverInfo.x !== undefined && hoverInfo.y !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            style={{ 
              left: hoverInfo.x + 12, 
              top: hoverInfo.y + 12,
              position: 'absolute'
            }}
            className="pointer-events-none z-[100] apple-glass px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10"
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
