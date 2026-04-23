import * as React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Map, useControl, Layer, MapRef, Marker, Source, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core';
import { createBuildingsLayer } from './layers/buildings';
import { createTrafficLayer, processRoadsToTrips } from './layers/traffic';
import { createRiskRadarLayer, createInfrastructureTwinLayer, createFutureProjectsLayer, createStrategicNodesLayer } from './layers/strategic';
import { ThreeProjectLayer, ProjectModel } from './layers/threeLayer';
import { GoogleGenAI, Type } from "@google/genai";
import { soundService } from './services/soundService';
import { PathLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import * as h3 from 'h3-js';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
// Firebase removed - using local SQLite via API
import { 
  Building2, 
  Shield, 
  TrendingUp, 
  TrendingDown,
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
  Satellite,
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
  ShieldCheck,
  ShieldAlert,
  ChevronUp,
  Lock,
  Upload,
  Activity,
  Cpu,
  Handshake,
  Users,
  Hammer,
  Radar,
  Terminal,
  Zap,
  Radio,
  Target,
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart3,
  LayoutDashboard,
  Grid,
  Hexagon,
  Globe,
  Database,
  FileText,
  Sparkles,
  History,
  Printer,
  Car,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  Footprints,
  Clock,
  AlertCircle,
  Hourglass
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar
} from 'recharts';

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
  id: string | number;
  title: string;
  latitude: number;
  longitude: number;
  cost: number;
  yield: number;
  roi: number;
  status: number;
  type: string;
  model: string;
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

interface Syndicate {
  id: string;
  buildingId: number | string;
  buildingName: string;
  targetAmount: number;
  raisedAmount: number;
  participants: { uid: string, name: string, amount: number, role: string }[];
  status: 'OPEN' | 'FUNDED' | 'EXECUTED';
  adminFeeRate: number;
  legalFeeRate: number;
  createdAt: string;
}

interface SecondaryMarketOrder {
  id: string;
  assetId: string | number;
  assetName: string;
  sellerUid: string;
  sellerName: string;
  price: number;
  yieldPerCycle: number;
  status: 'OPEN' | 'SOLD' | 'CANCELLED';
  createdAt: string;
}

// Firebase Error Handling
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
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
    themeTactical: "Tactical",
    themeCyber: "Cyberpunk",
    themeRoyal: "Royal",
    themeArctic: "Arctic",
    themeDesert: "Desert",
    themeProfessional: "Corporate",
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
    tacticalGrid: "Tactical Grid",
    tacticalCells: "Tactical Cells",
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
    basemapTerminal: "AEGIS Terminal",
    basemapAerial: "Aerial Intel",
    basemapStandard: "Standard Intel",
    basemapSatellite: "Orbital Satellite",
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
    aiAnalysis: "AI Analysis",
    analyzing: "Analyzing...",
    investmentPotential: "Investment Potential",
    aiRecommendation: "AI Recommendation",
    uiStyle: "Interface Style",
    tactical: "Tactical Command",
    professional: "Professional Suite",
    uiStyleDesc: "Switch between combat-ready and polished professional interfaces.",
    generateReport: "Generate Strategic Report",
    generatingReport: "Processing Strategic Data...",
    reportTitle: "Asset Strategic Intelligence Report",
    reportBuildingInfo: "Cadastral & Building Specifications",
    reportSWOT: "SWOT: Advantages & Risks",
    reportTraffic: "Traffic & Accessibility Analysis",
    reportPopulation: "Demographics & Catchment",
    reportMarket: "Real Estate Market Trends",
    reportCompetition: "Competitive Landscape",
    reportDate: "Protocol Date",
    reportExport: "Export Secured PDF",
    buildingLevels: "Vertical Levels",
    roofShape: "Roof Geometry",
    assetHeight: "Absolute Height",
    assetFootprint: "Strategic Footprint",
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
    themeTactical: "Тактическая",
    themeCyber: "Киберпанк",
    themeRoyal: "Королевская",
    themeArctic: "Арктика",
    themeDesert: "Пустыня",
    themeProfessional: "Корпоративная",
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
    tacticalGrid: "Тактическая Сетка",
    tacticalCells: "Тактические Соты",
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
    basemapTerminal: "Терминал AEGIS",
    basemapAerial: "Аэрофотосъемка",
    basemapStandard: "Стандартная Инфокарта",
    basemapSatellite: "Орбитальный Спутник",
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
    generateReport: "Сформировать Отчет",
    generatingReport: "Обработка Данных...",
    reportTitle: "Стратегический Отчет по Объекту",
    reportBuildingInfo: "Общая Информация о Здании",
    reportSWOT: "Преимущества и Недостатки",
    reportTraffic: "Анализ Трафика",
    reportPopulation: "Население и Зона Охвата",
    reportMarket: "Аренда и Продажа",
    reportCompetition: "Конкурентная Среда",
    reportDate: "Дата Протокола",
    reportExport: "Экспорт Защищенного PDF",
    buildingLevels: "Этажность",
    roofShape: "Форма Крыши",
    assetHeight: "Абсолютная Высота",
    assetFootprint: "Контур Застройки",
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
    aiAnalysis: "ИИ-Анализ",
    analyzing: "Анализ...",
    investmentPotential: "Инвестиционный Потенциал",
    aiRecommendation: "Рекомендация ИИ",
    uiStyle: "Стиль Интерфейса",
    tactical: "Тактический Штаб",
    professional: "Профессиональный Инструмент",
    uiStyleDesc: "Переключение между боевым и строгим профессиональным интерфейсом.",
  }
};

const themes = ['tactical', 'cyber', 'royal', 'arctic', 'desert', 'professional'];

const strategicProjects: ProjectModel[] = [
  {
    id: 'vostok-tower',
    name: 'Башня "Восток"',
    url: '/assets/models/project_vostok.glb',
    coordinates: [37.537, 55.749],
    altitude: 0,
    rotation: 0,
    scale: 1,
    details: {
      cost: '12.5 млрд ₽',
      roi: '18.4%',
      status: 'Активная фаза',
      description: 'Многофункциональный комплекс класса A+. Стратегический объект инвестиций в центре делового квартала.'
    }
  },
  {
    id: 'nord-hub',
    name: 'Логистический Хаб "Север"',
    url: '/assets/models/nord_hub.glb',
    coordinates: [37.450, 55.900],
    altitude: 0,
    rotation: Math.PI / 4,
    scale: 1.2,
    details: {
      cost: '4.2 млрд ₽',
      roi: '12.1%',
      status: 'Проектирование',
      description: 'Крупнейший транспортный узел северного направления. Оптимизация логистических цепочек.'
    }
  },
  {
    id: 'eco-residence',
    name: 'Эко-Резиденция "Зеленый Квартал"',
    url: '/assets/models/eco_residence.glb',
    coordinates: [37.650, 55.700],
    altitude: 0,
    rotation: -Math.PI / 6,
    scale: 0.8,
    details: {
      cost: '8.7 млрд ₽',
      roi: '15.2%',
      status: 'Строительство',
      description: 'Жилой комплекс нового поколения с упором на экологичность и автономность.'
    }
  }
];

const DigitalMapHUD = ({ coords }: { coords: { lat: number, lon: number } }) => {
  const [pulse, setPulse] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Corner Brackets - Refined */}
      <div className="map-hud-corner map-hud-corner-tl border-primary/60 w-16 h-16" />
      <div className="map-hud-corner map-hud-corner-tr border-primary/60 w-16 h-16" />
      <div className="map-hud-corner map-hud-corner-bl border-primary/60 w-16 h-16" />
      <div className="map-hud-corner map-hud-corner-br border-primary/60 w-16 h-16" />

      {/* Crosshair Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="w-8 h-8 border border-primary/20 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-primary/60 rounded-full shadow-[0_0_8px_rgba(var(--primary-accent-rgb),1)]" />
        </div>
        <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-transparent mt-1" />
      </div>

      {/* Coordinate Display & System Status */}
      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-3 font-mono">
        {/* System Logs Feed */}
        <div className="flex flex-col items-end gap-1 opacity-60">
           <span className="text-[6px] text-primary/50 uppercase font-bold tracking-[0.3em]">System_Feed_V2.1</span>
           <div className="flex flex-col items-end">
             <span className="text-[7px] text-white/40">SATELLITE_LINK: OPTIMAL</span>
             <span className="text-[7px] text-white/40">HEURISTIC_BUFFER: 12%</span>
             <span className="text-[7px] text-emerald-500/60 animate-pulse">ENCRYPTION: AES-4096_ACTIVE</span>
           </div>
        </div>

        <div className="flex items-center gap-2 group">
          <div className="flex flex-col items-end">
             <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Vector_Node_Beta</span>
             <span className="text-[6px] text-primary/40 leading-none">ID: 0xFD442A</span>
          </div>
          <div className="w-2 h-2 bg-primary rounded-full animate-ping opacity-40 shadow-[0_0_12px_rgba(var(--primary-accent-rgb),1)]" />
        </div>

        <div className="p-4 apple-glass-dark border border-white/5 rounded-2xl flex flex-col gap-2 shadow-2xl skew-x-[-12deg] relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <div className="flex gap-6 unskew-x-[12deg] relative z-10">
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5">X_COORD</span>
              <span className="text-sm text-white font-mono font-bold tabular-nums tracking-tighter">{coords.lat.toFixed(6)}°</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5">Y_COORD</span>
              <span className="text-sm text-white font-mono font-bold tabular-nums tracking-tighter">{coords.lon.toFixed(6)}°</span>
            </div>
          </div>

          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden unskew-x-[12deg] relative z-10">
            <motion.div 
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="h-full bg-primary/40 shadow-[0_0_10px_rgba(var(--primary-accent-rgb),0.5)]"
            />
          </div>
          
          {/* Decorative Glitchy bits */}
          <div className="absolute top-0 right-0 w-8 h-1 bg-primary/30" />
          <div className="absolute bottom-0 left-0 w-1 h-8 bg-primary/30" />
        </div>
      </div>

      {/* Compass & Mode Display */}
      <div className="absolute top-10 left-10 flex flex-col gap-4">
        <div className="relative group">
          <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden backdrop-blur-md shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
             <div className="scanline-anim opacity-20" />
             <Activity className="w-5 h-5 text-primary animate-pulse" />
          </div>
          {/* Animated Orbit */}
          <div 
            className="absolute -inset-2 border border-primary/10 rounded-full" 
            style={{ transform: `rotate(${pulse * 3.6}deg)` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary/40 rounded-full" />
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
           <div className="flex items-center gap-2">
              <span className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] font-display">Neural_Link</span>
              <div className="flex gap-0.5">
                {[1,2,3].map(i => (
                  <div key={i} className={cn("w-1 h-1 rounded-full", i <= 2 ? "bg-primary" : "bg-primary/20", "animate-pulse")} />
                ))}
              </div>
           </div>
           <p className="text-[7px] text-slate-500 uppercase tracking-widest font-mono">Status: Nominal</p>
        </div>
      </div>

      {/* Map Scanning Lines */}
      <div className="map-scanline opacity-[0.15]" />
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.3)] animate-[map-scan-h_12s_linear_infinite]" />
      
      {/* Vignette & Noise */}
      <div className="absolute inset-0 border-[60px] border-black/10 pointer-events-none opacity-40 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />
      <div className="digital-map-overlay opacity-[0.03]" />
    </div>
  );
};

function DeckGLOverlay({ layers, effects, showTraffic }: { layers: any[], effects?: any[], showTraffic?: boolean }) {
  // Use map context to patch for MapLibre 5 compatibility if needed
  const overlay = useControl<MapboxOverlay>(({ map }) => {
    // MapLibre 5 style object changed, creating a shim for shaderPreludeCode
    // which some Deck.gl internals might still look for even in non-interleaved mode
    if (map?.style && (map.style as any)._style && !(map.style as any)._style.shaderPreludeCode) {
      (map.style as any)._style.shaderPreludeCode = '';
    }
    return new MapboxOverlay({ interleaved: false });
  });
  
  const frameRef = useRef<number>(null);
  const layersRef = useRef(layers);
  const effectsRef = useRef(effects);

  // Sync refs to use in animation loop without closing over stale props
  useEffect(() => {
    layersRef.current = layers;
    effectsRef.current = effects;
  }, [layers, effects]);

  useEffect(() => {
    let isMounted = true;
    let isRunning = false;

    const updateOverlay = (time: number) => {
      if (!isMounted || isRunning) return;
      
      try {
        isRunning = true;
        const processedLayers = layersRef.current.filter(Boolean).map(l => {
          if (l?.id === 'traffic-trips') {
            return l.clone({ currentTime: time });
          }
          return l;
        });
        
        overlay.setProps({ layers: processedLayers, effects: effectsRef.current });
      } catch (err) {
        // Silently handle "already running" or "shaderPreludeCode" errors
        // By the time the next frame hits, the state usually clears
      } finally {
        isRunning = false;
      }
    };

    const animate = () => {
      if (!isMounted) return;
      const time = (performance.now() / 50) % 1000;
      updateOverlay(time);
      frameRef.current = requestAnimationFrame(animate);
    };

    if (showTraffic) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      // Just one static update
      updateOverlay(0);
    }

    return () => {
      isMounted = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [showTraffic, overlay]);

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

const TacticalTicker = () => {
  const [messages] = useState([
    "ANOMALY DETECTED: OBJ #4432 YIELD DROP -2.1% SIGMA 3",
    "LEASE EXPIRING: OBJ #8821 IN 45 DAYS",
    "CADASTRAL UPDATE: SECTOR 7 VALUATION +4.2%",
    "SECURE UPLINK STABLE // LATENCY 12MS",
    "MARKET VOLATILITY: LOW // AEGIS STATUS: NOMINAL"
  ]);

  return (
    <div className="h-6 bg-black border-t border-primary/20 flex items-center overflow-hidden whitespace-nowrap">
      <motion.div
        animate={{ x: [0, -1000] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex gap-12"
      >
        {[...messages, ...messages].map((msg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
            <span className="text-[8px] font-mono text-primary/80 uppercase tracking-widest">{msg}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const StrategicOverview = ({ portfolio, balance, portfolioValue, performanceHistory }: any) => {
  const aum = portfolioValue;
  const nav = portfolioValue * 0.85; // Simulated leverage
  const cashDrag = (balance / (balance + portfolioValue)) * 100;
  const anomalies = portfolio.filter((p: any) => p.status === 3).length;

  // Group portfolio by ROI segments
  const roiDistribution = useMemo(() => {
    const segments = [
      { name: '<8%', count: 0, color: '#ff4444' },
      { name: '8-12%', count: 0, color: '#ffbb33' },
      { name: '12-15%', count: 0, color: '#0bc5ea' },
      { name: '>15%', count: 0, color: '#00ff9d' },
    ];

    portfolio.forEach((p: any) => {
      if (p.roi < 8) segments[0].count++;
      else if (p.roi < 12) segments[1].count++;
      else if (p.roi < 15) segments[2].count++;
      else segments[3].count++;
    });
    return segments;
  }, [portfolio]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-8 h-8" />
          </div>
          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">AUM (Exposure)</p>
          <p className="text-xl font-display font-bold text-white">${aum.toLocaleString()}</p>
          <p className="text-[10px] font-mono text-slate-500">Net Exposure</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-8 h-8" />
          </div>
          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Net Asset Value</p>
          <p className="text-xl font-display font-bold text-emerald-400">${nav.toLocaleString()}</p>
          <p className="text-[10px] font-mono text-slate-500">LTV: 15.0%</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Coins className="w-8 h-8" />
          </div>
          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Cash Drag</p>
          <p className={cn("text-xl font-display font-bold", cashDrag > 15 ? "text-yellow-400" : "text-white")}>
            {cashDrag.toFixed(1)}%
          </p>
          <p className="text-[10px] font-mono text-slate-500">${balance.toLocaleString()} Liquid</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Anomalies</p>
          <p className={cn("text-xl font-display font-bold", anomalies > 0 ? "text-red-400" : "text-emerald-400")}>
            {anomalies}
          </p>
          <p className="text-[10px] font-mono text-slate-500">Risk Vectors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
          <h3 className="text-[10px] font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-primary" />
            Portfolio Performance History // Real-time Feed
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceHistory}>
                <defs>
                  <linearGradient id="performanceHistoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#64748b' }}
                />
                <YAxis 
                  hide 
                  domain={['auto', 'auto']} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', fontSize: '10px' }}
                  itemStyle={{ color: 'var(--primary-accent)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--primary-accent)" 
                  fillOpacity={1} 
                  fill="url(#performanceHistoryGradient)" 
                  strokeWidth={2}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
          <h3 className="text-[10px] font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-secondary" />
            ROI Distribution Matrix
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff20', fontSize: '10px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {roiDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
        <h3 className="text-[10px] font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2">
          <Target className="w-3 h-3 text-primary" />
          Yield Radar Analysis
        </h3>
        <div className="h-72 flex gap-4">
          <div className="w-8 bg-black/40 rounded-full relative overflow-hidden border border-white/5">
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-500 via-yellow-500 to-emerald-500 h-[80%]" />
            <div className="absolute inset-0 flex flex-col justify-between py-4 items-center text-[6px] font-mono text-white/40">
              <span>25%</span>
              <span>15%</span>
              <span>5%</span>
              <span>0%</span>
              <span>-5%</span>
            </div>
          </div>
          <div className="flex-1 relative">
            {portfolio.map((p: any, i: number) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="absolute left-0 w-full h-px bg-white/10 flex items-center"
                style={{ bottom: `${(p.roi / 25) * 100}%` }}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full -ml-0.75", 
                  p.roi > 12 ? "bg-emerald-400" : p.roi > 8 ? "bg-yellow-400" : "bg-red-400"
                )} />
                <span className="text-[7px] font-mono text-white/40 ml-2">OBJ_{p.id} ({p.roi}%)</span>
              </motion.div>
            ))}
            <div className="absolute left-0 w-full h-px bg-red-500/40 border-t border-dashed border-red-500/20" style={{ bottom: '32%' }}>
              <span className="absolute right-0 -top-3 text-[6px] font-mono text-red-400 uppercase">Risk Threshold (8%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssetMatrix = ({ portfolio, onSelect, onSelectAsset, onList }: any) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-[10px] font-mono text-white uppercase tracking-widest flex items-center gap-2">
          <Database className="w-3 h-3 text-primary" />
          Asset Matrix // Terminal_01
        </h3>
        <div className="flex gap-2">
          <button className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[7px] text-slate-400 uppercase hover:bg-white/10 transition-colors">Yield {">"} 15%</button>
          <button className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[7px] text-slate-400 uppercase hover:bg-white/10 transition-colors">Anomalous</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#0a0a0a] z-10">
            <tr className="border-b border-white/10">
              <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">ID</th>
              <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Address</th>
              <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Value (₽)</th>
              <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Yield</th>
              <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">ROI 3Y</th>
              <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
              <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {portfolio.map((p: any, i: number) => (
              <tr 
                key={i} 
                className="group hover:bg-primary/5 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(p)}
              >
                <td className="p-4">
                  <span className="text-[10px] font-mono text-primary font-bold">#{p.id.toString().substring(0, 8)}</span>
                </td>
                <td className="p-4">
                  <div className="relative h-4 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {hoveredId === p.id ? (
                        <motion.span 
                          key="address"
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                          exit={{ y: -20 }}
                          className="text-[9px] text-white/80 block"
                        >
                          {p.address}
                        </motion.span>
                      ) : (
                        <motion.span 
                          key="privacy"
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                          exit={{ y: -20 }}
                          className="text-[9px] text-slate-600 block italic"
                        >
                          [ PRIVACY MODE ACTIVE ]
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-mono text-white">₽{(p.cost * 80).toLocaleString()}</span>
                </td>
                <td className="p-4">
                  <span className={cn("text-[10px] font-mono font-bold", 
                    p.roi > 12 ? "text-emerald-400" : p.roi > 8 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {p.roi}%
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-mono text-slate-400">{(p.roi * 2.8).toFixed(1)}%</span>
                </td>
                <td className="p-4">
                  <span className={cn("text-[8px] font-mono px-2 py-0.5 rounded border", 
                    p.status === 3 ? "bg-red-500/10 border-red-500/30 text-red-400" :
                    p.status === 2 ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    {p.status === 3 ? 'ANOM' : p.status === 2 ? 'RISK' : 'STABLE'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAsset(p);
                      }}
                      className="p-1 hover:text-primary transition-colors transition-all active:scale-95"
                    >
                      <Radio className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onList(p);
                      }}
                      className="px-2 py-0.5 border border-secondary/30 text-[7px] font-bold text-secondary uppercase tracking-widest hover:bg-secondary/10 transition-all active:scale-95 rounded"
                    >
                      Exit_Node
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DeepDiveTerminal = ({ asset, portfolioDetailed = [], onClose }: any) => {
  const [activeTab, setActiveTab] = useState(1);

  const typeDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    portfolioDetailed.forEach((item: any) => {
      const type = item.type || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.toUpperCase(), 
      value 
    }));
  }, [portfolioDetailed]);

  const COLORS = ['#0bc5ea', '#00ff9d', '#ffbb33', '#ff4444', '#aa66cc'];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        setActiveTab(parseInt(e.key));
        soundService.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-50 bg-black flex flex-col font-mono"
    >
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Deep Dive Terminal</span>
            <span className="text-[8px] text-slate-500">OBJ_{asset.id} // {asset.address}</span>
          </div>
          <div className="flex gap-4 ml-8">
            {[1, 2, 3, 4].map(i => (
              <button 
                key={i}
                onClick={() => setActiveTab(i)}
                className={cn("text-[10px] font-bold tracking-widest px-3 py-1 rounded transition-all", 
                  activeTab === i ? "bg-primary text-black" : "text-slate-500 hover:text-white"
                )}
              >
                [{i}] {i === 1 ? 'FINANCIALS' : i === 2 ? 'GEOSPATIAL' : i === 3 ? 'TENANT MIX' : 'LEGAL'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
        {activeTab === 1 && (
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
              <h4 className="text-[10px] text-white uppercase tracking-widest mb-6">DCF Model (10Y Projection)</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...Array(10)].map((_, i) => ({ year: 2026 + i, cashflow: asset.yield * 12 * Math.pow(1.05, i) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" fontSize={8} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={8} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="cashflow" stroke="var(--primary-accent)" fill="var(--primary-accent)" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-3 bg-black/40 rounded border border-white/5">
                  <p className="text-[7px] text-slate-500 uppercase">Discount Rate</p>
                  <p className="text-sm font-bold text-white">8.5%</p>
                </div>
                <div className="p-3 bg-black/40 rounded border border-white/5">
                  <p className="text-[7px] text-slate-500 uppercase">Exit Cap Rate</p>
                  <p className="text-sm font-bold text-white">5.2%</p>
                </div>
                <div className="p-3 bg-black/40 rounded border border-white/5">
                  <p className="text-[7px] text-slate-500 uppercase">NPV</p>
                  <p className="text-sm font-bold text-emerald-400">${(asset.cost * 1.2).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h4 className="text-[10px] text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                   <Target className="w-3 h-3 text-primary" />
                   Analytical Risk Profile // Asset DNA
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Liquidity', A: 85, B: 110, fullMark: 150 },
                      { subject: 'Location', A: 98, B: 130, fullMark: 150 },
                      { subject: 'Tenant Mix', A: 86, B: 130, fullMark: 150 },
                      { subject: 'CapEx Risk', A: 99, B: 100, fullMark: 150 },
                      { subject: 'Market Vol.', A: 85, B: 90, fullMark: 150 },
                      { subject: 'Regulatory', A: 65, B: 85, fullMark: 150 },
                    ]}>
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b' }} />
                      <PolarRadiusAxis hide />
                      <RechartsRadar
                        name="Asset"
                        dataKey="A"
                        stroke="var(--primary-accent)"
                        fill="var(--primary-accent)"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">CAPEX Structure</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Roof Replacement', cost: 120000, date: 'Q3 2027', impact: '-0.4% ROI' },
                    { label: 'HVAC Upgrade', cost: 85000, date: 'Q1 2028', impact: '+0.2% ROI' },
                    { label: 'Facade Cleaning', cost: 15000, date: 'Q2 2026', impact: 'Neutral' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-black/20 rounded">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white font-bold">{item.label}</span>
                        <span className="text-[7px] text-slate-500">{item.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-white block">${item.cost.toLocaleString()}</span>
                        <span className="text-[7px] text-primary">{item.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Leverage & Debt</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 rounded border border-white/5 text-center">
                    <p className="text-[8px] text-slate-500 uppercase mb-1">LTV</p>
                    <p className="text-xl font-bold text-white">65.0%</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded border border-white/5 text-center">
                    <p className="text-[8px] text-slate-500 uppercase mb-1">DSCR</p>
                    <p className="text-xl font-bold text-emerald-400">1.85x</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Portfolio Asset Diversification */}
            <div className="col-span-2 bg-white/5 border border-white/10 p-6 rounded-lg mt-8">
              <h4 className="text-[10px] text-white uppercase tracking-widest mb-6">Portfolio Asset Diversification</h4>
              <div className="flex items-center gap-12">
                <div className="h-64 w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {typeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {typeDistributionData.map((item, i) => (
                    <div key={i} className="p-3 bg-black/40 rounded border border-white/5 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div>
                        <p className="text-[8px] text-slate-500 uppercase">{item.name}</p>
                        <p className="text-sm font-bold text-white">{item.value} {item.value === 1 ? 'Asset' : 'Assets'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 bg-white/5 border border-white/10 rounded-lg h-[500px] relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Globe className="w-12 h-12 text-primary/20 mx-auto animate-pulse" />
                  <p className="text-[10px] text-primary/40 uppercase tracking-[0.3em]">Geospatial Engine Initializing...</p>
                </div>
              </div>
              <div className="absolute top-4 left-4 p-3 apple-glass rounded border border-white/10 z-10">
                <p className="text-[8px] text-white font-bold uppercase mb-2">Traffic Heatmap (Pedestrian)</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-1 rounded" style={{ backgroundColor: `rgba(16, 185, 129, ${0.2 * (i + 1)})` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Zones of Influence (500m)</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400">Competitors</span>
                    <span className="text-[9px] text-white font-bold">12 Nodes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400">New Construction</span>
                    <span className="text-[9px] text-yellow-400 font-bold">3 Projects</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400">Public Transit</span>
                    <span className="text-[9px] text-emerald-400 font-bold">2 Stations</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Satellite Image Analysis</h4>
                <div className="aspect-square bg-black/40 rounded flex items-center justify-center relative">
                   <div className="absolute inset-0 border border-primary/10 rounded" />
                   <Radar className="w-8 h-8 text-primary/20 animate-spin-slow" />
                   <p className="absolute bottom-4 text-[7px] text-primary/40 uppercase tracking-widest">Scanning Facade Integrity...</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Tenant Name</th>
                    <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Area %</th>
                    <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Lease End</th>
                    <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Risk Index</th>
                    <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Anchor Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { name: 'Global Tech Corp', area: 45, end: '2029-12', risk: 'LOW', anchor: true },
                    { name: 'Future Retail', area: 20, end: '2026-06', risk: 'HIGH', anchor: false },
                    { name: 'Creative Studio', area: 15, end: '2027-08', risk: 'MED', anchor: false }
                  ].map((t, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-[10px] text-white font-bold">{t.name}</td>
                      <td className="p-4 text-[10px] text-slate-400">{t.area}%</td>
                      <td className="p-4 text-[10px] text-slate-400">{t.end}</td>
                      <td className="p-4">
                        <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded", 
                          t.risk === 'LOW' ? "text-emerald-400 bg-emerald-400/10" : 
                          t.risk === 'MED' ? "text-yellow-400 bg-yellow-400/10" : "text-red-400 bg-red-400/10"
                        )}>{t.risk}</span>
                      </td>
                      <td className="p-4">
                        {t.anchor ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <X className="w-3 h-3 text-slate-600" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-8">
               <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                 <h4 className="text-[10px] text-white uppercase tracking-widest mb-6 flex items-center justify-between">
                    Anchor Exit Sensitivity Analysis
                    <span className="text-red-400 animate-pulse">VAR: -45%</span>
                 </h4>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { month: 'BASE', val: 100, color: 'var(--primary-accent)' },
                        { month: 'EXIT', val: 55, color: '#ff4444' },
                        { month: 'RECOV', val: 72, color: '#ffbb33' },
                        { month: 'STABIL', val: 88, color: '#00ff9d' },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="month" hide />
                        <YAxis hide domain={[0, 110]} />
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '8px' }}
                           cursor={{ fill: '#ffffff05' }}
                        />
                        <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                           {[1, 2, 3, 4].map((_, i) => (
                             <Cell key={i} fill={['#0bc5ea', '#ff4444', '#ffbb33', '#00ff9d'][i]} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <p className="text-[7px] text-slate-500 uppercase mt-4 text-center tracking-widest">Projected recovery horizon: 18 Months</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                 <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">ML Sentiment Analysis</h4>
                 <div className="space-y-4">
                   <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded">
                     <p className="text-[9px] text-emerald-400 font-bold mb-1">Positive Momentum</p>
                     <p className="text-[8px] text-emerald-400/60">Global Tech Corp announced $2B expansion in sector.</p>
                   </div>
                   <div className="p-3 bg-red-500/5 border border-red-500/20 rounded">
                     <p className="text-[9px] text-red-400 font-bold mb-1">Warning Signal</p>
                     <p className="text-[8px] text-red-400/60">Future Retail facing liquidity challenges in Q4.</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        )}
        {activeTab === 4 && (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Cadastral & Title</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-500 uppercase">Reg Number</span>
                    <span className="text-[9px] text-white font-mono">77:01:0001001:4432</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-500 uppercase">Last Audit</span>
                    <span className="text-[9px] text-white">2026-03-12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-500 uppercase">Encumbrances</span>
                    <span className="text-[9px] text-emerald-400 font-bold">NONE ACTIVE</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Due Diligence Docs</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['Purchase_Agreement.pdf', 'Title_Deed.pdf', 'Tax_Certificate.pdf', 'Environmental_Report.pdf'].map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-black/40 border border-white/5 rounded hover:border-primary/30 cursor-pointer transition-colors">
                      <FileText className="w-3 h-3 text-primary" />
                      <span className="text-[8px] text-slate-400 truncate">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
              <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">EGRN History Log</h4>
              <div className="space-y-4">
                {[
                  { date: '2024-05-10', event: 'Ownership Transfer', status: 'COMPLETED' },
                  { date: '2022-11-15', event: 'Mortgage Discharge', status: 'VERIFIED' },
                  { date: '2018-09-01', event: 'Initial Registration', status: 'ARCHIVED' }
                ].map((log, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-16 text-[8px] font-mono text-slate-500">{log.date}</div>
                    <div className="flex-1">
                      <p className="text-[9px] text-white font-bold">{log.event}</p>
                      <p className="text-[7px] text-primary/60">{log.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SyndicateWarRoom = () => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <div className="flex justify-between items-center border-b border-white/10 pb-4">
      <div>
        <h3 className="text-sm font-mono text-white uppercase tracking-[0.2em] flex items-center gap-3">
          <Users className="w-4 h-4 text-primary animate-pulse" />
          Syndicate War Room // Project_Consolidation
        </h3>
        <p className="text-[8px] text-slate-500 uppercase mt-1 tracking-widest font-bold">Multi-Institutional Capital Pooling & Governance Steering</p>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-primary text-black text-[9px] font-bold uppercase tracking-widest rounded hover:bg-primary/80 transition-all">Initialize Pool</button>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 h-80 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mb-4">
              <Lock className="w-8 h-8 text-primary/40" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Active Syndicates</h4>
            <p className="text-[8px] text-slate-600 mt-1 uppercase tracking-tighter">Initiate a joint acquisition project to open a secure war room corridor</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-[8px] text-slate-500 uppercase mb-1">Total Available Institutional Liquidity</p>
            <p className="text-xl font-mono font-bold text-emerald-400">$1.24B</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-[8px] text-slate-500 uppercase mb-1">Awaiting Consensus</p>
            <p className="text-xl font-mono font-bold text-primary">0 Projects</p>
          </div>
        </div>
      </div>
      <div className="p-6 rounded-xl bg-slate-950 border border-white/5 space-y-6">
        <h5 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2">Institutional Partners</h5>
        <div className="space-y-4">
          {['VTB_Strategic', 'Alpha_Capital', 'GPB_Assets'].map((bank, i) => (
             <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                <span className="text-[10px] font-bold text-slate-300">{bank}</span>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   <span className="text-[7px] text-emerald-500 uppercase font-bold">Online</span>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SecondaryMarket = ({ marketOrders, onBuy, portfolio, user }: any) => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <div className="flex justify-between items-center border-b border-white/10 pb-4">
      <div>
        <h3 className="text-sm font-mono text-white uppercase tracking-[0.2em] flex items-center gap-3">
          <ShoppingCart className="w-4 h-4 text-secondary animate-pulse" />
          Secondary Asset Exchange // Liquidity_Portal
        </h3>
        <p className="text-[8px] text-slate-500 uppercase mt-1 tracking-widest font-bold">Transfer of Equity Shares & Fractional Yield Rights</p>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-4">
       {[
         { label: 'Market Volume (24h)', val: `$${((marketOrders?.filter((o: any) => o.status === 'SOLD').length || 0) * 1.2).toFixed(1)}M`, trend: '+12%' },
         { label: 'Active Listings', val: `${marketOrders?.filter((o: any) => o.status === 'OPEN').length || 0}Nodes`, trend: 'Market Open' },
         { label: 'Pending Bids', val: '14Nodes', trend: 'Active' },
         { label: 'Platform Fee', val: '2.5%', trend: 'Tier-1' }
       ].map((stat: any, i: number) => (
         <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
           <p className="text-[8px] text-slate-500 uppercase mb-1">{stat.label}</p>
           <p className="text-lg font-bold text-white">{stat.val}</p>
           <p className="text-[10px] text-emerald-400 font-mono tracking-widest">{stat.trend}</p>
         </div>
       ))}
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5">
            <tr>
              <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest">Asset_Node</th>
              <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest">Seller_ID</th>
              <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest">Exit_Price</th>
              <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest">Yield_Relief</th>
              <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {marketOrders && marketOrders.filter((o: any) => o.status === 'OPEN').map((order: any) => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                 <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white uppercase tracking-tight">{order.assetName}</span>
                      <span className="text-[8px] text-slate-600 font-mono uppercase tracking-widest">ID: {order.assetId}</span>
                    </div>
                 </td>
                 <td className="p-4">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{order.sellerName.substring(0, 12)}...</span>
                 </td>
                 <td className="p-4">
                    <span className="text-sm font-bold text-primary">${order.price.toLocaleString()}</span>
                 </td>
                 <td className="p-4">
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">+${order.yieldPerCycle.toLocaleString()}/mo</span>
                 </td>
                 <td className="p-4">
                   {order.sellerUid === user?.uid ? (
                     <div className="text-[8px] text-slate-600 uppercase font-bold tracking-widest border border-white/10 px-3 py-1.5 rounded-lg w-fit">
                       Your Listing
                     </div>
                   ) : (
                     <button 
                       onClick={() => onBuy(order)}
                       className="px-4 py-1.5 bg-secondary text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-secondary/80 transition-all shadow-[0_0_15px_rgba(var(--secondary-accent),0.3)] active:scale-95"
                     >
                       Execute Bid
                     </button>
                   )}
                 </td>
              </tr>
            ))}
            {(!marketOrders || marketOrders.filter((o: any) => o.status === 'OPEN').length === 0) && (
              <tr>
                <td colSpan={5} className="p-20 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-30">
                     <TrendingDown className="w-10 h-10 text-slate-500" />
                     <div>
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Market Liquidity Static</p>
                       <p className="text-[8px] text-slate-600 mt-1 italic">Awaiting secondary market listings from platform participants</p>
                     </div>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </div>
  </div>
);

const InvestorCabinet = ({ 
  isOpen, 
  onClose, 
  balance, 
  portfolioValue, 
  portfolio, 
  performanceHistory,
  analyzedHexes = [],
  marketOrders = [],
  onListOnMarket,
  onBuyFromMarket,
  user,
  t,
  onSelectAsset
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  balance: number, 
  portfolioValue: number, 
  portfolio: any[], 
  performanceHistory: any[],
  analyzedHexes?: any[],
  marketOrders?: SecondaryMarketOrder[],
  onListOnMarket: (asset: any) => void,
  onBuyFromMarket: (order: SecondaryMarketOrder) => void,
  user: any,
  t: any,
  onSelectAsset: (asset: any) => void
}) => {
  const [activeModule, setActiveModule] = useState<'overview' | 'matrix' | 'districts' | 'scenarios' | 'audit' | 'settings' | 'warroom' | 'market'>('overview');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [selectedHex, setSelectedHex] = useState<any | null>(null);

  useEffect(() => {
    const anomalies = portfolio.filter((p: any) => p.status === 3);
    if (anomalies.length > 0 && isOpen) {
      const interval = setInterval(() => {
        soundService.playSonar();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [portfolio, isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-black flex flex-col font-mono"
    >
      {/* Top Bar */}
      <div className="h-12 border-b border-primary/20 bg-black flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center border border-primary/40">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[10px] font-bold text-white tracking-[0.4em] uppercase">Yardsoft Aegis // C&C Terminal</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] text-emerald-500 uppercase tracking-widest">Secure Link Active</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Navigation & Tree */}
        <div className="w-64 border-r border-white/10 flex flex-col bg-[#050505]">
          <div className="p-6 space-y-8">
            <div className="space-y-2">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold">Main Modules</p>
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Strategic Overview', icon: LayoutDashboard },
                  { id: 'matrix', label: 'Asset Matrix', icon: Database },
                  { id: 'districts', label: 'Tactical Districts', icon: Hexagon },
                  { id: 'warroom', label: 'Syndicate War Room', icon: Users },
                  { id: 'market', label: 'Secondary Exchange', icon: ShoppingCart },
                  { id: 'scenarios', label: 'Scenario Builder', icon: Zap },
                  { id: 'audit', label: 'Black Box Recorder', icon: History },
                  { id: 'settings', label: 'Security Config', icon: Settings }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id as any)}
                    className={cn("w-full flex items-center gap-3 px-3 py-2 rounded text-[9px] font-bold uppercase tracking-wider transition-all",
                      activeModule === item.id ? "bg-primary text-black" : "text-slate-500 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {activeModule === 'districts' && (
              <div className="space-y-4">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold">Analyzed Sectors</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {analyzedHexes.length === 0 ? (
                    <p className="text-[8px] text-slate-700 italic">No tactical data decrypted...</p>
                  ) : (
                    analyzedHexes.map((hex, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedHex(hex)}
                        className={cn(
                          "w-full text-left p-2 rounded border transition-all",
                          selectedHex?.hex === hex.hex 
                            ? "bg-primary/20 border-primary/40 text-primary" 
                            : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-white"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold font-mono">SEC_{hex.hex.slice(-6).toUpperCase()}</span>
                          <span className="text-[7px] opacity-60">{hex.occupancy}%</span>
                        </div>
                        <p className="text-[7px] truncate opacity-50">{hex.analysis.replace(/#/g, '').split('\n')[0].trim()}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold">Portfolio Tree</p>
              <div className="space-y-2 pl-2 border-l border-white/5">
                {['Sector_Alpha', 'Sector_Beta', 'Sector_Gamma'].map((sector, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2 text-[8px] text-slate-400 uppercase">
                      <ChevronRight className="w-2 h-2" />
                      {sector}
                    </div>
                    <div className="pl-4 space-y-1">
                      {portfolio.slice(0, 2).map((p, j) => (
                        <div key={j} className="text-[7px] text-slate-600 hover:text-primary cursor-pointer transition-colors">
                          OBJ_{p.id.toString().substring(0, 6)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Main Terminal */}
        <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
            {activeModule === 'overview' && <StrategicOverview portfolio={portfolio} balance={balance} portfolioValue={portfolioValue} performanceHistory={performanceHistory} />}
            {activeModule === 'matrix' && <AssetMatrix portfolio={portfolio} onSelect={setSelectedAsset} onSelectAsset={onSelectAsset} onList={onListOnMarket} />}
            {activeModule === 'warroom' && <SyndicateWarRoom />}
            {activeModule === 'market' && <SecondaryMarket marketOrders={marketOrders} onBuy={onBuyFromMarket} portfolio={portfolio} user={user} />}
            {activeModule === 'districts' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-sm font-mono text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <Hexagon className="w-4 h-4 text-primary animate-pulse" />
                      Tactical District Analytics // Hive_Mind_Core
                    </h3>
                    <p className="text-[8px] text-slate-500 uppercase mt-1 tracking-widest font-bold">Deep Sector Intelligence & Tenant Profile Reconstruction</p>
                  </div>
                </div>

                {!selectedHex ? (
                  <div className="h-96 flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <Cpu className="w-10 h-10 text-slate-700 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Sector Selected</h4>
                      <p className="text-[8px] text-slate-600 mt-1 uppercase tracking-tighter">Select a decrypted sector from the sidebar to view individualized analytics</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="p-8 rounded-2xl bg-slate-950 border border-primary/20 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Hexagon className="w-40 h-40 text-primary" />
                         </div>
                         <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                               <div className="px-3 py-1 bg-primary/20 border border-primary/40 rounded text-[10px] font-bold text-primary uppercase tracking-widest">
                                  Sector_{selectedHex.hex.slice(-6).toUpperCase()}
                               </div>
                               <div className="h-px flex-1 bg-white/10" />
                               <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Analysis_V4.0</span>
                            </div>

                            <div className="markdown-body detailed-cabinet-analysis text-slate-300 leading-relaxed font-sans mt-4">
                               <Markdown>{selectedHex.analysis}</Markdown>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                           <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Growth Projection</h5>
                           <div className="h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                  { name: 'Q1', val: 20 },
                                  { name: 'Q2', val: 35 },
                                  { name: 'Q3', val: 25 },
                                  { name: 'Q4', val: 45 },
                                ]}>
                                  <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="var(--primary-accent-rgb)" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="var(--primary-accent-rgb)" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <Area type="monotone" dataKey="val" stroke="var(--primary-accent)" fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                           <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Saturation Level</h5>
                           <div className="flex flex-col items-center justify-center h-32 space-y-4">
                              <div className="relative w-24 h-24">
                                 <svg className="w-full h-full" viewBox="0 0 36 36">
                                    <path className="text-white/5" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeWidth="2" fill="none" />
                                    <motion.path 
                                      initial={{ strokeDasharray: "0, 100" }}
                                      animate={{ strokeDasharray: `${selectedHex.occupancy}, 100` }}
                                      className="text-primary" 
                                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" 
                                    />
                                 </svg>
                                 <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                    <span className="text-xl font-bold font-mono text-white">{selectedHex.occupancy}%</span>
                                    <span className="text-[6px] text-slate-500 uppercase mt-1">Saturated</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
                          <h5 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-white/10 pb-2">Sector Identity</h5>
                          <div className="space-y-4">
                             <div>
                                <p className="text-[7px] text-slate-500 uppercase mb-1">H3 Index</p>
                                <p className="text-xs font-mono text-slate-200">{selectedHex.hex}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <p className="text-[7px] text-slate-500 uppercase mb-1">Density</p>
                                   <div className="flex items-center gap-2">
                                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                         <div className="h-full bg-emerald-500" style={{ width: `${selectedHex.occupancy}%` }} />
                                      </div>
                                   </div>
                                </div>
                                <div>
                                   <p className="text-[7px] text-slate-500 uppercase mb-1">Yield Value</p>
                                   <p className="text-xs font-mono text-emerald-400">High</p>
                                </div>
                             </div>
                             <div>
                                <p className="text-[7px] text-slate-500 uppercase mb-1">Last Analysis</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                   <Clock className="w-3 h-3" />
                                   {new Date(selectedHex.timestamp).toLocaleString()}
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                          <div className="flex items-center gap-2">
                             <Target className="w-4 h-4 text-primary" />
                             <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest">Tactical Directives</h5>
                          </div>
                          <ul className="space-y-3">
                             {[
                               'Initialize tenant outreach program.',
                               'Optimize supply chain nodes.',
                               'Monitor local competition flux.'
                             ].map((d, i) => (
                               <li key={i} className="flex gap-2 items-start">
                                  <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                                  <p className="text-[9px] text-slate-300 leading-tight uppercase tracking-tighter">{d}</p>
                               </li>
                             ))}
                          </ul>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeModule === 'scenarios' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-mono text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" />
                    Scenario Builder // Stress_Test_Engine
                  </h3>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 bg-primary text-black text-[9px] font-bold uppercase tracking-widest rounded hover:bg-primary/90 transition-all">Run Simulation</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-lg space-y-6">
                    <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Stress Parameters</h4>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                          <span>Central Bank Key Rate</span>
                          <span className="text-primary">21.0%</span>
                        </div>
                        <input type="range" min="5" max="30" defaultValue="21" className="w-full accent-primary bg-white/10 h-1 rounded-full appearance-none" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                          <span>Rental Income Shock</span>
                          <span className="text-red-400">-15.0%</span>
                        </div>
                        <input type="range" min="-50" max="0" defaultValue="-15" className="w-full accent-red-400 bg-white/10 h-1 rounded-full appearance-none" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                          <span>Vacancy Rate Increase</span>
                          <span className="text-yellow-400">+10.0%</span>
                        </div>
                        <input type="range" min="0" max="50" defaultValue="10" className="w-full accent-yellow-400 bg-white/10 h-1 rounded-full appearance-none" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-6 rounded-lg space-y-6">
                    <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Projected Impact</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-black/40 rounded border border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase mb-1">Portfolio NAV Impact</p>
                        <p className="text-2xl font-bold text-red-400">-$1,240,000</p>
                        <p className="text-[7px] text-red-400/60 uppercase mt-1">Critical Exposure in Sector_Beta</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/40 rounded border border-white/5 text-center">
                          <p className="text-[8px] text-slate-500 uppercase mb-1">Risk Assets</p>
                          <p className="text-xl font-bold text-yellow-400">+5 Units</p>
                        </div>
                        <div className="p-4 bg-black/40 rounded border border-white/5 text-center">
                          <p className="text-[8px] text-slate-500 uppercase mb-1">Default Prob.</p>
                          <p className="text-xl font-bold text-red-400">12.4%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <h4 className="text-[10px] text-white uppercase tracking-widest mb-4">Acquisition Impact Analysis</h4>
                  <div className="flex items-center gap-8">
                    <div className="flex-1 p-4 border border-dashed border-primary/20 rounded flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 transition-all">
                      <Plus className="w-6 h-6 text-primary/40" />
                      <span className="text-[8px] text-primary/60 uppercase font-bold">Add Virtual Asset to Portfolio</span>
                    </div>
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-[8px] text-slate-500 uppercase">
                        <span>Diversification Index</span>
                        <span className="text-emerald-400">0.82</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[82%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeModule === 'audit' && (
              <div className="space-y-6">
                <h3 className="text-[10px] font-mono text-white uppercase tracking-widest flex items-center gap-2">
                  <History className="w-3 h-3 text-secondary" />
                  Black Box Recorder // Audit_Log
                </h3>
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded text-[8px] font-mono">
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">2026-04-14 14:15:22</span>
                        <span className="text-white font-bold">ACCESS_GRANTED</span>
                        <span className="text-slate-400">IP: 192.168.1.104 (Verified)</span>
                      </div>
                      <span className="text-primary/40">NODE_774</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeModule === 'settings' && (
              <div className="max-w-2xl space-y-8">
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <h4 className="text-[10px] text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Key className="w-3 h-3 text-primary" />
                    API Key Management
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-black/40 rounded border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white font-bold">Bloomberg_Terminal_Uplink</span>
                        <span className="text-[7px] text-slate-500">Expires in 12 days</span>
                      </div>
                      <button className="text-[8px] text-red-400 uppercase font-bold">Revoke</button>
                    </div>
                    <button className="w-full py-2 border border-dashed border-primary/30 rounded text-[8px] text-primary uppercase font-bold hover:bg-primary/5 transition-all">+ Generate New Uplink Key</button>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                  <h4 className="text-[10px] text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Shield className="w-3 h-3 text-secondary" />
                    Inheritance Protocol
                  </h4>
                  <div className="p-4 bg-secondary/5 border border-secondary/20 rounded">
                    <p className="text-[9px] text-secondary/80 leading-relaxed">
                      Protocol established. In case of 90 days inactivity, Read-Only access will be granted to verified beneficiary [ID: TRUST-882].
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Deep Dive Overlay */}
          <AnimatePresence>
            {selectedAsset && (
              <DeepDiveTerminal asset={selectedAsset} portfolioDetailed={portfolio} onClose={() => setSelectedAsset(null)} />
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Mini-map & Tactical */}
        <div className="w-64 border-l border-white/10 flex flex-col bg-[#050505]">
          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold">Tactical Mini-map</p>
              <div className="aspect-square bg-slate-900 rounded-lg border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radar className="w-12 h-12 text-primary/10 animate-spin-slow" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full pulsate-glow" />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold">Tactical Feed</p>
              <div className="space-y-3">
                {[
                  { type: 'alert', msg: 'ANOMALY: OBJ_4432', time: '2m ago' },
                  { type: 'info', msg: 'LEASE_END: OBJ_8821', time: '1h ago' },
                  { type: 'success', msg: 'VALUATION_UP: SECTOR_7', time: '4h ago' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={cn("w-1 h-1 rounded-full mt-1.5", 
                      item.type === 'alert' ? "bg-red-500" : item.type === 'success' ? "bg-emerald-500" : "bg-primary"
                    )} />
                    <div className="flex-1">
                      <p className="text-[9px] text-white font-bold leading-tight">{item.msg}</p>
                      <p className="text-[7px] text-slate-500 uppercase">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Ticker */}
      <TacticalTicker />
    </motion.div>
  );
};

const TacticalHUD = ({ lat, lon }: { lat: number, lon: number }) => {
  const latInt = Math.abs(Math.floor(lat)).toString().padStart(2, '0');
  const lonInt = Math.abs(Math.floor(lon)).toString().padStart(2, '0');
  
  const latDec = (Math.abs(lat) % 1).toFixed(6).substring(2);
  const lonDec = (Math.abs(lon) % 1).toFixed(6).substring(2);
  
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[55] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Scanning Coordinate Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-px h-full bg-primary/40 transform -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-primary/40 transform -translate-y-1/2" />
          <div className="absolute inset-0 flex flex-col justify-around py-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full h-px bg-primary/10" />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-row justify-around px-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-px h-full bg-primary/10" />
            ))}
          </div>
        </div>

        {/* Main Data Top */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[8%] sm:top-[12%] flex flex-col items-center gap-1 scale-75 sm:scale-100"
        >
          <div className="w-24 h-px bg-primary/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          <span className="text-[10px] font-mono font-bold text-primary tracking-[0.5em] uppercase opacity-80">LAT_COORD [SYSTEM_A1]</span>
          <span className="text-[24px] font-mono font-bold text-primary tracking-[0.2em] shadow-primary/20 drop-shadow-md">
            {latInt}.<span className="text-sm opacity-60 font-medium">{latDec}</span>
            <span className="ml-2 text-primary/40 text-[10px]">°N</span>
          </span>
          <div className="flex gap-6 mt-2 opacity-40">
            <span className="text-[7px] font-mono text-primary tracking-widest">TS_{time % 1000000}</span>
            <span className="text-[7px] font-mono text-primary tracking-widest">UNCERTAINTY: 0.00002m</span>
          </div>
        </motion.div>

        {/* Main Data Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-[8%] sm:bottom-[12%] flex flex-col items-center gap-1 scale-75 sm:scale-100"
        >
          <div className="flex gap-6 mb-2 opacity-40">
            <span className="text-[7px] font-mono text-primary tracking-widest font-bold">UPLINK_STABLE</span>
            <span className="text-[7px] font-mono text-primary tracking-widest">SEC_LEVEL_04</span>
          </div>
          <span className="text-[24px] font-mono font-bold text-primary tracking-[0.2em] shadow-primary/20 drop-shadow-md">
            {lonInt}.<span className="text-sm opacity-60 font-medium">{lonDec}</span>
            <span className="ml-2 text-primary/40 text-[10px]">°E</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-primary tracking-[0.5em] uppercase opacity-80">LON_COORD [SYSTEM_B2]</span>
          <div className="w-24 h-px bg-primary/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
        </motion.div>

        {/* Center Reticle */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          className="relative w-64 h-64 sm:w-96 sm:h-96 flex items-center justify-center"
        >
           <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute">
             <defs>
               <filter id="glow">
                 <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                 <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
                 </feMerge>
               </filter>
             </defs>

             {/* Animated Pulsing Rings */}
             <motion.circle 
                cx="100" cy="100" r="45" 
                stroke="white" strokeWidth="0.5" fill="none" 
                strokeDasharray="1 3"
                animate={{ r: [43, 47, 43], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             />
             <motion.circle 
                cx="100" cy="100" r="35" 
                stroke="white" strokeWidth="1" fill="none"
                filter="url(#glow)"
                animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             />
             <circle cx="100" cy="100" r="1.5" fill="white" filter="url(#glow)" />
             
             {/* Cross lines */}
             <g stroke="white" strokeWidth="1" filter="url(#glow)">
               <line x1="100" y1="75" x2="100" y2="88" />
               <line x1="100" y1="112" x2="100" y2="125" />
               <line x1="75" y1="100" x2="88" y2="100" />
               <line x1="112" y1="100" x2="125" y2="100" />
             </g>

             {/* Inner brackets - Pulsing Cyan/White */}
             <g stroke="#00ffff" strokeWidth="1" fill="none" filter="url(#glow)">
               <path d="M85 85 L90 85 L90 90" />
               <path d="M115 85 L110 85 L110 90" />
               <path d="M85 115 L90 115 L90 110" />
               <path d="M115 115 L110 115 L110 110" />
             </g>

             {/* Degree ticks */}
             {[0, 90, 180, 270].map(angle => (
               <g key={angle} transform={`rotate(${angle} 100 100)`}>
                 <line x1="100" y1="45" x2="100" y2="50" stroke="white" strokeWidth="0.5" opacity="0.5" />
               </g>
             ))}
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

const StrategicReportModal = ({ isOpen, onClose, data, t }: any) => {
  const [activePage, setActivePage] = useState('overview');
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const pages = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'specs', label: 'Specifications', icon: Building2 },
    { id: 'swot', label: 'SWOT Analysis', icon: Target },
    { id: 'traffic', label: 'Traffic & Flow', icon: Car },
    { id: 'catchment', label: 'Catchment', icon: Users },
    { id: 'competition', label: 'Competition', icon: Shield },
    { id: 'market', label: 'Market Trends', icon: TrendingUp },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative h-64 rounded-2xl overflow-hidden border border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
              <img 
                src={`https://picsum.photos/seed/${data.id}/1200/600`} 
                alt="Asset Intelligence" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-6 left-6 z-20">
                <h1 className="text-3xl font-display font-bold text-white tracking-tight leading-none mb-2">
                  {data.building.title || t.portfolio}
                </h1>
                <div className="flex items-center gap-2 text-primary font-mono text-xs tracking-widest uppercase">
                  <MapPin className="w-3 h-3" />
                  {data.building.address}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Strategic Score', value: '8.4', color: 'text-primary' },
                { label: 'Risk Index', value: 'LOW', color: 'text-emerald-400' },
                { label: 'Market Rank', value: '#12', color: 'text-secondary' },
              ].map((stat, i) => (
                <div key={i} className="bg-surface/40 p-5 rounded-2xl border border-border shadow-soft flex flex-col items-center">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">{stat.label}</p>
                  <p className={cn("text-3xl font-mono font-bold", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface/40 p-6 rounded-2xl border border-border">
              <h3 className="text-xs font-display font-bold text-white uppercase tracking-widest mb-4">Intelligence Briefing</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-sans">
                {data.swot.market_context}
              </p>
            </div>
          </div>
        );
      case 'swot':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-display font-bold text-emerald-400 uppercase tracking-tight">Advantages</h3>
              </div>
              <div className="space-y-3">
                {data.swot.advantages.map((adv: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 transition-all hover:bg-emerald-500/10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 font-sans">{adv}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-display font-bold text-red-500 uppercase tracking-tight">Vulnerabilities</h3>
              </div>
              <div className="space-y-3">
                {data.swot.risks.map((risk: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start p-4 rounded-xl bg-red-500/5 border border-red-500/10 transition-all hover:bg-red-500/10">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 font-sans">{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'traffic':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-surface/40 p-6 rounded-2xl border border-border">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xs font-display font-bold text-white uppercase tracking-widest">Pedestrian Intelligence</h3>
                   <span className="text-2xl font-mono font-bold text-primary">{data.traffic.pedestrian.toLocaleString()}</span>
                 </div>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={[
                       { time: '08:00', val: 320 },
                       { time: '10:00', val: 560 },
                       { time: '12:00', val: 890 },
                       { time: '14:00', val: 780 },
                       { time: '16:00', val: 920 },
                       { time: '18:00', val: 1200 },
                       { time: '20:00', val: 450 },
                     ]}>
                       <defs>
                          <linearGradient id="colorPed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary-accent-rgb)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--primary-accent-rgb)" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                       <Area type="monotone" dataKey="val" stroke="var(--primary-accent)" fillOpacity={1} fill="url(#colorPed)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </div>
               <div className="bg-surface/40 p-6 rounded-2xl border border-border">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-widest">Vehicle Throughput</h3>
                    <span className="text-2xl font-mono font-bold text-secondary">{data.traffic.vehicle.toLocaleString()}</span>
                  </div>
                  <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={[
                       { day: 'Mon', val: 4200 },
                       { day: 'Tue', val: 3800 },
                       { day: 'Wed', val: 5100 },
                       { day: 'Thu', val: 4600 },
                       { day: 'Fri', val: 5800 },
                       { day: 'Sat', val: 2100 },
                       { day: 'Sun', val: 1800 },
                     ]}>
                       <XAxis dataKey="day" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                       <Bar dataKey="val" fill="var(--secondary-accent)" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                  </div>
               </div>
             </div>
          </div>
        );
      case 'catchment':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="bg-surface/40 p-8 rounded-2xl border border-border text-center overflow-hidden relative">
                   <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                   <div className="relative z-10">
                     <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                     <h3 className="text-3xl font-mono font-bold text-white mb-2">{(data.catchment.tenMin / 1000).toFixed(1)}k</h3>
                     <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Potential Daily Audience</p>
                   </div>
                </div>
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400">5 Min Walk Radius</span>
                      <span className="text-sm font-mono text-primary font-bold">{data.catchment.fiveMin.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-primary" />
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400">10 Min Walk Radius</span>
                      <span className="text-sm font-mono text-secondary font-bold">{data.catchment.tenMin.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-secondary" />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        );
      case 'competition':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-surface/40 rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-black/20">
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Entity Name</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Proximity</th>
                      <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest">Tactical Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.competitors.map((comp: any, i: number) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-200 font-medium">{comp.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">{comp.distance}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            comp.status === 'Active' ? "bg-emerald-500/10 text-emerald-400" :
                            comp.status === 'Neutral' ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-slate-500/10 text-slate-500"
                          )}>
                            {comp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        );
      case 'specs':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Asset Type', value: data.building.type || 'N/A' },
                { label: 'Area (SQFT)', value: data.building.sqft?.toLocaleString() || 'N/A' },
                { label: 'Year Built', value: data.building.yearBuilt || 'N/A' },
                { label: 'Parking Slots', value: data.building.parkingSpaces || 'N/A' },
                { label: 'Operational Status', value: 'Active' },
                { label: 'Security Level', value: 'A-Grade' },
              ].map((spec, i) => (
                <div key={i} className="p-5 rounded-2xl bg-surface/40 border border-border">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">{spec.label}</p>
                  <p className="text-base font-mono font-bold text-white">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'market':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-surface/40 p-6 rounded-2xl border border-border">
                <h3 className="text-xs font-display font-bold text-white uppercase tracking-widest mb-6">Price Trend Index</h3>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={[
                       { year: '2021', price: 4500 },
                       { year: '2022', price: 4800 },
                       { year: '2023', price: 5200 },
                       { year: '2024', price: 5100 },
                       { year: '2025', price: 5400 },
                       { year: '2026', price: 5900 },
                     ]}>
                       <XAxis dataKey="year" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                       <Line type="monotone" dataKey="price" stroke="var(--primary-accent)" strokeWidth={3} dot={{ fill: 'var(--primary-accent)' }} />
                     </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-secondary/10 border border-secondary/20">
                   <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-secondary" />
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Growth Potential</span>
                   </div>
                   <p className="text-xl font-mono font-bold text-white">+12.4% / year</p>
                </div>
                <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
                   <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Target ROI</span>
                      </div>
                   <p className="text-xl font-mono font-bold text-white">{data.building.roi || '18.5'}%</p>
                </div>
             </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full py-20 text-slate-600">
            <Activity className="w-12 h-12 mb-4 animate-pulse" />
            <p className="font-mono text-xs uppercase tracking-widest">Data Stream Incomplete</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex flex-col font-mono overflow-hidden print:bg-white print:text-black">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/40 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest leading-none mb-1">
              {t.reportTitle} // SECURE_NODE_REPORT
            </h2>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">
              Level_5 Clearance Authorized // Timestamp {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-xs font-bold uppercase tracking-widest"
          >
            <Printer className="w-4 h-4" />
            {t.reportExport}
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Sidebar Navigation - Responsive Header on mobile */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-2 sm:p-4 md:p-6 space-y-4 md:space-y-8 flex-shrink-0 print:hidden overflow-x-auto overflow-y-hidden md:overflow-y-auto bg-slate-900/50">
           <div className="flex md:flex-col gap-1.5 sm:gap-2 md:space-y-1 min-w-max md:min-w-0">
              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  className={cn(
                    "flex-shrink-0 md:w-full flex items-center gap-2 sm:gap-3 px-3 md:px-4 py-2 md:py-3.5 rounded-xl text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap lg:whitespace-normal text-left",
                    activePage === page.id 
                      ? "bg-primary text-black shadow-lg shadow-primary/20" 
                      : "text-slate-500 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
                  )}
                >
                  <page.icon className="w-3 h-3 sm:w-3.5 h-3.5 md:w-4 h-4" />
                  <span className="truncate md:overflow-visible">{page.label}</span>
                </button>
              ))}
           </div>

           <div className="hidden md:block pt-8 border-t border-white/5">
             <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[8px] uppercase font-bold text-primary mb-2">Security Hash</p>
                <p className="text-[10px] font-mono text-slate-500 break-all leading-tight opacity-50">
                  SH-R772-L19-V2026-X8842-P991
                </p>
             </div>
           </div>
        </div>

        {/* Report Content Body */}
        <div 
          ref={reportRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 lg:p-16 scrollbar-hide bg-[#020617] print:p-0 print:m-0 print:bg-white print:overflow-visible"
        >
          <div className="max-w-4xl mx-auto space-y-12 pb-20 print:space-y-8 print:p-0">
            {/* Page Header (Print only) - Hide in screen */}
            <div className="hidden print:block mb-8">
               <div className="flex justify-between items-end border-b-2 border-primary pb-4">
                 <div>
                    <h1 className="text-2xl font-bold uppercase">{t.reportTitle}</h1>
                    <p className="text-sm font-mono">{data.building.title}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs uppercase font-bold text-slate-500">{t.reportDate}</p>
                    <p className="text-sm font-mono">{new Date(data.timestamp).toLocaleDateString()}</p>
                 </div>
               </div>
            </div>

            {renderPage()}
            
            {/* Print Footer */}
            <div className="hidden print:mt-12 print:pt-4 print:border-t print:flex print:justify-between print:text-[10px] print:text-slate-400">
               <span>Confidential Strategic Intelligence Report // Yardsoft Aegis</span>
               <span>Page 1 of 1</span>
               <span>Generated by {data.timestamp}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [simulationYear, setSimulationYear] = useState(2026);
  const [showRiskRadar, setShowRiskRadar] = useState(false);
  const [showInfraPower, setShowInfraPower] = useState(false);
  const [showInfraComm, setShowInfraComm] = useState(false);
  const [showFutureProjects, setShowFutureProjects] = useState(false);
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
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<'anonymous' | 'investor' | 'admin'>('anonymous');
  const [balance, setBalance] = useState(5000000);
  const [portfolio, setPortfolio] = useState<(number | string)[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [basemap, setBasemap] = useState<any>('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
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
  const [uiStyle, setUiStyle] = useState<'tactical' | 'professional'>('tactical');
  const [showLogo, setShowLogo] = useState(true);
  
  // Sync theme and mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-theme', colorScheme);
    
    // Update basemap based on mode ONLY if it is currently a standard basemap
    setBasemap(prev => {
      // If prev is an object, it is a custom 3D mode, don't reset it
      if (typeof prev === 'object') return prev;
      
      return mode === 'light' 
        ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
    });
  }, [mode, colorScheme]);

  // Hide logo splash after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchMarker, setSearchMarker] = useState<{ lat: number, lon: number, name: string } | null>(null);
  const [pulse, setPulse] = useState(0);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showHexGrid, setShowHexGrid] = useState(false);
  // trafficTime removed from state to prevent 60fps App re-renders
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [activeSyndicateId, setActiveSyndicateId] = useState<string | null>(null);
  const [syndicateRoomOpen, setSyndicateRoomOpen] = useState(false);
  const [marketOrders, setMarketOrders] = useState<SecondaryMarketOrder[]>([
    {
      id: 'EXCH-T7X2K9L',
      assetId: '10254',
      assetName: 'Neo-Center Tower A',
      sellerUid: 'external-001',
      sellerName: 'Global Real Estate Trust',
      price: 185000000,
      yieldPerCycle: 2450000,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    },
    {
      id: 'EXCH-B4V1M8N',
      assetId: '10289',
      assetName: 'Quantum Logistics Hub',
      sellerUid: 'external-002',
      sellerName: 'Apex Capital',
      price: 72000000,
      yieldPerCycle: 980000,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    }
  ]);
  const [marketOpen, setMarketOpen] = useState(false);
  
  const activeSyndicate = useMemo(() => 
    activeSyndicateId ? syndicates.find(s => s.id === activeSyndicateId) : null,
  [syndicates, activeSyndicateId]);
  const [roadsData, setRoadsData] = useState<any[]>([]);
  const [isTrafficLoading, setIsTrafficLoading] = useState(false);

  // Local Auth Simulation
  useEffect(() => {
    const savedUser = localStorage.getItem('tactical_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      fetch(`/api/user/${parsedUser.uid}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setUser(data);
            setUserRole(data.role);
            setBalance(data.balance);
            setPortfolio(data.portfolio || []);
          } else {
            localStorage.removeItem('tactical_user');
          }
          setIsAuthReady(true);
        })
        .catch(() => setIsAuthReady(true));
    } else {
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    setAiAnalysis(null);
  }, [selectedBuilding]);

  const prevSelectedId = useRef<string | number | null>(null);

  // Smooth FlyTo when building is selected
  useEffect(() => {
    if (selectedBuilding && mapRef.current) {
      if (selectedBuilding.id === prevSelectedId.current) return;
      prevSelectedId.current = selectedBuilding.id;

      const coords = selectedBuilding.geometry.coordinates;
      // If it's a polygon, get the first coordinate of the first ring
      const [lng, lat] = selectedBuilding.geometry.type === 'Polygon' 
        ? coords[0][0] 
        : coords;

      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 17,
        pitch: 60,
        bearing: -20,
        duration: 2000,
        essential: true
      });
    }
  }, [selectedBuilding]);

  // Tactical Grid Lines Memo
  const gridLines = useMemo(() => {
    const lines = [];
    const step = 0.002; 
    const range = 0.5; 
    const baseLat = 51.5;
    const baseLon = -0.1;

    for (let lat = baseLat - range; lat <= baseLat + range; lat += step) {
      lines.push({ path: [[baseLon - range, lat], [baseLon + range, lat]] });
    }
    for (let lon = baseLon - range; lon <= baseLon + range; lon += step) {
      lines.push({ path: [[lon, baseLat - range], [lon, baseLat + range]] });
    }
    return lines;
  }, []);

  // Tactical Hex Districts Memo
  const hexDistricts = useMemo(() => {
    if (!showHexGrid) return [];
    
    try {
      // Generate hexagons around current location
      const resolution = viewState.zoom > 14 ? 9 : viewState.zoom > 11 ? 8 : 7;
      const centerHex = h3.latLngToCell(viewState.latitude, viewState.longitude, resolution);
      // Get a disk of hexagons around the center
      const cells = h3.gridDisk(centerHex, 12);
      
      return cells.map(h => {
        // Deterministic but random-looking data based on hex ID
        const hash = h.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const value = (hash % 100);
        const occupancy = (hash % 80) + 20;
        
        return {
          hex: h,
          value,
          occupancy,
          id: h,
          name: `ZONE_${h.toUpperCase().slice(-4)}`,
          type: 'DISTRICT_CELL',
          height: 0, // District cells are flat
          status: occupancy > 80 ? 2 : 1, // Strategic status
          roi: occupancy.toFixed(1)
        };
      });
    } catch (e) {
      console.error("H3 Error:", e);
      return [];
    }
  }, [showHexGrid, viewState.latitude, viewState.longitude, viewState.zoom]);

  // Data Only Mode Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd' && !isTyping) {
        setDataOnlyMode(prev => !prev);
        soundService.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping]);

  // Sound on Hover
  useEffect(() => {
    if (hoverInfo) {
      soundService.playClick();
    }
  }, [hoverInfo?.id]);

  // Sound on Load & Map Initialization
  const handleMapLoad = useCallback((e: any) => {
    soundService.playSonar();
    
    const map = e.target;
    
    // Add 3D Terrain source (Relief Support)
    if (!map.getSource('terrain')) {
      map.addSource('terrain', {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256
      });
    }

    // Enable terrain relief globally
    map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
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
    // Mock login for demonstration - in real app would use OAuth or local creds
    const mockUser = {
      uid: 'user_' + Math.random().toString(36).substr(2, 9),
      email: 'lookastarik@gmail.com',
      displayName: 'Luka Starik',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luka'
    };
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUser)
      });
      const data = await res.json();
      setUser(data);
      setUserRole(data.role);
      setBalance(data.balance);
      setPortfolio(data.portfolio || []);
      localStorage.setItem('tactical_user', JSON.stringify(data));
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole('anonymous');
    localStorage.removeItem('tactical_user');
    setProfileOpen(false);
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Advanced Filters State
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    statuses: ['stable', 'risk', 'anomalous'],
    minRoi: 0,
    owner: ''
  });
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [simulationParams, setSimulationParams] = useState({ rentRate: 0, occupancy: 0, inflation: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [heatMapMode, setHeatMapMode] = useState<'none' | 'pedestrian' | 'price' | 'risk'>('none');

  useEffect(() => {
    soundService.setMuted(isMuted);
  }, [isMuted]);

  const handleGeocode = async () => {
    if (!newAsset.address) return;
    setIsGeocoding(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAsset.address)}&limit=1`);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setNewAsset(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lon) }));
        setViewState(v => ({ 
          ...v, 
          latitude: parseFloat(lat), 
          longitude: parseFloat(lon), 
          zoom: 17,
          transitionDuration: 1500
        }));
        soundService.playSonar();
      }
    } catch (error) {
      console.error('Geocoding failure', error);
      soundService.playDenied();
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("INVESTMENT MEMORANDUM", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Strategic Report Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    doc.text(`Authority: ${user?.email || 'Institutional_Unit'}`, 20, 45);
    
    doc.setFontSize(14);
    doc.text("Portfolio Summary", 20, 60);
    doc.setFontSize(10);
    doc.text(`Market Liquidity: $${balance.toLocaleString()}`, 20, 70);
    doc.text(`Aggregate Asset Value: $${portfolioValue.toLocaleString()}`, 20, 75);
    doc.text(`ROI Effect Index: ${(simulationParams.rentRate * 0.5).toFixed(2)}%`, 20, 80);

    doc.setFontSize(14);
    doc.text("Strategic Assets", 20, 95);
    portfolioDetailed.slice(0, 10).forEach((asset, i) => {
      doc.setFontSize(10);
      doc.text(`${i+1}. ${asset.title} - $${asset.cost.toLocaleString()} (ROI: ${asset.roi}%)`, 20, 105 + (i * 8));
    });

    doc.save(`Investment_Memorandum_${Date.now()}.pdf`);
    soundService.playSuccess();
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(portfolioDetailed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Strategic_Assets");
    XLSX.writeFile(wb, `Yard_Asset_Ledger_${Date.now()}.xlsx`);
    soundService.playSuccess();
  };

  const handleExportScreenshot = () => {
    const mapElement = document.getElementById('strategic-map-container');
    if (mapElement) {
      toPng(mapElement)
        .then((dataUrl) => {
          saveAs(dataUrl, `Tactical_Screen_${Date.now()}.png`);
          soundService.playSuccess();
        })
        .catch((err) => {
          console.error('Snapshot failure', err);
          soundService.playDenied();
        });
    }
  };

  // Floating Particles for Sci-fi Atmosphere
  const FloatingParticles = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            opacity: Math.random() * 0.5
          }}
          animate={{ 
            y: [null, -100],
            opacity: [0, 0.4, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: Math.random() * 10 + 10, 
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute w-1 h-1 bg-primary rounded-full blur-[1px]"
        />
      ))}
    </div>
  );
  const [gridBrightness, setGridBrightness] = useState(0.1);
  const [scanlineIntensity, setScanlineIntensity] = useState(0.3);
  const [buildingScanlineIntensity, setBuildingScanlineIntensity] = useState(0.2);

  // Traffic Animation Loop - Removed from App to prevent performance crashes
  useEffect(() => {
    // Handled internally in DeckGLOverlay or via project_uTime
  }, [showTraffic]);

  // Fetch Roads for Traffic Simulation
  useEffect(() => {
    const fetchRoads = async () => {
      setIsTrafficLoading(true);
      const bbox = `${viewState.latitude - 0.01},${viewState.longitude - 0.02},${viewState.latitude + 0.01},${viewState.longitude + 0.02}`;
      const query = `[out:json][timeout:25];way["highway"~"primary|secondary|tertiary|residential"](${bbox});out geom;`;
      const endpoints = [
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`,
        `https://overpass.osm.ch/api/interpreter?data=${encodeURIComponent(query)}`
      ];

      for (const url of endpoints) {
        try {
          const response = await fetch(url);
          
          if (!response.ok) continue;

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) continue;

          const data = await response.json();
          
          if (data && data.elements) {
            const features = data.elements.map((el: any) => ({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: el.geometry.map((g: any) => [g.lon, g.lat])
              },
              properties: el.tags
            }));
            
            const trips = processRoadsToTrips(features);
            setRoadsData(trips);
            setIsTrafficLoading(false);
            return; // Success!
          }
        } catch (error) {
          console.warn(`Failed to fetch roads from ${url}:`, error);
        }
      }
      
      console.error("All Overpass API mirrors failed.");
      setIsTrafficLoading(false);
    };

    fetchRoads();
  }, []); // Only fetch once on mount for now to avoid heavy API calls
  const [mapCoords, setMapCoords] = useState({ lat: 55.7558, lon: 37.6173 });
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<ProjectModel | null>(null);

  const lightingEffect = useMemo(() => {
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 0.6
    });

    const sunLight = new DirectionalLight({
      color: [255, 255, 255],
      intensity: 2.8,
      direction: [0, -70, 100]
    });

    return new LightingEffect({ ambientLight, sunLight });
  }, []);

  const deckEffects = useMemo(() => [lightingEffect], [lightingEffect]);

  // Global interaction listener
  useEffect(() => {
    const handleGlobalInteraction = () => {
      setLastInteraction(Date.now());
      setIsAutoRotating(false);
    };
    window.addEventListener('mousedown', handleGlobalInteraction);
    window.addEventListener('wheel', handleGlobalInteraction, { passive: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { passive: true });
    window.addEventListener('keydown', handleGlobalInteraction);
    return () => {
      window.removeEventListener('mousedown', handleGlobalInteraction);
      window.removeEventListener('wheel', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
      window.removeEventListener('keydown', handleGlobalInteraction);
    };
  }, []);

  // Initialize Three.js Project Layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    
    const projectLayer = new ThreeProjectLayer(strategicProjects, (project) => {
      setHoveredProject(project);
    });

    const addLayer = () => {
      if (!map.getLayer(projectLayer.id)) {
        map.addLayer(projectLayer);
      }
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('idle', addLayer);
    }

    return () => {
      if (map.getLayer(projectLayer.id)) {
        map.removeLayer(projectLayer.id);
      }
    };
  }, []);

  // Auto-rotation timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastInteraction > 10000 && !isAutoRotating) {
        setIsAutoRotating(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastInteraction, isAutoRotating]);

  // Rotation animation
  useEffect(() => {
    if (!isAutoRotating) return;
    
    let animationFrame: number;
    const rotate = () => {
      setViewState(prev => ({
        ...prev,
        bearing: (prev.bearing + 0.05) % 360
      }));
      animationFrame = requestAnimationFrame(rotate);
    };
    
    animationFrame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isAutoRotating]);

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
        soundService.playSonar();
      } catch (err) {
        console.error("Failed to fetch buildings:", err);
      }
    };

    if (isAuthReady) {
      fetchBuildings();
    }
  }, [user, isAuthReady]);

  // Fetch Assets from SQLite API
  useEffect(() => {
    if (!isAuthReady) return;

    const fetchAssets = async () => {
      try {
        const res = await fetch('/api/assets');
        if (!res.ok) throw new Error("Failed to fetch assets");
        const data = await res.json();
        setUserAssets(data);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      }
    };

    fetchAssets();
    const interval = setInterval(fetchAssets, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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
    const userFeatures = userAssets.map(asset => {
      // Create a small square polygon around the point for 3D extrusion
      const size = 0.00015; // roughly 15-20 meters
      const coords = [
        [asset.longitude - size, asset.latitude - size],
        [asset.longitude + size, asset.latitude - size],
        [asset.longitude + size, asset.latitude + size],
        [asset.longitude - size, asset.latitude + size],
        [asset.longitude - size, asset.latitude - size]
      ];

      return {
        type: 'Feature',
        id: asset.id,
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        },
        properties: {
          id: asset.id,
          title: asset.title,
          height: 20, // Default height for user assets
          model: asset.model,
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
      };
    });

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

  // Pulse timer for tactical animations - Removed for high-performance GPU-only animation
  // If you need pulse in React state, consider slowing it down (e.g. 500ms)
  useEffect(() => {
    // No-op: handled in shaders via project_uTime
  }, []);

  const [investorCabinetOpen, setInvestorCabinetOpen] = useState(false);

  const portfolioDetailed = useMemo(() => {
    if (!buildingsData || !portfolio) return [];
    return portfolio.map(id => {
      const building = buildingsData.features.find((f: any) => f.properties.id === id);
      if (building) {
        return { 
          ...building.properties, 
          id: building.properties.id,
          latitude: building.geometry.coordinates[1], 
          longitude: building.geometry.coordinates[0],
          address: building.properties.address || 'Strategic Location',
          yield: building.properties.yield || (building.properties.cost * 0.01),
          roi: building.properties.roi || 12.5,
          status: building.properties.status || 1
        };
      }
      return null;
    }).filter(Boolean);
  }, [buildingsData, portfolio]);
  const [performanceHistory, setPerformanceHistory] = useState<{time: string, value: number}[]>([]);

  // Game State
  const [totalYield, setTotalYield] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);

  // Track performance history
  useEffect(() => {
    if (performanceHistory.length === 0) {
      // Initialize with mock historical data for better visualization
      const now = Date.now();
      const mockData = Array.from({ length: 15 }, (_, i) => {
        const time = new Date(now - (15 - i) * 60000); // 1 minute intervals
        const variance = (Math.random() - 0.5) * 500000;
        return {
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: (balance + portfolioValue) * (0.95 + (i * 0.003)) + variance
        };
      });
      setPerformanceHistory(mockData);
    }
    
    const interval = setInterval(() => {
      setPerformanceHistory(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: balance + portfolioValue }];
        if (newData.length > 30) return newData.slice(1);
        return newData;
      });
    }, 15000);
    
    return () => clearInterval(interval);
  }, [balance, portfolioValue]);

  // Mutual exclusivity for mobile panels
  useEffect(() => {
    if (window.innerWidth < 640) {
      if (chatOpen) setLegendOpen(false);
    }
  }, [chatOpen]);

  useEffect(() => {
    if (window.innerWidth < 640) {
      if (legendOpen) setChatOpen(false);
    }
  }, [legendOpen]);

  useEffect(() => {
    if (window.innerWidth < 640) {
      if (dashboardOpen) {
        setChatOpen(false);
        setLegendOpen(false);
      }
    }
  }, [dashboardOpen]);

  // Apply theme to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorScheme);
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-ui-style', uiStyle);
  }, [colorScheme, mode, uiStyle]);

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
    
    setLastInteraction(Date.now());
    setIsAutoRotating(false);
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

    setLastInteraction(Date.now());
    setIsAutoRotating(false);

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
    model: 'house',
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
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataOnlyMode, setDataOnlyMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalStatus, setTerminalStatus] = useState<'idle' | 'handshake' | 'granted'>('idle');

  const handleAIAnalysis = async (building: BuildingInfo) => {
    if (!building) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    
    try {
      const prompt = `Analyze the investment potential of the following building:
      Title: ${building.properties.title || 'Unknown'}
      Type: ${building.properties.type || 'Unknown'}
      Market Value: $${(building.properties as any).cost?.toLocaleString() || 'N/A'}
      Monthly Yield: $${(building.properties as any).yield?.toLocaleString() || 'N/A'}
      ROI: ${building.properties.roi !== undefined ? building.properties.roi + '%' : 'N/A'}
      Description: ${building.properties.description || 'No description available.'}
      
      Please provide a highly professional and tactical strategic briefing including:
      1. **Market Value Assessment**: Evaluation of the current valuation in the context of sectoral trends.
      2. **Yield Potential**: Analysis of the monthly income stream and its stability.
      3. **Strategic ROI Evaluation**: A deep dive into the return on investment relative to risk profiles.
      4. **Tactical Recommendation**: A definitive action (ACQUIRE, HOLD, or LIQUIDATE) with a justification.
      
      Use a "Command & Control" tone, concise and data-driven. Use markdown for high-quality formatting including bold headers and bullet points.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setAiAnalysis(response.text || "No analysis generated.");
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setAiAnalysis("Failed to perform AI analysis. Strategic link severed. Please re-initialize.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async (building: BuildingInfo) => {
    if (!building) return;
    setIsGeneratingReport(true);
    setReportModalOpen(true);
    
    try {
      // Simulate/Gather detailed report data
      const prompt = `Generate a detailed SWOT analysis for a strategic investment report on this property:
      Title: ${building.properties.title || 'Strategic Asset'}
      Type: ${building.properties.type || 'Commercial'}
      Address: ${building.properties.address || 'Classified'}
      Specs: ${building.properties.sqft?.toLocaleString() || 'N/A'} sqft, Year Built: ${building.properties.yearBuilt || 'N/A'}
      
      Format as a JSON object with:
      - advantages: string[] (top 5 strengths/opportunities)
      - risks: string[] (top 3 threats/weaknesses)
      - market_context: string (one paragraph about the surroundings)
      
      Do not include markdown code blocks, just the raw JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
              market_context: { type: Type.STRING }
            },
            required: ["advantages", "risks", "market_context"]
          }
        }
      });

      let swot;
      try {
        swot = JSON.parse(response.text || '{}');
      } catch (e) {
        swot = { 
          advantages: ["High-precision geolocation tracking", "Secure tactical grid connectivity", "Authorized ROI potential"],
          risks: ["Market volatility in anomalous sectors", "Geopolitical risk factors"],
          market_context: "The asset is situated within a high-value strategic corridor with elevated demand for secure operational bases."
        };
      }

      setReportData({
        building: building.properties,
        id: building.id,
        swot,
        timestamp: new Date().toISOString(),
        traffic: {
          pedestrian: Math.floor(Math.random() * 2000) + 500,
          vehicle: Math.floor(Math.random() * 5000) + 1000
        },
        competitors: [
          { name: "Alpha Sector Holdings", distance: "240m", status: "Active" },
          { name: "Vanguard Realty", distance: "450m", status: "Neutral" },
          { name: "Apex Logistics", distance: "1.2km", status: "Dormant" }
        ],
        catchment: {
          fiveMin: Math.floor(Math.random() * 5000) + 2000,
          tenMin: Math.floor(Math.random() * 15000) + 8000
        }
      });
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tacticalMenuOpen, setTacticalMenuOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<{ type: string, model: string, reason: string } | null>(null);
  
  const [selectedHex, setSelectedHex] = useState<any | null>(null);
  const [hexAnalysis, setHexAnalysis] = useState<string | null>(null);
  const [isHexAnalyzing, setIsHexAnalyzing] = useState(false);
  const [analyzedHexes, setAnalyzedHexes] = useState<any[]>([]);

  const handleAnalyzeHex = async (hexData: any) => {
    if (!hexData) return;
    setIsHexAnalyzing(true);
    setHexAnalysis(null);
    soundService.playSonar();
    
    try {
      const coords = h3.cellToLatLng(hexData.hex);
      const prompt = `Perform a tactical district analysis for Sector ${hexData.hex}.
      Coordinates: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}
      Occupancy/Density: ${hexData.occupancy}%
      Strategic Value: ${hexData.value}
      
      Identify the "Necessary Tenant" (missing business type or high-demand service) for this specific hexagonal cell. 
      Consider urban logistics, residential needs, and retail saturation.
      Output format: 
      ### 🎯 NECESSARY TENANT: [Tenant Type]
      **Strategic Justification:** [BRIEF explanation]
      **Projected Impact:** [High/Medium/Low]
      **Tactical Priority:** [1-10]`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const result = response.text || "Unable to decrypt district patterns.";
      setHexAnalysis(result);

      // Save to analyzed hexes if it doesn't already exist or update it
      setAnalyzedHexes(prev => {
        const existing = prev.findIndex(h => h.hex === hexData.hex);
        const entry = { ...hexData, analysis: result, timestamp: new Date().toISOString() };
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = entry;
          return updated;
        }
        return [entry, ...prev];
      });
    } catch (error) {
      console.error("Hex Analysis Error:", error);
      setHexAnalysis("Tactical link severed. Intelligence unavailable.");
    } finally {
      setIsHexAnalyzing(false);
    }
  };

  const handleSuggestAssetType = async () => {
    if (!newAsset.address || newAsset.cost <= 0) {
      setCreateError("Address and Cost required for AI analysis.");
      return;
    }
    
    setIsSuggesting(true);
    setSuggestion(null);
    setCreateError(null);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Given an asset at "${newAsset.address}" costing $${newAsset.cost}, determine the optimal 'Type' and 'Visual Model'.
        Allowed Types: retail, office, warehouse, residential.
        Allowed Models: house, apartment, warehouse, office.
        Output JSON with keys: "type", "model", "reason" (brief justification).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              model: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["type", "model", "reason"]
          }
        }
      });
      
      const res = JSON.parse(response.text || '{}');
      setSuggestion(res);
      soundService.playSonar();
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      setCreateError("AI node unavailable. Manual entry required.");
    } finally {
      setIsSuggesting(false);
    }
  };

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
        ownerUid: user.uid
      };
      
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create asset");
      }
      
      const data = await res.json();
      setUserAssets(prev => [data.asset, ...prev]);
      setBalance(data.balance);
      
      // Success notification
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] apple-glass px-6 py-3 rounded-2xl border border-primary/30 text-primary font-bold text-xs uppercase tracking-widest shadow-2xl animate-bounce';
      notification.innerText = 'Strategic Asset Deployed Successfully';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

      setCreateModalOpen(false);
      setNewAsset({
        title: '',
        type: 'retail',
        model: 'house',
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
      console.error("Asset creation error:", error);
      setCreateError(error instanceof Error ? error.message : "Failed to create asset. Check your connection.");
    } finally {
      setIsCreating(false);
    }
  };

  const basemaps = useMemo(() => [
    { 
      id: 'dark', 
      name: t.basemapTerminal, 
      url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      icon: <Terminal className="w-3.5 h-3.5" />
    },
    { 
      id: 'light', 
      name: t.basemapStandard, 
      url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      icon: <MapIcon className="w-3.5 h-3.5" />
    },
    { 
      id: 'satellite', 
      name: t.basemapSatellite, 
      url: {
        version: 8,
        sources: {
          "raster-tiles": {
            "type": "raster",
            "tiles": ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            "tileSize": 256,
            "attribution": "Esri"
          }
        },
        layers: [
          {
            "id": "satellite-base",
            "type": "raster",
            "source": "raster-tiles",
            "minzoom": 0,
            "maxzoom": 22
          }
        ]
      },
      icon: <Satellite className="w-3.5 h-3.5" />
    },
  ], [t]);

  // Gemini Initialization
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  // Rule 1: "Quiet" Frontend - Layers
  const staticLayers = useMemo(() => [
    showGrid ? new PathLayer({
      id: 'tactical-grid-map',
      data: gridLines,
      getPath: (d: any) => d.path,
      getColor: [255, 255, 255, gridBrightness * 150],
      getWidth: 1,
      widthUnits: 'pixels',
      updateTriggers: {
        getColor: [gridBrightness]
      }
    } as any) : null,
    showHexGrid ? new H3HexagonLayer({
      id: 'tactical-hex-grid',
      data: hexDistricts,
      getHexagon: (d: any) => d.hex,
      getFillColor: (d: any) => {
        // Aesthetic: Dark Emerald for secure, Amber for active
        if (d.occupancy > 80) return [255, 100, 0, 100]; // Amber/Alert
        if (d.occupancy > 50) return [0, 255, 150, 60]; // Normal/Active
        return [0, 150, 255, 40]; // Low activity/Quiet
      },
      getLineColor: [255, 255, 255, 30],
      lineWidthMinPixels: 1,
      filled: true,
      stroked: true,
      pickable: true,
      extruded: false, // Keep it flat for "District Overview"
      onHover: (info: any) => {
        if (info.object) {
          setHoverInfo({
            id: info.object.name,
            properties: info.object,
            x: info.x,
            y: info.y
          });
        } else {
          setHoverInfo(null);
        }
      },
      onClick: (info: any) => {
        if (info.object) {
          setSelectedHex(info.object);
          handleAnalyzeHex(info.object);
          setLastInteraction(Date.now());
          setIsAutoRotating(false);
        }
      },
      updateTriggers: {
        getFillColor: [pulse] // Could animate if needed
      }
    }) : null,
    createRiskRadarLayer(viewState.zoom, showRiskRadar, (info) => setHoverInfo(info)),
    createStrategicNodesLayer(viewState.zoom, showRiskRadar, (info) => setHoverInfo(info)),
    createInfrastructureTwinLayer(viewState.zoom, showInfraPower, 'power'),
    createInfrastructureTwinLayer(viewState.zoom, showInfraComm, 'comm'),
    createFutureProjectsLayer(viewState.zoom, showFutureProjects, simulationYear, (info) => setHoverInfo(info)),
    showBuildings && filteredBuildings ? createBuildingsLayer(
      filteredBuildings,
      (info) => {
        if (info?.id && info.id !== hoverInfo?.id) {
          soundService.playClick();
        }
        setHoverInfo(info);
      },
      (info) => {
        setSelectedBuilding(info);
        setLastInteraction(Date.now());
        setIsAutoRotating(false);
      },
      pulse,
      selectedBuilding?.id || null,
      hoverInfo?.id || null,
      viewState.zoom,
      buildingScanlineIntensity,
      dataOnlyMode,
      investorCabinetOpen,
      portfolio,
      simulationYear,
      simulationParams
    ) : null,
    showTraffic && roadsData.length > 0 ? createTrafficLayer(
      roadsData,
      0, // Time handled in overlay component
      showTraffic
    ) : null
  ].filter(Boolean), [showBuildings, filteredBuildings, pulse, selectedBuilding, hoverInfo, viewState.zoom, buildingScanlineIntensity, dataOnlyMode, investorCabinetOpen, portfolio, showTraffic, roadsData, showHexGrid, hexDistricts, showRiskRadar, showInfraPower, showInfraComm, showFutureProjects, simulationYear, simulationParams]);

  const handleCreateSyndicate = (building: BuildingInfo) => {
    if (!user) {
      handleLogin();
      return;
    }
    
    // Check if building already in a syndicate
    if (syndicates.some(s => s.buildingId === building.id)) {
      alert("Syndicate already exists for this asset.");
      return;
    }

    const newSyndicate: Syndicate = {
      id: `SYND-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      buildingId: building.id,
      buildingName: building.properties.title || `Asset #${building.id}`,
      targetAmount: building.properties.cost || 75000000,
      raisedAmount: 0,
      participants: [{ uid: user.uid, name: user.displayName || 'Lead Investor', amount: 0, role: 'Lead Broker' }],
      status: 'OPEN',
      adminFeeRate: 0.02,
      legalFeeRate: 0.015,
      createdAt: new Date().toISOString()
    };
    
    setSyndicates(prev => [...prev, newSyndicate]);
    setActiveSyndicateId(newSyndicate.id);
    setSyndicateRoomOpen(true);
    soundService.playClick();
  };

  const handleContributeToSyndicate = (syndicateId: string, amount: number) => {
    if (!user || balance < amount) {
      soundService.playDenied();
      return;
    }

    setSyndicates(prev => prev.map(s => {
      if (s.id === syndicateId) {
        const existingParticipant = s.participants.find(p => p.uid === user.uid);
        let newParticipants = [...s.participants];
        if (existingParticipant) {
          newParticipants = newParticipants.map(p => p.uid === user.uid ? { ...p, amount: p.amount + amount } : p);
        } else {
          newParticipants.push({ uid: user.uid, name: user.displayName || 'Bank Delegate', amount: amount, role: 'Syndicate Member' });
        }
        
        const newRaised = s.raisedAmount + amount;
        const newStatus = newRaised >= s.targetAmount ? 'FUNDED' : 'OPEN';
        
        return { ...s, raisedAmount: newRaised, participants: newParticipants, status: newStatus as any };
      }
      return s;
    }));
    
    setBalance(prev => prev - amount);
    soundService.playClick();
  };

  const handleListOnMarket = (asset: any) => {
    if (!user) return;
    
    // Check if already on market
    if (marketOrders.some(o => o.assetId === asset.id && o.status === 'OPEN')) {
      alert("Asset already listed on secondary market.");
      return;
    }

    const newOrder: SecondaryMarketOrder = {
      id: `EXCH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      assetId: asset.id,
      assetName: asset.title || asset.properties?.title || `Asset #${asset.id}`,
      sellerUid: user.uid,
      sellerName: user.displayName || 'Strategic Seller',
      price: (asset.cost || asset.properties?.cost || 0) * 0.95, // Default 5% discount for exit liquidity
      yieldPerCycle: asset.yield || asset.properties?.yield || 0,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };

    setMarketOrders(prev => [newOrder, ...prev]);
    soundService.playClick();
    alert("Asset listed on Secondary Market. Awaiting counterparty matching.");
  };

  const handleBuyFromMarket = async (order: SecondaryMarketOrder) => {
    if (!user || balance < order.price) {
      soundService.playDenied();
      return;
    }

    // 1. Update Order Status
    setMarketOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'SOLD' } : o));

    // 2. Transfer Ownership (Remove from seller portfolio, add to buyer)
    // Note: In this simulation, we'll just update the current user's portfolio and balance.
    // If we had the seller's state accessible globally we'd update them too.
    
    const newBalance = balance - order.price;
    const newPortfolio = [...portfolio, order.assetId];
    
    setBalance(newBalance);
    setPortfolio(newPortfolio);
    setTotalYield(prev => prev + order.yieldPerCycle);
    setPortfolioValue(prev => prev + order.price);

    // Sync to SQLite
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

    soundService.playClick();
    alert(`Strategic Transfer Complete: ${order.assetName} integrated into portfolio.`);
  };

  const handleBuyBuilding = async (id: number | string, cost: number, yieldAmount: number) => {
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

  if (!isAccessGranted) {
    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center font-mono p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-lg space-y-8"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] text-primary/40 tracking-[0.3em]">
              <span>[ YARDSOFT AEGIS v2.4.1 ]</span>
              <span>SECURE_UPLINK_774</span>
            </div>
            
            <div className="space-y-2 text-primary text-sm font-bold tracking-tighter">
              <div className="flex items-center gap-2">
                <span className="opacity-50">{">"}</span>
                <span>ESTABLISHING SECURE HANDSHAKE...</span>
              </div>
              
              {terminalStatus !== 'idle' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <span className="opacity-50">{">"}</span>
                  <span>CHALLENGE: 9X7A-2Q1L</span>
                </motion.div>
              )}

              {terminalStatus === 'handshake' && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="opacity-50">{">"}</span>
                    <span>RESPONSE: **************</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 text-secondary"
                  >
                    <span className="opacity-50">{">"}</span>
                    <span>BIOMETRIC SIGNATURE: VERIFIED</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex items-center gap-2 text-emerald-400"
                  >
                    <span className="opacity-50">{">"}</span>
                    <span>ACCESS GRANTED. LOADING GEOSPATIAL OVERLAY.</span>
                  </motion.div>
                </>
              )}

              {terminalStatus === 'idle' && (
                <div className="flex items-center gap-2">
                  <span className="opacity-50">{">"}</span>
                  <span>ENTER CLEARANCE CODE:</span>
                  <motion.div 
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="w-2 h-4 bg-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {terminalStatus === 'idle' && (
            <div className="relative">
              <input 
                autoFocus
                type="password"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTerminalStatus('handshake');
                    soundService.playSonar();
                    setTimeout(() => {
                      setIsAccessGranted(true);
                      setTerminalStatus('granted');
                    }, 3000);
                  }
                }}
                placeholder="YARD-XXXX-ALPHA"
                className="w-full bg-transparent border-b border-primary/30 outline-none text-primary text-2xl tracking-[0.5em] py-2 focus:border-primary transition-colors placeholder:text-primary/10"
              />
              <div className="absolute -bottom-6 left-0 flex gap-4 text-[8px] text-primary/30 uppercase tracking-widest">
                <span>Keystroke Dynamics: Active</span>
                <span>Mouse Path: Tracking</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 text-[9px] text-slate-800 uppercase tracking-widest pt-8 border-t border-white/5">
            <p>Connection: AES-256-GCM</p>
            <p>Geo-IP Lock: Verified (London/UK)</p>
            <p>Behavioral Pattern: 98.4% Match</p>
          </div>
        </motion.div>

        {/* Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10 opacity-50" />
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="relative w-full h-screen bg-base overflow-hidden font-sans text-slate-200">
      
      {/* Cinematic Overlays */}
      <FloatingParticles />
      {uiStyle === 'tactical' && (
        <>
          <div className="cinematic-overlay" />
          <div className="cinematic-vignette" />
          <div className="crt-flicker" />
          <div className="screen-scan-overlay" style={{ opacity: scanlineIntensity }} />
          {showGrid && <div className="tactical-grid" />}
          {showGrid && <TacticalHUD lat={viewState.latitude} lon={viewState.longitude} />}
        </>
      )}

      {/* Tactical Alert Banner */}
      {uiStyle === 'tactical' && (
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
      )}

      {/* Tactical Compass (Image 1 Inspiration) */}
      {uiStyle === 'tactical' && (
        <div className="absolute top-24 right-20 z-40 pointer-events-none hidden lg:block">
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


      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20" />
      </div>

      {/* Search Bar */}
      <div className="absolute top-24 left-4 sm:left-6 md:left-8 z-40 w-[calc(100%-2rem)] sm:w-80 md:w-96 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="apple-glass rounded-xl flex items-center px-4 py-2.5 sm:py-3 group focus-within:ring-1 ring-primary/30 transition-all bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl">
            <div className="relative flex items-center justify-center">
              <Search className={cn("w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors", isSearching && "opacity-0")} />
              {isSearching && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
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
              className="flex-1 bg-transparent border-none outline-none px-3 text-[10px] sm:text-xs font-display tracking-[0.15em] text-slate-200 placeholder:text-slate-700 uppercase"
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
                  "p-1 rounded-lg transition-colors flex items-center gap-1.5 relative",
                  filtersOpen ? "bg-primary/20 text-primary" : "glass-hover text-slate-500"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {(filters.statuses.length < 3 || filters.minRoi > 0 || filters.owner) && !filtersOpen && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-slate-900 animate-pulse" />
                )}
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
                        { id: 'stable', label: t.stable_status, color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
                        { id: 'risk', label: t.risk, color: 'text-red-400', icon: AlertTriangle, bg: 'bg-red-400/10', border: 'border-red-400/30' },
                        { id: 'anomalous', label: t.anomalous, color: 'text-slate-400', icon: Radio, bg: 'bg-slate-400/10', border: 'border-slate-400/30' }
                      ].map(status => {
                        const Icon = status.icon;
                        const isActive = filters.statuses.includes(status.id);
                        return (
                          <button
                            key={status.id}
                            onClick={() => toggleStatusFilter(status.id)}
                            className={cn(
                              "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all text-left group",
                              isActive 
                                ? `${status.bg} ${status.border} shadow-[0_0_15px_rgba(var(--primary-accent),0.05)]` 
                                : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                isActive ? status.bg : "bg-white/5"
                              )}>
                                <Icon className={cn("w-4 h-4", isActive ? status.color : "text-slate-600")} />
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest transition-colors",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                              )}>
                                {status.label}
                              </span>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                              isActive ? `${status.border} bg-white/5` : "border-white/10"
                            )}>
                              {isActive && <div className={cn("w-2 h-2 rounded-full", status.bg.replace('/10', ''))} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.minRoi} (%)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range"
                        min="0"
                        max="30"
                        value={isNaN(filters.minRoi) ? 0 : filters.minRoi}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFilters(prev => ({ ...prev, minRoi: isNaN(val) ? 0 : val }));
                        }}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-mono text-primary w-8">{isNaN(filters.minRoi) ? 0 : filters.minRoi}%</span>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Rule 1: High Performance Map */}
      <div className="relative w-full h-full z-0 overflow-hidden">
        {/* Digital Map Atmosphere */}
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
           <div className="digital-map-overlay opacity-30" />
           <div className="map-scanline opacity-20" />
        </div>
        
        {/* HUD Overlay */}
        <DigitalMapHUD coords={mapCoords} />

        <Map
          ref={mapRef}
          {...viewState}
          onMove={e => {
            if (isNaN(e.viewState.latitude) || isNaN(e.viewState.longitude)) return;
            setViewState(e.viewState);
            setMapCoords({ lat: e.viewState.latitude, lon: e.viewState.longitude });
            
            // Stop auto-rotation on user interaction
            if (isAutoRotating) {
              setIsAutoRotating(false);
              setLastInteraction(Date.now());
            }
          }}
          onMouseDown={() => {
            if (isAutoRotating) {
              setIsAutoRotating(false);
              setLastInteraction(Date.now());
            }
          }}
          onTouchStart={() => {
            if (isAutoRotating) {
              setIsAutoRotating(false);
              setLastInteraction(Date.now());
            }
          }}
          mapStyle={dataOnlyMode ? 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json' : basemap}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          maxPitch={85}
          terrain={typeof basemap === 'object' && basemap.terrain ? basemap.terrain : undefined}
          projection={typeof basemap === 'object' ? 'globe' : 'mercator'}
          reuseMaps
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-left" />
          
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
                  
                  {/* ID Highlight Badge */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 apple-glass px-2 py-1 rounded border border-primary/30 pulsate-glow whitespace-nowrap">
                    <span className="text-[8px] font-mono font-bold text-primary tracking-widest uppercase">ID: {selectedBuilding.id}</span>
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
                0, mode === 'dark' ? '#1e293b' : '#f1f5f9',
                50, mode === 'dark' ? '#334155' : '#e2e8f0',
                200, mode === 'dark' ? '#475569' : '#cbd5e1'
              ],
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': mode === 'dark' ? 0.85 : 0.7,
              'fill-extrusion-vertical-gradient': true
            }}
          />
          {staticLayers.length > 0 && <DeckGLOverlay layers={staticLayers} effects={deckEffects} showTraffic={showTraffic} />}
        </Map>

        {isAutoRotating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="apple-glass px-4 py-1.5 rounded-full border border-primary/30 flex items-center gap-2 shadow-2xl">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-display font-bold text-primary uppercase tracking-[0.2em]">
                {language === 'en' ? 'Auto-Orbit Active' : 'Автооблет активен'}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[50]">
        
        {/* Project Info Panel (Three.js Interaction) */}
        <AnimatePresence>
          {hoveredProject && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="absolute top-32 right-6 w-80 apple-glass rounded-2xl border border-primary/40 shadow-2xl p-5 pointer-events-auto z-50 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-[10px] font-display font-bold text-primary uppercase tracking-[0.2em]">Strategic Asset</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{hoveredProject.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Radar className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Entry Cost</span>
                    <span className="text-sm font-mono font-bold text-white">{hoveredProject.details.cost}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Project ROI</span>
                    <span className="text-sm font-mono font-bold text-secondary">{hoveredProject.details.roi}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Current Status</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold uppercase border border-primary/30">
                      {hoveredProject.details.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    "{hoveredProject.details.description}"
                  </p>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-primary text-base font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary-accent),0.3)]">
                  Access Detailed Briefing
                </button>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

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
        <header className="absolute top-0 left-0 w-full flex justify-center pointer-events-none h-20 sm:h-24 pt-4 sm:pt-6 px-4 sm:px-6 z-[60]">
          <div className="w-full max-w-screen-2xl flex items-center justify-between gap-4 pointer-events-none">
            <div className="flex items-center gap-3 min-w-0 pointer-events-auto">
            <button 
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={cn(
                "w-9 h-9 apple-glass rounded-xl flex-shrink-0 flex items-center justify-center border border-white/10 text-slate-400 hover:text-white transition-all shadow-xl",
                dashboardOpen && "hidden sm:flex"
              )}
            >
              {dashboardOpen ? <ChevronUp className="-rotate-90 w-4 h-4" /> : <ChevronUp className="rotate-90 w-4 h-4" />}
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 text-white truncate">
                <div className="hidden xs:flex w-7 h-7 bg-primary rounded-lg items-center justify-center shadow-[0_0_15px_rgba(var(--primary-accent),0.5)] border border-white/20 flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="homm-heading text-lg sm:text-xl truncate leading-tight">{t.title}</span>
              </h1>
              <p className="text-[7px] text-slate-500 uppercase tracking-[0.2em] font-mono truncate hidden xs:block leading-none mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 pointer-events-auto">
            {/* Unified Tactical Control Bar */}
            <div className="flex items-center apple-glass rounded-full border border-white/10 p-1 shadow-2xl transition-all duration-300">
              {/* Cabinet Quick-Access */}
              <button 
                onClick={() => setInvestorCabinetOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all group"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[9px] font-mono font-bold uppercase tracking-widest">ST_Cabinet</span>
              </button>

              {/* Financial Status (Treasury) */}
              <div className="hidden md:flex items-center gap-3 px-4 py-1.5 border-l border-white/10 ml-1">
                <Wallet className="w-3.5 h-3.5 text-secondary" />
                <div className="flex flex-col leading-none">
                  <span className="text-[7px] text-slate-500 uppercase font-bold tracking-[0.2em] leading-none mb-0.5">Treasury</span>
                  <span className="text-xs font-mono font-bold text-secondary">
                    ${balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* System Actions Area */}
              <div className="flex items-center gap-0.5 border-l border-white/10 ml-1 pl-1">
                <button 
                  onClick={handleExportCSV}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                  title="Export Data"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-white/10 mx-0.5" />

                <button 
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    settingsOpen ? "bg-primary/20 text-primary" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                  title="System Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all relative",
                    profileOpen ? "bg-primary/20 text-primary" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                  title="User Profile"
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/98 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 flex flex-col cursor-default font-sans"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header: Apple/Google Style */}
                      <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4 text-left">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                  <User className="w-7 h-7 text-white" />
                                ) }
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                            </div>
                            <div>
                              <h3 className="text-base font-display font-bold text-white tracking-tight">{user.displayName || user.email?.split('@')[0]}</h3>
                              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{user.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setProfileOpen(false)}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                        
                        {/* Role Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 w-fit">
                          <Shield className={cn("w-3 h-3", userRole === 'admin' ? "text-primary" : "text-secondary")} />
                          <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-300">
                            {userRole === 'admin' ? 'System Administrator' : userRole === 'investor' ? 'Authorized Investor' : 'Public Access'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto max-h-[60vh] scrollbar-hide text-left">
                        {/* Financial Overview - Investor Focus */}
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                              <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Available Capital</p>
                              <p className="text-lg font-display font-bold text-white">${balance.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                              <p className="text-[8px] uppercase font-bold text-slate-500 tracking-widest">Portfolio Value</p>
                              <p className="text-lg font-display font-bold text-secondary">${portfolioValue.toLocaleString()}</p>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Performance Metrics</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                  <span className="text-xs text-slate-300">Annual Yield</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-green-500">+${totalYield.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                  <Building2 className="w-4 h-4 text-primary" />
                                  <span className="text-xs text-slate-300">Assets Owned</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-white">{portfolio.length} Units</span>
                              </div>
                            </div>
                          </div>

                          {/* Admin Specific Controls */}
                          {userRole === 'admin' && (
                            <div className="space-y-3">
                              <h4 className="text-[10px] uppercase font-bold text-primary/70 tracking-widest px-1">Admin Console</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group text-center w-full">
                                  <Activity className="w-5 h-5 text-primary" />
                                  <span className="text-[8px] font-bold uppercase tracking-widest">System_Logs</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group text-center w-full">
                                  <Database className="w-5 h-5 text-primary" />
                                  <span className="text-[8px] font-bold uppercase tracking-widest">Data_Sync</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Quick Actions</h4>
                            <div className="grid grid-cols-1 gap-1">
                              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-xs text-slate-300 group">
                                <div className="flex items-center gap-3">
                                  <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                  <span>Security Overview</span>
                                </div>
                                <ChevronDown className="w-3 h-3 -rotate-90 text-slate-600" />
                              </button>
                              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-xs text-slate-300 group">
                                <div className="flex items-center gap-3">
                                  <Key className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                  <span>Access Credentials</span>
                                </div>
                                <ChevronDown className="w-3 h-3 -rotate-90 text-slate-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-4 bg-black/40 border-t border-white/5 mt-auto">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all text-xs font-bold text-red-400 uppercase tracking-widest"
                        >
                          <LogOut className="w-4 h-4" />
                          Terminate Session
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-16 sm:top-20 w-72 apple-glass rounded-xl shadow-2xl p-5 z-50 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em]">{t.settings}</h3>
                    <button onClick={() => setSettingsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1 flex items-center gap-2">
                        <LayoutDashboard className="w-3 h-3" />
                        {t.uiStyle}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setUiStyle('tactical');
                            setBasemap('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json');
                          }}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            uiStyle === 'tactical' 
                              ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.1)]" 
                              : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          <Zap className="w-4 h-4" />
                          {t.tactical}
                        </button>
                        <button
                          onClick={() => {
                            setUiStyle('professional');
                            setBasemap('https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json');
                          }}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            uiStyle === 'professional' 
                              ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.1)]" 
                              : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          <Command className="w-4 h-4" />
                          {t.professional}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1 flex items-center gap-2">
                        <Palette className="w-3 h-3" />
                        {t.theme}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {themes.map(th => {
                          const themeColors: Record<string, string> = {
                            tactical: 'bg-white',
                            cyber: 'bg-[#ff00ff]',
                            royal: 'bg-[#fbbf24]',
                            arctic: 'bg-[#38bdf8]',
                            desert: 'bg-[#f59e0b]',
                            professional: 'bg-[#2563eb]'
                          };
                          const themeLabel = (t as any)[`theme${th.charAt(0).toUpperCase() + th.slice(1)}`] || th;
                          
                          return (
                            <button
                              key={th}
                              onClick={() => setColorScheme(th)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all group relative overflow-hidden",
                                colorScheme === th 
                                  ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.1)]" 
                                  : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10 hover:bg-slate-950/60"
                              )}
                            >
                              <div className={cn("w-3 h-3 rounded-full shadow-sm shrink-0", themeColors[th])} />
                              <span className="truncate">{themeLabel}</span>
                              {colorScheme === th && (
                                <motion.div 
                                  layoutId="activeTheme"
                                  className="absolute inset-0 border-2 border-primary/20 pointer-events-none rounded-xl"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1 flex items-center gap-2">
                        {mode === 'dark' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                        {t.mode}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMode('light')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            mode === 'light' 
                              ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.1)]" 
                              : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          <Sun className="w-3 h-3" />
                          {t.light}
                        </button>
                        <button
                          onClick={() => setMode('dark')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            mode === 'dark' 
                              ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.1)]" 
                              : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          <Moon className="w-3 h-3" />
                          {t.dark}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1 flex items-center gap-2">
                        <Radio className="w-3 h-3" />
                        {t.language}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLanguage('en')}
                          className={cn(
                            "flex-1 p-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            language === 'en' 
                              ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.1)]" 
                              : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setLanguage('ru')}
                          className={cn(
                            "flex-1 p-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            language === 'ru' 
                              ? "bg-primary/10 border-primary/50 text-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.1)]" 
                              : "bg-slate-950/40 border-white/5 text-slate-500 hover:border-white/10"
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

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Radio className="w-3 h-3 text-slate-500" />
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Tactical Audio</label>
                        </div>
                        <button 
                          onClick={() => setIsMuted(!isMuted)}
                          className={cn(
                            "px-3 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest border transition-all",
                            !isMuted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                          )}
                        >
                          {!isMuted ? 'ACTIVE' : 'MUTED'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.gridBrightness}</label>
                        </div>
                        <span className="text-[10px] font-mono text-primary">{(gridBrightness * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={gridBrightness} 
                        onChange={(e) => setGridBrightness(parseFloat(e.target.value))}
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

      {/* Operations Command Hub (Consolidated) */}
      <div className="absolute left-4 sm:left-6 top-[30%] translate-y-0 flex flex-col gap-3 pointer-events-auto z-[70]">
        
        {/* Hub Control Toggle */}
        <div className="relative group">
          <button 
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              if (!sidebarOpen) setTacticalMenuOpen(false);
            }}
            className={cn(
              "apple-glass rounded-lg w-[30px] h-[30px] flex items-center justify-center transition-all border shadow-lg group-hover:scale-105 active:scale-95",
              sidebarOpen ? "bg-primary/20 border-primary/40 text-primary" : "border-white/5 text-slate-500 glass-hover"
            )}
            title="Sovereign Analytical Core"
          >
            <ShieldAlert className={cn("w-3.5 h-3.5", sidebarOpen && "animate-pulse")} />
          </button>
        </div>

        {/* Global Strategy Menu (Left) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              className="absolute left-full ml-3 top-0 pointer-events-auto origin-left w-64 apple-glass rounded-2xl border border-white/10 shadow-2xl p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest italic font-mono">Operations_Hub</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Multi-Section Management */}
              <div className="space-y-6">
                {/* 1. Tactical Visualization */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <div className="w-1 h-3 bg-secondary rounded-full" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.layers}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { id: 'buildings', icon: Building2, active: showBuildings, toggle: () => setShowBuildings(!showBuildings), label: t.buildings },
                      { id: 'grid', icon: Grid, active: showGrid, toggle: () => setShowGrid(!showGrid), label: t.tacticalGrid },
                      { id: 'hex', icon: Hexagon, active: showHexGrid, toggle: () => {
                          const newState = !showHexGrid;
                          setShowHexGrid(newState);
                          if (newState) soundService.playSonar();
                        }, label: t.tacticalCells },
                      { id: 'traffic', icon: Activity, active: showTraffic, toggle: () => setShowTraffic(!showTraffic), label: 'Live Traffic' }
                    ].map(layer => (
                      <button
                        key={layer.id}
                        onClick={layer.toggle}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 rounded-lg text-[9px] font-display uppercase tracking-wider transition-all",
                          layer.active ? "bg-white/5 text-white border border-white/10" : "text-slate-500 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <layer.icon className="w-3.5 h-3.5" />
                          {layer.label}
                        </div>
                        <div className={cn("w-1.5 h-1.5 rounded-full", layer.active ? "bg-primary pulsate-glow" : "bg-slate-800")} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Orbital Twin Suite */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <div className="w-1 h-3 bg-primary rounded-full" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Orbital_Twin_Suite</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { id: 'infra-power', icon: Zap, active: showInfraPower, toggle: () => setShowInfraPower(!showInfraPower), label: 'Twin // Power Grid' },
                      { id: 'infra-comm', icon: Radio, active: showInfraComm, toggle: () => setShowInfraComm(!showInfraComm), label: 'Twin // Comm Uplinks' },
                      { id: 'risk-radar', icon: Shield, active: showRiskRadar, toggle: () => setShowRiskRadar(!showRiskRadar), label: 'Sovereign Risk Radar' },
                      { id: 'projects', icon: Hammer, active: showFutureProjects, toggle: () => setShowFutureProjects(!showFutureProjects), label: 'Development SIM' }
                    ].map(layer => (
                      <button
                        key={layer.id}
                        onClick={() => {
                          layer.toggle();
                          soundService.playClick();
                        }}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 rounded-lg text-[9px] font-display uppercase tracking-wider transition-all",
                          layer.active ? "bg-primary/10 text-primary border border-primary/20" : "text-slate-500 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <layer.icon className="w-3.5 h-3.5" />
                          {layer.label}
                        </div>
                        <div className={cn("w-1.5 h-1.5 rounded-full", layer.active ? "bg-primary pulsate-glow" : "bg-slate-800")} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Neural Simulation Suite */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <div className="w-1 h-3 bg-amber-500 rounded-full" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Neural_Simulation_FC</span>
                  </div>
                  
                  <div className="space-y-4 px-1">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Rent Rate Base</span>
                        <span className={cn("text-[8px] font-mono font-bold", simulationParams.rentRate >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {simulationParams.rentRate > 0 ? '+' : ''}{simulationParams.rentRate * 10}%
                        </span>
                      </div>
                      <input 
                        type="range" min="-5" max="10" step="1" value={simulationParams.rentRate}
                        onChange={(e) => setSimulationParams(p => ({ ...p, rentRate: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Occupancy Forecast</span>
                        <span className={cn("text-[8px] font-mono font-bold", simulationParams.occupancy >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {simulationParams.occupancy > 0 ? '+' : ''}{simulationParams.occupancy * 5}%
                        </span>
                      </div>
                      <input 
                        type="range" min="-10" max="10" step="1" value={simulationParams.occupancy}
                        onChange={(e) => setSimulationParams(p => ({ ...p, occupancy: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-secondary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-500 font-bold uppercase">Inflation Drift</span>
                        <span className={cn("text-[8px] font-mono font-bold", simulationParams.inflation <= 0 ? "text-emerald-400" : "text-red-400")}>
                          {simulationParams.inflation > 0 ? '+' : ''}{simulationParams.inflation * 2}%
                        </span>
                      </div>
                      <input 
                        type="range" min="-5" max="15" step="1" value={simulationParams.inflation}
                        onChange={(e) => setSimulationParams(p => ({ ...p, inflation: parseInt(e.target.value) }))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Strategic Data Export */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <div className="w-1 h-3 bg-white/20 rounded-full" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Institutional_Exports</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { icon: FileText, label: 'Investment Memorandum (PDF)', action: handleExportPDF },
                      { icon: Database, label: 'Asset Data Ledger (XLSX)', action: handleExportExcel },
                      { icon: Camera, label: 'Tactical Snapshot (PNG)', action: handleExportScreenshot }
                    ].map((btn, i) => (
                      <button
                        key={i}
                        onClick={btn.action}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 transition-all text-left group"
                      >
                        <btn.icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary transition-colors" />
                        <span className="text-[9px] font-display font-medium uppercase tracking-wider">{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 5. Strategic Filtering */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <div className="w-1 h-3 bg-primary rounded-full" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.filters}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-1">
                    {[
                      { id: 'stable', icon: CheckCircle2, color: 'text-emerald-500' },
                      { id: 'risk', icon: AlertTriangle, color: 'text-red-500' },
                      { id: 'anomalous', icon: Radio, color: 'text-slate-500' }
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => toggleStatusFilter(st.id)}
                        className={cn(
                          "aspect-square flex flex-col items-center justify-center rounded-lg border transition-all gap-1.5",
                          filters.statuses.includes(st.id) ? "bg-white/5 border-white/20" : "border-transparent bg-slate-900/40"
                        )}
                        title={st.id}
                      >
                        <st.icon className={cn("w-4 h-4", filters.statuses.includes(st.id) ? st.color : "text-slate-700")} />
                        <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">{st.id.slice(0,3)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="px-2 pt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">ROI Minimum</span>
                      <span className="text-[9px] font-mono text-primary font-bold">{filters.minRoi}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="30" value={filters.minRoi}
                      onChange={(e) => setFilters(p => ({ ...p, minRoi: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => setFilters({ statuses: ['stable', 'risk', 'anomalous'], minRoi: 0, owner: '' })}
                  className="w-full py-2 text-[8px] text-slate-500 hover:text-primary uppercase font-bold tracking-widest border border-white/5 rounded-xl hover:bg-white/5 transition-all"
                >
                  Hard Reset Strategy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Navigation Sector (Right) */}
      <div className="absolute right-4 sm:right-6 top-[30%] translate-y-0 flex flex-col gap-3 pointer-events-auto z-[70]">
        
        {/* Layer Visibility Toggle (Quick) */}
        <div className="relative group">
          <button 
            onClick={() => setLayersMenuOpen(!layersMenuOpen)}
            className={cn(
              "apple-glass rounded-lg w-[30px] h-[30px] flex items-center justify-center transition-all border shadow-lg group-hover:scale-105 active:scale-95",
              layersMenuOpen ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(var(--primary-accent),0.3)]" : "border-white/5 text-slate-500 glass-hover"
            )}
            title="Sovereign View Configuration"
          >
            <Layers className="w-3.5 h-3.5" />
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
                        onClick={() => {
                          setBasemap(m.url);
                          soundService.playClick();
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all",
                          JSON.stringify(basemap) === JSON.stringify(m.url) ? "bg-primary/20 text-primary border border-primary/30" : "text-slate-400 hover:bg-white/5"
                        )}
                      >
                        {m.icon}
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend Toggle */}
        <button 
          onClick={() => setLegendOpen(!legendOpen)}
          className={cn(
            "apple-glass rounded-lg w-[30px] h-[30px] flex items-center justify-center transition-all border shadow-lg group-hover:scale-105 active:scale-95",
            legendOpen ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : "border-white/5 text-slate-500 glass-hover"
          )}
          title="Tactical Legend"
        >
          <Info className="w-3.5 h-3.5" />
        </button>

        {/* Precision Navigation (Zoom) */}
        <div className="flex flex-col tactical-glass energy-border rounded-xl shadow-xl overflow-hidden">
          <button 
            onClick={() => mapRef.current?.easeTo({ zoom: viewState.zoom + 1 })}
            className="w-[30px] h-[35px] flex items-center justify-center hover:bg-white/5 text-slate-400 border-b border-white/5"
            title="Increase Scale"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => mapRef.current?.easeTo({ zoom: viewState.zoom - 1 })}
            className="w-[30px] h-[35px] flex items-center justify-center hover:bg-white/5 text-slate-400 border-b border-white/5"
            title="Decrease Scale"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => mapRef.current?.flyTo({ pitch: 0, bearing: 0, duration: 800 })}
            className="w-[30px] h-[35px] flex items-center justify-center hover:bg-white/5 text-slate-400"
            title="Recalibrate Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Coordinates Display (Precise) */}
        <div className="hidden sm:flex flex-col items-center gap-1 apple-glass rounded-xl border border-white/5 p-2 w-[44px] absolute -bottom-24 left-1/2 -translate-x-1/2">
          <Radio className="w-2.5 h-2.5 text-primary pulsate-glow" />
          <div className="flex flex-col items-center">
            <span className="text-[6px] text-slate-500 font-mono tracking-tighter">LAT</span>
            <span className="text-[8px] font-mono text-white">{mapCoords.lat.toFixed(3)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[6px] text-slate-500 font-mono tracking-tighter">LON</span>
            <span className="text-[8px] font-mono text-white">{mapCoords.lon.toFixed(3)}</span>
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
              className="mt-auto mb-4 sm:mb-6 w-[calc(100vw-2rem)] sm:w-full sm:max-w-xs apple-glass rounded-xl p-4 sm:p-5 pointer-events-auto shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4 sm:mb-5">
                <div>
                  <h3 className="text-lg font-display font-bold text-[var(--text-main)] tracking-tight uppercase">{t.sector} #{hoverInfo.id}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Sector_ID:</p>
                    <span className="px-1.5 py-0.5 bg-secondary/10 border border-secondary/30 rounded text-[8px] font-bold text-secondary pulsate-glow-secondary">
                      {hoverInfo.id}
                    </span>
                  </div>
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
                  <p className="text-xl font-mono text-[var(--text-main)]">{hoverInfo.properties.height ?? 0}<span className="text-[10px] text-slate-500 ml-1">m</span></p>
                </div>
                
                {/* Rule 2: RLS Protected Fields */}
                {(hoverInfo.properties.roi !== undefined || (hoverInfo.properties as any).simulatedRoi !== undefined) ? (
                  <div className="space-y-0.5">
                    <p className={cn("text-[8px] uppercase font-bold flex items-center gap-1 tracking-widest", (hoverInfo.properties as any).isSimulated ? "text-amber-400" : "text-primary")}>
                      <TrendingUp className="w-2.5 h-2.5" /> 
                      {(hoverInfo.properties as any).isSimulated ? `Yield_${simulationYear}_FC` : 'Yield_ROI'}
                    </p>
                    <p className={cn("text-xl font-mono font-bold", (hoverInfo.properties as any).isSimulated ? "text-amber-400" : "text-primary")}>
                      {(hoverInfo.properties as any).simulatedRoi || hoverInfo.properties.roi}<span className="text-[10px] ml-1">%</span>
                    </p>
                    {(hoverInfo.properties as any).isSimulated && (
                      <p className="text-[7px] text-slate-500 font-mono">BASE_ROI: {hoverInfo.properties.roi}%</p>
                    )}
                  </div>
                ) : (hoverInfo.properties as any).purity ? (
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-cyan-400 uppercase font-bold flex items-center gap-1 tracking-widest">
                      <CheckSquare className="w-2.5 h-2.5" /> Legal_Purity
                    </p>
                    <p className="text-xl font-mono text-cyan-400 font-bold uppercase">{(hoverInfo.properties as any).purity}</p>
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

              {/* Management/Description Section for non-buildings */}
              {hoverInfo.properties.description && (
                <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1 leading-tight">Tactical Analysis</p>
                  <p className="text-[9px] text-slate-300 leading-relaxed tracking-tight italic">"{hoverInfo.properties.description}"</p>
                </div>
              )}

              {/* Institutional Strategic Data */}
              {(showRiskRadar || showFutureProjects) && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                   <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-3 h-3 text-red-500 animate-pulse" />
                      <span className="text-[8px] font-bold text-white uppercase tracking-widest">
                        {(hoverInfo.properties as any).type === 'FUTURE_PROJECT' ? 'Future Impact Analysis' : 'Risk Radar // Strategic Analysis'}
                      </span>
                   </div>
                   
                   {(hoverInfo.properties as any).type === 'FUTURE_PROJECT' ? (
                     <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[7px] text-slate-500 uppercase font-bold">Project_Timeline</p>
                          <p className="text-[9px] text-white font-mono uppercase">
                            {(hoverInfo.properties as any).startYear} - {(hoverInfo.properties as any).endYear}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[7px] text-slate-500 uppercase font-bold">Project_Status</p>
                          <p className={cn("text-[9px] font-bold font-mono uppercase", 
                            hoverInfo.properties.status === 2 ? "text-amber-400" : "text-emerald-400"
                          )}>
                            {hoverInfo.properties.status === 2 ? 'Under_Construction' : 'Operational'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] text-slate-500 uppercase font-bold">Estimated_Impact</p>
                        <p className="text-[9px] text-primary font-mono font-bold uppercase">
                          {(hoverInfo.properties as any).impact}
                        </p>
                      </div>
                     </>
                   ) : (hoverInfo.properties as any).type === 'LEGAL_RISK_ZONE' ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[7px] text-slate-500 uppercase font-bold">Compliance_Index</p>
                          <p className={cn("text-[9px] font-mono font-bold uppercase", 
                            (hoverInfo.properties as any).compliance > 80 ? "text-emerald-400" : 
                            (hoverInfo.properties as any).compliance > 50 ? "text-amber-400" : "text-red-400"
                          )}>
                            {(hoverInfo.properties as any).compliance}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[7px] text-slate-500 uppercase font-bold">Legal_Purity</p>
                          <p className="text-[9px] text-white font-mono uppercase">{(hoverInfo.properties as any).purity}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] text-slate-500 uppercase font-bold">Risk_Classification</p>
                        <p className={cn("text-[9px] font-mono font-bold uppercase", 
                          (hoverInfo.properties as any).risk === 'Critical' ? "text-red-500" : "text-white"
                        )}>{(hoverInfo.properties as any).risk}</p>
                      </div>
                    </>
                   ) : (
                     <>
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <p className="text-[7px] text-slate-500 uppercase font-bold">Ownership_Status</p>
                             <p className="text-[9px] text-white font-mono break-all">{hoverInfo.properties.owner || 'Verified_Clear'}</p>
                           </div>
                           <div className="space-y-1">
                             <p className="text-[7px] text-slate-500 uppercase font-bold">Sanctions_Resist</p>
                             <p className={cn("text-[9px] font-bold font-mono uppercase", 
                               (hoverInfo.properties as any).sanctions_resist === 'High' ? "text-emerald-400" : 
                               (hoverInfo.properties as any).sanctions_resist === 'Medium' ? "text-amber-400" : 
                               (hoverInfo.properties as any).sanctions_resist === 'Low' ? "text-orange-400" : 
                               "text-red-500"
                             )}>
                               {(hoverInfo.properties as any).sanctions_resist || 'UNKNOWN'}
                             </p>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[7px] text-slate-500 uppercase font-bold">Legal Encumbrances</p>
                           <p className={cn("text-[9px] font-mono uppercase", 
                             !(hoverInfo.properties as any).encumbrances || (hoverInfo.properties as any).encumbrances === 'None' ? "text-emerald-400" : "text-amber-400"
                           )}>
                             {(hoverInfo.properties as any).encumbrances || 'NODE_CLEARANCE_PASSED'}
                           </p>
                        </div>
                     </>
                   )}
                </div>
              )}

              {/* Game Mechanics: Cost & Buy Button */}
              {hoverInfo.properties.cost !== undefined && (
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
                  
                  {!portfolio.includes(hoverInfo.id) && (
                    <button 
                      onClick={() => handleCreateSyndicate(hoverInfo)}
                      className="w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-display font-bold uppercase tracking-[0.2em] transition-all bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 active:scale-[0.98]"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Form Syndicate
                    </button>
                  )}
                </div>
              )}
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

      {/* Hex Analytics Modal */}
      <AnimatePresence>
        {selectedHex && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-base/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg apple-glass rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Hexagon className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-display font-bold text-white uppercase tracking-widest leading-none">
                      Sector {selectedHex.hex.slice(-6).toUpperCase()} Analytics
                    </h2>
                    <p className="text-[8px] text-slate-500 font-mono mt-1 uppercase tracking-widest">District_Tactical_Intelligence</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedHex(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 scrollbar-hide space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Occupancy_Density</span>
                    <div className="flex items-end gap-2">
                       <span className="text-2xl font-mono font-bold text-primary">{selectedHex.occupancy}%</span>
                       <div className="h-6 flex-1 bg-slate-900 rounded-full overflow-hidden mb-1 border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedHex.occupancy}%` }}
                            className="h-full bg-primary/50 shadow-[0_0_10px_rgba(var(--primary-accent),0.3)]"
                          />
                       </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Strategic_Value</span>
                    <span className="text-2xl font-mono font-bold text-secondary">{selectedHex.value}</span>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none" />
                  <div className="relative p-6 rounded-2xl bg-slate-950 border border-primary/20 shadow-xl min-h-[200px]">
                    <div className="flex items-center gap-2 mb-4 border-b border-primary/10 pb-2">
                       <Cpu className="w-4 h-4 text-primary" />
                       <span className="text-[9px] font-bold text-primary uppercase tracking-[0.3em]">Neural_Advisory_Output</span>
                    </div>
                    
                    {isHexAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-[10px] font-mono text-primary animate-pulse tracking-widest">DECRYPTING_DISTRICT_PATTERNS...</span>
                      </div>
                    ) : (
                      <div className="markdown-body text-[11px] text-slate-300 leading-relaxed font-sans">
                        <Markdown>{hexAnalysis}</Markdown>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-secondary/5 border border-secondary/20 rounded-xl">
                    <Info className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <p className="text-[9px] text-slate-400 font-medium italic">
                       AEGIS Intelligence recommends targeting the specified tenant type to saturate underserviced demand nodes in this hex.
                    </p>
                </div>
              </div>

              <div className="p-4 bg-[#050505] border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setSelectedHex(null)}
                  className="px-6 py-2 rounded-xl bg-primary text-slate-900 font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary-accent),0.3)] active:scale-95"
                >
                  Confirm Strategic Analysis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-display font-bold text-[var(--text-main)] tracking-tight uppercase">
                        {selectedBuilding.properties.title || t.portfolio}
                      </h2>
                      <div className="px-2 py-0.5 bg-primary/10 border border-primary/30 rounded text-[9px] font-mono font-bold text-primary pulsate-glow">
                        ID: {selectedBuilding.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[9px] tracking-widest uppercase">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>
                        {selectedBuilding.properties.address || `${t.sector}_01`}
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
                        {selectedBuilding.properties.type ? t.assetType : t.buildingLevels}
                      </p>
                    </div>
                    <p className="text-lg font-mono font-bold text-[var(--text-main)] uppercase">
                      {selectedBuilding.properties.type 
                        ? t[selectedBuilding.properties.type] 
                        : (selectedBuilding.properties as any).levels || Math.ceil((selectedBuilding.properties.height || 0) / 3.5) || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-surface rounded-xl p-3 sm:p-4 border border-border flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-primary" />
                      <p className="text-[8px] text-primary uppercase font-bold tracking-widest">{t.assetHeight}</p>
                    </div>
                    <p className="text-lg font-mono font-bold text-primary">
                      {selectedBuilding.properties.height || 'N/A'}<span className="text-[10px] ml-1">m</span>
                    </p>
                  </div>
                </div>

                {/* Tactical OSM Parameters */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                    <p className="text-[7px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">{t.roofShape}</p>
                    <div className="flex items-center gap-2">
                      <Sun className="w-3 h-3 text-amber-500/50" />
                      <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">
                        {(selectedBuilding.properties as any).roofShape || 'Flat_Standard'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
                    <p className="text-[7px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">{t.assetFootprint}</p>
                    <div className="flex items-center gap-2">
                      <Square className="w-3 h-3 text-primary/50" />
                      <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider">
                        {selectedBuilding.geometry?.type === 'Polygon' ? 'Precise_OSM' : 'Point_Raster'}
                      </span>
                    </div>
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
                  {/* AI Analysis Section */}
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        <h3 className="text-[9px] font-display font-bold text-primary uppercase tracking-[0.2em]">{t.aiAnalysis}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAIAnalysis(selectedBuilding)}
                          disabled={isAnalyzing}
                          className={cn(
                            "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                            isAnalyzing 
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                              : "bg-primary text-white hover:bg-primary/80 shadow-[0_0_15px_rgba(var(--primary-accent),0.3)]"
                          )}
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                              {t.analyzing}
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3" />
                              {t.aiAnalysis}
                            </>
                          )}
                        </button>
                        
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleGenerateReport(selectedBuilding)}
                            disabled={isGeneratingReport}
                            className={cn(
                              "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                              isGeneratingReport 
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                                : "bg-secondary text-white hover:bg-secondary/80 shadow-[0_0_15px_rgba(var(--secondary-accent),0.3)]"
                            )}
                          >
                            {isGeneratingReport ? (
                              <>
                                <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                {t.generatingReport}
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                {t.generateReport}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {aiAnalysis ? (
                      <div className="prose prose-invert prose-xs max-w-none">
                        <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                          <Markdown>{aiAnalysis}</Markdown>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-primary/10 rounded-lg">
                        <Radar className="w-6 h-6 text-primary/20 mb-2 animate-pulse" />
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest text-center px-4">
                          {isAnalyzing ? "Scanning market data..." : "Initialize AI scan for strategic investment briefing"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-base/40 rounded-xl p-4 border border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h3 className="text-[9px] font-display font-bold text-slate-400 uppercase tracking-[0.2em]">Strategic Documentation</h3>
                      <div className="flex flex-wrap gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-secondary/10 glass-hover text-secondary rounded-lg transition-colors border border-secondary/20"
                          title={t.uploadDocumentation}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">{t.uploadDocumentation}</span>
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startCapture('photo')}
                            className="w-10 h-10 bg-primary/10 glass-hover text-primary rounded-lg transition-colors flex items-center justify-center"
                            title="Capture Photo"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => startCapture('video')}
                            className="w-10 h-10 bg-secondary/10 glass-hover text-secondary rounded-lg transition-colors flex items-center justify-center"
                            title="Record Video"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        </div>
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

      <AnimatePresence>
        {dashboardOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute left-0 sm:left-6 top-0 sm:top-56 bottom-0 sm:bottom-24 w-full sm:w-80 z-[60] flex flex-col gap-4 pointer-events-none p-4 sm:p-0"
          >
            <div className="flex sm:hidden justify-between items-center mb-4 pointer-events-auto shrink-0 apple-glass-dark p-4 rounded-2xl">
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

            <div className="flex-1 overflow-y-auto scrollbar-hide pointer-events-auto space-y-4 pb-10 sm:pb-0">
              {/* Mobile User Info */}
              <ParallaxCard className="sm:hidden mb-4">
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

            <button 
              onClick={() => setInvestorCabinetOpen(true)}
              className="w-auto px-4 self-end bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary font-mono font-bold py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[7px] shadow-lg mt-2 pointer-events-auto"
            >
              <LayoutDashboard className="w-2.5 h-2.5" />
              Strategic_Terminal
            </button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      <StrategicReportModal 
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        data={reportData}
        t={t}
      />

      <InvestorCabinet 
        isOpen={investorCabinetOpen}
        onClose={() => setInvestorCabinetOpen(false)}
        balance={balance}
        portfolioValue={portfolioValue}
        portfolio={portfolioDetailed}
        performanceHistory={performanceHistory}
        analyzedHexes={analyzedHexes}
        marketOrders={marketOrders}
        onListOnMarket={handleListOnMarket}
        onBuyFromMarket={handleBuyFromMarket}
        user={user}
        t={t}
        onSelectAsset={(asset: any) => {
          setViewState(prev => ({
            ...prev,
            latitude: asset.latitude,
            longitude: asset.longitude,
            zoom: 17,
            pitch: 60,
            bearing: 0,
            transitionDuration: 1500
          }));
          setSelectedBuilding({ id: asset.id, properties: asset });
          soundService.playSonar();
        }}
      />

      <div className="absolute left-4 bottom-24 z-50 pointer-events-auto flex flex-col gap-1.5">
        {user && (
          <button 
            onClick={() => {
              setNewAsset(prev => ({ ...prev, latitude: viewState.latitude, longitude: viewState.longitude }));
              setCreateModalOpen(true);
            }}
            className="w-8 h-8 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg flex items-center justify-center text-primary transition-all shadow-xl"
            title={t.createAsset}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Numerical Map Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto flex flex-col gap-1.5">
        <div className="apple-glass-dark border border-white/10 rounded-xl p-1.5 flex flex-col gap-1.5 shadow-2xl">
          <button 
            onClick={() => {
              setViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 1, 20), transitionDuration: 300 }));
              soundService.playClick();
            }}
            className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white transition-all"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => {
              setViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 1, 1), transitionDuration: 300 }));
              soundService.playClick();
            }}
            className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white transition-all"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="h-px bg-white/10 mx-2" />
          <button 
            onClick={() => {
              setViewState(prev => ({ ...prev, pitch: Math.min(prev.pitch + 15, 85), transitionDuration: 300 }));
              soundService.playClick();
            }}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-white transition-all"
            title="Tilt Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button 
            onClick={() => {
              setViewState(prev => ({ ...prev, pitch: Math.max(prev.pitch - 15, 0), transitionDuration: 300 }));
              soundService.playClick();
            }}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-white transition-all"
            title="Tilt Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="h-px bg-white/10 mx-2" />
          <button 
            onClick={() => {
              setViewState(prev => ({ 
                ...prev, 
                pitch: 60, 
                bearing: -20, 
                zoom: 15.5,
                latitude: 55.7558,
                longitude: 37.6173,
                transitionDuration: 1000 
              }));
              soundService.playSonar();
            }}
            className="w-10 h-10 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center text-primary transition-all"
            title="Reset Navigation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
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
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{language === 'en' ? 'Traffic: Clear' : 'Трафик: Норма'}</span>
                  <div className="w-12 h-1.5 bg-green-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">{language === 'en' ? 'Traffic: Jam' : 'Трафик: Пробки'}</span>
                  <div className="w-12 h-1.5 bg-red-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-full" />
                  </div>
                </div>
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
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Visual Model</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'house', label: 'House', icon: <Building2 className="w-4 h-4" />, img: 'https://picsum.photos/seed/house/200/200' },
                        { id: 'apartment', label: 'Apartment Block', icon: <Building2 className="w-4 h-4" />, img: 'https://picsum.photos/seed/apartment/200/200' },
                        { id: 'warehouse', label: 'Warehouse', icon: <Building2 className="w-4 h-4" />, img: 'https://picsum.photos/seed/warehouse/200/200' },
                        { id: 'office', label: 'Office Building', icon: <Building2 className="w-4 h-4" />, img: 'https://picsum.photos/seed/skyscraper/200/200' },
                      ].map((model) => (
                        <button
                          key={model.id}
                          onClick={() => setNewAsset(prev => ({ ...prev, model: model.id }))}
                          className={cn(
                            "group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                            newAsset.model === model.id 
                              ? "border-primary shadow-[0_0_15px_rgba(var(--primary-accent-rgb),0.3)]" 
                              : "border-white/5 hover:border-white/20"
                          )}
                        >
                          <img 
                            src={model.img} 
                            alt={model.label}
                            referrerPolicy="no-referrer"
                            className={cn(
                              "w-full h-full object-cover transition-transform duration-500",
                              newAsset.model === model.id ? "scale-110" : "group-hover:scale-105"
                            )}
                          />
                          <div className={cn(
                            "absolute inset-0 flex flex-col items-center justify-end p-2 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity",
                            newAsset.model === model.id ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                          )}>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-white mb-1">{model.label}</span>
                            {newAsset.model === model.id && (
                              <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

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
                        value={isNaN(newAsset.cost) ? '' : newAsset.cost}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNewAsset(prev => ({ ...prev, cost: isNaN(val) ? 0 : val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetYield}</label>
                      <input 
                        type="number"
                        value={isNaN(newAsset.yield) ? '' : newAsset.yield}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNewAsset(prev => ({ ...prev, yield: isNaN(val) ? 0 : val }));
                        }}
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t.assetAddress}</label>
                    </div>
                    <div className="flex gap-2">
                       <input 
                         type="text"
                         value={newAsset.address}
                         onChange={(e) => setNewAsset(prev => ({ ...prev, address: e.target.value }))}
                         className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                         placeholder="Enter location address..."
                       />
                       <button 
                         onClick={handleGeocode}
                         disabled={isGeocoding || !newAsset.address}
                         className={cn(
                           "px-3 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 rounded-xl flex items-center justify-center text-secondary transition-all",
                           isGeocoding && "animate-pulse"
                         )}
                         title="Convert Address to Coordinates"
                       >
                         {isGeocoding ? <RotateCcw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                       </button>
                       <button 
                         onClick={handleSuggestAssetType}
                         disabled={isSuggesting || !newAsset.address || newAsset.cost <= 0}
                         className={cn(
                           "px-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                           isSuggesting ? "text-primary animate-pulse" : "text-primary disabled:opacity-30 disabled:grayscale"
                         )}
                       >
                         <Sparkles className="w-3.5 h-3.5" />
                         Analyze
                       </button>
                    </div>
                  </div>

                  {/* AI Suggestion Display */}
                  <AnimatePresence>
                    {suggestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Cpu className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Strategic Recommendation</span>
                            </div>
            <button 
              onClick={() => {
                setNewAsset(prev => ({ ...prev, type: suggestion.type, model: suggestion.model }));
                setSuggestion(null);
              }}
              className="text-[9px] font-bold text-base bg-primary px-2 py-1 rounded hover:bg-primary/80 transition-all uppercase tracking-widest"
            >
              Apply Logic
            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Recommended_Type</p>
                                <p className="text-xs text-white font-mono uppercase">{suggestion.type}</p>
                            </div>
                            <div>
                                <p className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Optimal_Model</p>
                                <p className="text-xs text-white font-mono uppercase">{suggestion.model}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[7px] text-slate-500 uppercase font-bold tracking-widest mb-1">Strategic_Justification</p>
                            <p className="text-[10px] text-slate-400 italic leading-relaxed">"{suggestion.reason}"</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">SQFT</label>
                      <input 
                        type="number"
                        value={isNaN(newAsset.sqft) ? '' : newAsset.sqft}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNewAsset(prev => ({ ...prev, sqft: isNaN(val) ? 0 : val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        placeholder="2500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Year Built</label>
                      <input 
                        type="number"
                        value={isNaN(newAsset.yearBuilt) ? '' : newAsset.yearBuilt}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setNewAsset(prev => ({ ...prev, yearBuilt: isNaN(val) ? new Date().getFullYear() : val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                        placeholder="2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">Parking</label>
                      <input 
                        type="number"
                        value={isNaN(newAsset.parkingSpaces) ? '' : newAsset.parkingSpaces}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setNewAsset(prev => ({ ...prev, parkingSpaces: isNaN(val) ? 0 : val }));
                        }}
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
                        value={isNaN(newAsset.latitude) ? '' : newAsset.latitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNewAsset(prev => ({ ...prev, latitude: isNaN(val) ? 0 : val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">{t.assetLon}</label>
                      <input 
                        type="number"
                        step="0.000001"
                        value={isNaN(newAsset.longitude) ? '' : newAsset.longitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setNewAsset(prev => ({ ...prev, longitude: isNaN(val) ? 0 : val }));
                        }}
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
                  disabled={isCreating || !newAsset.title.trim() || !newAsset.cost}
                  className={cn(
                    "w-full font-bold py-4 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3",
                    (isCreating || !newAsset.title.trim() || !newAsset.cost)
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                      : "bg-primary hover:bg-primary/80 text-base shadow-[0_0_20px_rgba(var(--primary-accent),0.4)]"
                  )}
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
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary-accent),0.5)] pulsate-glow" />
                  <span className="text-[9px] font-mono font-bold text-white uppercase tracking-wider pulsate-glow-secondary">
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

      {/* Syndicate Virtual Management Room */}
      <AnimatePresence>
        {syndicateRoomOpen && activeSyndicate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSyndicateRoomOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Left Side: Summary & Progress */}
              <div className="md:w-5/12 p-6 sm:p-8 bg-gradient-to-br from-white/5 to-transparent border-r border-white/5 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center border border-secondary/30 pulsate-glow overflow-hidden">
                    <Handshake className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-white tracking-tight">Syndicated Deal</h2>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{activeSyndicate.id}</p>
                  </div>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2">Subject Asset</p>
                    <h3 className="text-xl font-bold text-white leading-tight mb-2 tracking-tight">{activeSyndicate.buildingName}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <span className="text-[10px] font-mono text-secondary uppercase tracking-widest">Syndication_In_Progress</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Capital Accumulation</p>
                      <p className="text-xs font-mono text-white">
                        <span className="text-secondary font-bold">{((activeSyndicate.raisedAmount / activeSyndicate.targetAmount) * 100).toFixed(1)}%</span>
                        <span className="text-slate-600 ml-1">Allocated</span>
                      </p>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full shadow-[0_0_15px_rgba(var(--secondary-accent),0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${(activeSyndicate.raisedAmount / activeSyndicate.targetAmount) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white">${activeSyndicate.raisedAmount.toLocaleString()}</span>
                      <span className="text-slate-600">Of ${activeSyndicate.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                     <div>
                       <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-2">Strategic Support Fees</p>
                       <div className="space-y-2">
                         <div className="flex justify-between text-[10px]">
                           <span className="text-slate-400 font-medium">Administration Mgmt (2.0%)</span>
                           <span className="text-white font-mono font-bold">${(activeSyndicate.targetAmount * activeSyndicate.adminFeeRate).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between text-[10px]">
                           <span className="text-slate-400 font-medium">Legal & Compliance (1.5%)</span>
                           <span className="text-white font-mono font-bold">${(activeSyndicate.targetAmount * activeSyndicate.legalFeeRate).toLocaleString()}</span>
                         </div>
                       </div>
                     </div>
                  </div>
                  
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[9px] text-primary uppercase font-bold tracking-widest">Legal Safeguard</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">"Trust-less multi-party agreement executed via Yardsoft Escrow protocols."</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSyndicateRoomOpen(false)}
                  className="mt-8 py-3 w-full bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-white/5 transition-all glass-hover"
                >
                  Minimize Management Suite
                </button>
              </div>

              {/* Right Side: Execution & Participation */}
              <div className="flex-1 p-6 sm:p-8 flex flex-col bg-slate-900 overflow-hidden">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xs uppercase font-bold text-slate-500 tracking-[0.2em]">Syndicate Ledger</h3>
                   <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[8px] font-mono text-green-500 uppercase tracking-widest font-bold">Secure Node Linked</span>
                   </div>
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-4 mb-8 pr-2 custom-scrollbar">
                   <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest border-l-2 border-secondary pl-2 ml-1">Capital Contributors</p>
                      {activeSyndicate.participants.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-secondary/30 transition-all shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-slate-700 transition-colors">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-none mb-1 tracking-tight">{p.name}</p>
                              <p className="text-[8px] text-slate-500 uppercase font-mono tracking-widest">{p.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold text-white">${p.amount.toLocaleString()}</p>
                            <p className="text-[8px] text-slate-600 uppercase font-mono tracking-tighter">{(p.amount / activeSyndicate.targetAmount * 100).toFixed(1)}% Share</p>
                          </div>
                        </div>
                      ))}
                      {activeSyndicate.participants.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 mt-4">
                           <Users className="w-10 h-10 text-slate-600 mb-2" />
                           <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Awaiting Institutional Entry</p>
                        </div>
                      )}
                   </div>
                 </div>

                 {/* Interaction Area */}
                 <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-1">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Execute Subscription</p>
                       <p className="text-[10px] font-mono text-secondary uppercase font-bold tracking-widest bg-secondary/10 px-2 py-0.5 rounded">Avail: ${balance.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       {[1000000, 5000000, 10000000, 25000000].map(amt => (
                         <button 
                           key={amt}
                           onClick={() => handleContributeToSyndicate(activeSyndicate.id, amt)}
                           className={cn(
                             "py-3.5 rounded-2xl text-[10px] font-display font-bold uppercase tracking-[0.2em] transition-all border shadow-lg",
                             balance >= amt ? "bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20 hover:border-secondary/50 active:scale-95 shadow-secondary/5" : "bg-slate-800/50 border-white/5 text-slate-600 cursor-not-allowed shadow-none"
                           )}
                         >
                           +${(amt / 1000000).toFixed(0)}M
                         </button>
                       ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-[8px] text-slate-500 leading-normal uppercase tracking-tight">
                        Subscription binds participant to a 3.5% cumulative commission for system administration and legal clearing. Escrow managed via Sovereign protocols.
                      </p>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AppErrorBoundary>
  );
}
