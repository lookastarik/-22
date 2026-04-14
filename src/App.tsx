import * as React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Map, useControl, Layer, MapRef, Marker, Source } from 'react-map-gl/maplibre';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox';
import { LightingEffect, AmbientLight, _SunLight as SunLight } from '@deck.gl/core';
import { createBuildingsLayer } from './layers/buildings';
import { createTrafficLayer, processRoadsToTrips } from './layers/traffic';
import { ThreeProjectLayer, ProjectModel } from './layers/threeLayer';
import { GoogleGenAI, Type } from "@google/genai";
import { soundService } from './services/soundService';
import { PathLayer } from '@deck.gl/layers';
// Firebase removed - using local SQLite via API
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
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart3,
  LayoutDashboard,
  Grid
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
    aiAnalysis: "AI Analysis",
    analyzing: "Analyzing...",
    investmentPotential: "Investment Potential",
    aiRecommendation: "AI Recommendation",
    uiStyle: "Interface Style",
    tactical: "Tactical Command",
    professional: "Professional Suite",
    uiStyleDesc: "Switch between combat-ready and polished professional interfaces.",
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

const InvestorCabinet = ({ 
  isOpen, 
  onClose, 
  balance, 
  portfolioValue, 
  totalYield, 
  portfolio, 
  history,
  t 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  balance: number, 
  portfolioValue: number, 
  totalYield: number, 
  portfolio: any[], 
  history: any[],
  t: any 
}) => {
  const avgRoi = portfolio.length > 0 
    ? portfolio.reduce((acc, curr) => acc + (curr.roi || 0), 0) / portfolio.length 
    : 0;

  const assetDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    portfolio.forEach(p => {
      counts[p.type || 'Other'] = (counts[p.type || 'Other'] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [portfolio]);

  const COLORS = ['#ffffff', '#a1a1aa', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 overflow-hidden"
        >
          <div className="w-full max-w-6xl h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-display font-bold text-white tracking-tighter uppercase">Investor_Cabinet</h2>
                <p className="text-xs font-mono text-primary/60 tracking-[0.3em] mt-1">Strategic Portfolio Analysis // Session_Active</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
              {/* Top Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Capital', value: `$${(balance + portfolioValue).toLocaleString()}`, icon: Wallet, color: 'text-white' },
                  { label: 'Portfolio Value', value: `$${portfolioValue.toLocaleString()}`, icon: Building2, color: 'text-primary' },
                  { label: 'Est. Monthly Yield', value: `$${(totalYield * 12).toLocaleString()}`, icon: TrendingUp, color: 'text-secondary' },
                  { label: 'Average ROI', value: `${avgRoi.toFixed(1)}%`, icon: Activity, color: 'text-emerald-400' }
                ].map((m, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <m.icon className="w-12 h-12" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">{m.label}</p>
                    <p className={cn("text-2xl font-display font-bold", m.color)}>{m.value}</p>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '70%' }}
                        className={cn("h-full", m.color.replace('text-', 'bg-'))}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Chart */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Portfolio_Performance
                    </h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-primary/20 text-primary text-[8px] font-bold rounded uppercase">Real-time</span>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="time" 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={8} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={8} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="var(--primary-accent)" 
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Asset Allocation */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-secondary" />
                    Asset_Allocation
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetDistribution.length > 0 ? assetDistribution : [{ name: 'None', value: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {assetDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {assetDistribution.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{entry.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-white">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Assets List */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs font-mono text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Secured_Assets_Inventory
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Asset_ID</th>
                        <th className="pb-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Type</th>
                        <th className="pb-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Valuation</th>
                        <th className="pb-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Yield</th>
                        <th className="pb-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">ROI</th>
                        <th className="pb-4 text-[8px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {portfolio.map((asset, i) => (
                        <tr key={i} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-white flex items-center gap-2">
                                {asset.title || `Asset_${asset.id}`}
                                <span className="px-1.5 py-0.5 bg-secondary/10 border border-secondary/30 rounded text-[7px] text-secondary pulsate-glow-secondary">ID: {asset.id}</span>
                              </span>
                              <span className="text-[8px] font-mono text-slate-500 uppercase">{asset.address?.substring(0, 20)}...</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-slate-400 uppercase">{asset.type || 'Standard'}</span>
                          </td>
                          <td className="py-4 text-[10px] font-mono text-white">${asset.cost?.toLocaleString()}</td>
                          <td className="py-4 text-[10px] font-mono text-secondary">+${asset.yield?.toLocaleString()}/mo</td>
                          <td className="py-4 text-[10px] font-mono text-emerald-400">{asset.roi}%</td>
                          <td className="py-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-emerald-400 pulsate-glow" />
                              <span className="text-[8px] font-mono text-emerald-400 uppercase">Active</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {portfolio.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                            No strategic assets secured in current session.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userRole, setUserRole] = useState<'anonymous' | 'investor' | 'admin'>('anonymous');
  const [balance, setBalance] = useState(5000000);
  const [portfolio, setPortfolio] = useState<(number | string)[]>([]);
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
  const [uiStyle, setUiStyle] = useState<'tactical' | 'professional'>('tactical');
  const [showLogo, setShowLogo] = useState(true);
  
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
  const [trafficTime, setTrafficTime] = useState(0);
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

  // Sound on Load
  const handleMapLoad = useCallback(() => {
    soundService.playSonar();
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

  // Traffic Animation Loop
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setTrafficTime(prev => prev + 1);
      animationFrame = requestAnimationFrame(animate);
    };
    if (showTraffic) {
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
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
      intensity: 1.0
    });

    const sunLight = new SunLight({
      color: [255, 255, 255],
      intensity: 2.0,
      _shadow: true,
      timestamp: 0
    });

    return new LightingEffect({ ambientLight, sunLight });
  }, []);

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

  const [investorCabinetOpen, setInvestorCabinetOpen] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<{time: string, value: number}[]>([]);

  // Game State
  const [totalYield, setTotalYield] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);

  // Track performance history
  useEffect(() => {
    if (performanceHistory.length === 0) {
      setPerformanceHistory([{ time: new Date().toLocaleTimeString(), value: balance + portfolioValue }]);
    }
    
    const interval = setInterval(() => {
      setPerformanceHistory(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString(), value: balance + portfolioValue }];
        if (newData.length > 20) return newData.slice(1);
        return newData;
      });
    }, 10000);
    
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
      
      Please provide a concise analysis including:
      1. Market Value assessment.
      2. Monthly Yield potential.
      3. ROI evaluation.
      4. Overall investment recommendation (Buy, Hold, or Sell).
      
      Keep the response professional and tactical, fitting a high-tech investment dashboard. Use markdown for formatting.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      
      setAiAnalysis(response.text || "No analysis generated.");
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setAiAnalysis("Failed to perform AI analysis. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };
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

  const basemaps = [
    { id: 'dark', name: 'Dark Matter', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
    { id: 'light', name: 'Positron', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
    { id: 'voyager', name: 'Voyager', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
  ];

  // Gemini Initialization
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' }), []);

  // Rule 1: "Quiet" Frontend - Layers
  const layers = useMemo(() => [
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
    showBuildings && filteredBuildings ? createBuildingsLayer(
      filteredBuildings,
      (info) => setHoverInfo(info),
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
      dataOnlyMode
    ) : null,
    showTraffic && roadsData.length > 0 ? createTrafficLayer(
      roadsData,
      trafficTime,
      showTraffic
    ) : null
  ].filter(Boolean), [showBuildings, filteredBuildings, pulse, selectedBuilding, viewState.zoom, buildingScanlineIntensity, showTraffic, roadsData, trafficTime]);

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
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary/60 text-xs">
              <Terminal className="w-4 h-4" />
              <span>SECURE UPLINK ESTABLISHED // NODE_774</span>
            </div>
            <div className="text-primary text-lg font-bold tracking-tighter">
              {terminalStatus === 'idle' && (
                <div className="flex items-center gap-2">
                  <span>{">"} ACCESS REQUEST // ENTER CLEARANCE CODE</span>
                  <motion.div 
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="w-2 h-5 bg-primary"
                  />
                </div>
              )}
              {terminalStatus === 'handshake' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-secondary"
                >
                  HANDSHAKE COMPLETE. DECRYPTING GEOSPATIAL LAYER...
                </motion.div>
              )}
            </div>
          </div>

          {terminalStatus === 'idle' && (
            <input 
              autoFocus
              type="password"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setTerminalStatus('handshake');
                  setTimeout(() => {
                    setIsAccessGranted(true);
                    setTerminalStatus('granted');
                  }, 2000);
                }
              }}
              className="w-full bg-transparent border-b border-primary/30 outline-none text-primary text-2xl tracking-[0.5em] py-2 focus:border-primary transition-colors"
            />
          )}

          <div className="flex flex-col gap-1 text-[10px] text-slate-700 uppercase tracking-widest">
            <p>Connection: Encrypted (AES-256)</p>
            <p>Origin: {window.location.hostname}</p>
            <p>Status: {terminalStatus === 'idle' ? 'Awaiting Credentials' : 'Authorizing...'}</p>
          </div>
        </motion.div>

        {/* Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10" />
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <div className="relative w-full h-screen bg-base overflow-hidden font-sans text-slate-200">
      
      {/* Cinematic Overlays */}
      {uiStyle === 'tactical' && (
        <>
          <div className="cinematic-overlay" />
          <div className="cinematic-vignette" />
          <div className="crt-flicker" />
          <div className="screen-scan-overlay" style={{ opacity: scanlineIntensity }} />
          <div className="tactical-grid" />
          <TacticalHUD lat={viewState.latitude} lon={viewState.longitude} />
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
          reuseMaps
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
                0, mode === 'dark' ? '#0f172a' : '#cbd5e1',
                100, mode === 'dark' ? '#1e293b' : '#94a3b8'
              ],
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': 0.8
            }}
          />
          <DeckGLOverlay layers={layers} effects={[lightingEffect]} />
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
      <div className="absolute inset-0 pointer-events-none flex flex-col p-4 sm:p-6 z-20">
        {/* Project Info Panel (Three.js Interaction) */}
        <AnimatePresence>
          {hoveredProject && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="absolute top-24 right-6 w-80 apple-glass rounded-2xl border border-primary/40 shadow-2xl p-5 pointer-events-auto z-50 overflow-hidden"
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

                <button className="w-full py-2.5 rounded-xl bg-primary text-slate-900 font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary-accent),0.3)]">
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
        <header className="flex justify-between items-center gap-2 pointer-events-auto mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className={cn(
                "w-9 h-9 apple-glass rounded-xl flex items-center justify-center border border-white/10 text-slate-400 hover:text-white transition-all shadow-xl",
                dashboardOpen && "hidden sm:flex"
              )}
            >
              {dashboardOpen ? <ChevronUp className="-rotate-90 w-4 h-4" /> : <ChevronUp className="rotate-90 w-4 h-4" />}
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold tracking-tighter flex items-center gap-2 text-white">
                <div className="hidden xs:flex w-7 h-7 bg-primary rounded-lg items-center justify-center shadow-[0_0_15px_rgba(var(--primary-accent),0.5)] border border-white/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="homm-heading text-xl sm:text-2xl truncate max-w-[120px] xs:max-w-none">{t.title}</span>
              </h1>
              <p className="text-[7px] text-slate-500 mt-0.5 uppercase tracking-[0.3em] font-mono hidden xs:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button 
              onClick={() => setInvestorCabinetOpen(true)}
              className="flex sm:hidden apple-glass rounded-full p-2 items-center justify-center glass-hover transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
            </button>

            <button 
              onClick={() => setInvestorCabinetOpen(true)}
              className="hidden sm:flex apple-glass rounded-full px-4 py-2 items-center gap-3 glass-hover transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
              <div className="flex flex-col items-start">
                <span className="text-[8px] text-slate-500 uppercase font-bold leading-none tracking-widest">Portfolio</span>
                <span className="text-xs font-mono font-bold text-white">
                  Analysis
                </span>
              </div>
            </button>

            <div className="hidden md:flex apple-glass rounded-full px-4 py-2 items-center gap-3">
              <Wallet className="w-3.5 h-3.5 text-secondary" />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-bold leading-none tracking-widest">{t.treasury}</span>
                <span className="text-xs font-mono font-bold text-secondary">
                  ${balance.toLocaleString()}
                </span>
              </div>
            </div>

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
                    className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50"
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
                    className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/98 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 flex flex-col"
                  >
                    {/* Header: Apple/Google Style */}
                    <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-2xl" />
                              ) : (
                                <User className="w-7 h-7 text-white" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-slate-900 rounded-full" />
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

                    <div className="flex-1 overflow-y-auto max-h-[60vh] scrollbar-hide">
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
                              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group">
                                <LayoutDashboard className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">System Logs</span>
                              </button>
                              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group">
                                <Terminal className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">API Debug</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* General Settings */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-1">System Settings</h4>
                          <div className="space-y-1">
                            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-xs text-slate-300 group">
                              <div className="flex items-center gap-3">
                                <Settings className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                <span>Security Preferences</span>
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
                    <div className="p-4 bg-black/40 border-t border-white/5">
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
                        onClick={() => setShowTraffic(!showTraffic)}
                        className={cn(
                          "flex items-center justify-between w-full p-2 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all",
                          showTraffic ? "bg-secondary/20 text-secondary border border-secondary/30" : "text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Activity className="w-3.5 h-3.5" />
                          {language === 'en' ? 'Live Traffic' : 'Трафик'}
                        </div>
                        {showTraffic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={cn(
                          "flex items-center justify-between w-full p-2 rounded-lg text-[10px] font-display uppercase tracking-wider transition-all",
                          showGrid ? "bg-primary/20 text-primary border border-primary/30" : "text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Grid className="w-3.5 h-3.5" />
                          {t.tacticalGrid}
                        </div>
                        {showGrid ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
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
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.easeTo({ zoom: viewState.zoom + 1, duration: 500 });
                  } else {
                    setViewState(v => ({ ...v, zoom: v.zoom + 1 }));
                  }
                }}
                className="p-3 hover:bg-slate-800 transition-colors border-b border-slate-800 text-slate-400"
                title="Zoom In"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.easeTo({ zoom: viewState.zoom - 1, duration: 500 });
                  } else {
                    setViewState(v => ({ ...v, zoom: v.zoom - 1 }));
                  }
                }}
                className="p-3 hover:bg-slate-800 transition-colors border-b border-slate-800 text-slate-400"
                title="Zoom Out"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      pitch: 60,
                      bearing: -20,
                      duration: 1500,
                      essential: true
                    });
                  } else {
                    setViewState(v => ({ ...v, pitch: 60, bearing: -20 }));
                  }
                }}
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
                  {/* AI Analysis Section */}
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        <h3 className="text-[9px] font-display font-bold text-primary uppercase tracking-[0.2em]">{t.aiAnalysis}</h3>
                      </div>
                      <button
                        onClick={() => handleAIAnalysis(selectedBuilding)}
                        disabled={isAnalyzing}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
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
            className="absolute left-0 sm:left-4 top-0 sm:top-20 bottom-0 sm:bottom-20 w-full sm:w-72 z-[60] flex flex-col gap-4 pointer-events-none p-4 sm:p-0 bg-base/95 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none"
          >
            <div className="flex sm:hidden justify-between items-center mb-4 pointer-events-auto shrink-0">
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
              className="w-full bg-primary hover:bg-primary/90 text-white font-display font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(var(--primary-accent),0.3)] mt-2 pointer-events-auto"
            >
              <LayoutDashboard className="w-4 h-4" />
              Open Investor Cabinet
            </button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      <InvestorCabinet 
        isOpen={investorCabinetOpen}
        onClose={() => setInvestorCabinetOpen(false)}
        balance={balance}
        portfolioValue={portfolioValue}
        totalYield={totalYield}
        portfolio={portfolio}
        history={performanceHistory}
        t={t}
      />

      <div className="absolute left-4 bottom-24 z-50 pointer-events-auto flex flex-col gap-2">
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
                      : "bg-primary hover:bg-primary/80 text-white shadow-[0_0_20px_rgba(var(--primary-accent),0.4)]"
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
    </div>
    </AppErrorBoundary>
  );
}
