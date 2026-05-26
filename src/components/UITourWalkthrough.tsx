// src/components/UITourWalkthrough.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Map, 
  ShieldAlert, 
  LayoutDashboard, 
  Sparkles, 
  Tv, 
  Volume2, 
  Activity, 
  Terminal, 
  Target,
  ArrowRight
} from 'lucide-react';
import { soundService } from '../services/soundService';

interface UITourWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ru';
  onSetSimRole: (role: 'demo' | 'investor' | 'admin') => void;
  onToggleCabinet: (open: boolean) => void;
  onSetSelectedBuilding: (building: any) => void;
  onSetIsFlyoverActive: (active: boolean) => void;
}

export function UITourWalkthrough({
  isOpen,
  onClose,
  language = 'ru',
  onSetSimRole,
  onToggleCabinet,
  onSetSelectedBuilding,
  onSetIsFlyoverActive
}: UITourWalkthroughProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [useVoiceTick, setUseVoiceTick] = useState(true);

  useEffect(() => {
    if (isOpen) {
      soundService.playSonar();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      titleEn: "01 // COGNITIVE INTEGRATION // YARDSOFT AEGIS WELCOME",
      titleRu: "01 // КОГНИТИВНАЯ ИНТЕГРАЦИЯ // ДОБРО ПОЖАЛОВАТЬ",
      icon: Terminal,
      color: "border-primary/50 text-primary",
      glowColor: "rgba(34, 197, 94, 0.45)", // neon green
      descEn: "Initialize your uplink with YardSoft Aegis v2.4.1. This is a sovereign cyber-military real estate command center built on open-source web visualization stacks. Experience dark tactical style, raw performance, and institutional grade analytics.",
      descRu: "Инициализация защищенного подключения к YardSoft Aegis v2.4.1. Суверенный кибервоенный командный центр коммерческой недвижимости Москвы на открытом геопространственном стеке. Оцените эстетически тяжелый интерфейс и аналитику институционального уровня.",
      actionEn: "Switch to INVESTOR role",
      actionRu: "Активировать роль ИНВЕСТОРА",
      onAction: () => {
        onSetSimRole('investor');
        soundService.playSuccess();
      }
    },
    {
      titleEn: "02 // GEOSPATIAL ENGINE // 3D MAP & ROTATION CONTROL",
      titleRu: "02 // ГЕОПРОСТРАНСТВЕННОЕ ЯДРО // СЕТКА И 3D КАРТА",
      icon: Map,
      color: "border-cyan-500/50 text-cyan-400",
      glowColor: "rgba(6, 182, 212, 0.45)",
      descEn: "Move and tilt the tactical map of Presnenskaya Naberezhnaya (Moscow City) by dragging with left-click (pan) and right-click (rotate/pitch). Explore the CartoDB Dark Matter style, or switch to orbital imagery in the Layers panel.",
      descRu: "Управляйте наклоном и вращением 3D-карты бандла Москва-Сити с помощью мыши (Левая кнопка — сдвиг, Правая — наклон/поворот). Выберите тактическую тему Dark Matter или включите орбитальный спутник в панели Слоев.",
      actionEn: "Enable 3D Helicopter Flyover Tour",
      actionRu: "Запустить вертолетный облет 3D-здания",
      onAction: () => {
        // Find dummy or focus item and trigger flyover
        onSetIsFlyoverActive(true);
        soundService.playSuccess();
      }
    },
    {
      titleEn: "03 // RUSSIAN LEGAL DUE DILIGENCE MODULE",
      titleRu: "03 // МОДУЛЬ DUE DELIGENCE // ЗАКОНОДАТЕЛЬСТВО РФ",
      icon: ShieldAlert,
      color: "border-red-500/50 text-red-500",
      glowColor: "rgba(239, 68, 68, 0.45)",
      descEn: "Fully integrated parameters conforming to Federal Law No. 218-FZ on EGRN, land categories (Land Code, Art. 7), Permitted Use codes (VRI ROSREESTR P/0336), 384-FZ safety codes, and 123-FZ fire ratings. Click any building to analyze these constraints under the 'Legal' tab.",
      descRu: "Полное соответствие 218-ФЗ ЕГРН РФ. Интегрированы классификатор ВРИ Росреестра (Приказ П/0336), категории земель (ЗК РФ ст. 7), нормы огнестойкости (123-ФЗ) и классы энергоэффективности. Кликните по любому 3D-объекту и откройте вкладку 'Legal'.",
      actionEn: "Select Flagship Tower Alpha (ID 1)",
      actionRu: "Выбрать флагманскую башню Alpha (ID 1)",
      onAction: () => {
        onSetSelectedBuilding({
          id: 1,
          properties: {
            id: 1,
            name: "Flagship Tower Alpha",
            status: 1,
            cost: 150000000,
            yield: 1250000,
            roi: 10.0,
            height: 180,
            owner: "Global Capital Trust"
          }
        });
        soundService.playSuccess();
      }
    },
    {
      titleEn: "04 // STRATEGIC CABINET & STRESS SIMULATIONS",
      titleRu: "04 // СТРАТЕГИЧЕСКИЙ КАБИНЕТ И СТРЕСС-ТЕСТЫ",
      icon: LayoutDashboard,
      color: "border-amber-500/50 text-amber-500",
      glowColor: "rgba(245, 158, 11, 0.45)",
      descEn: "Press ROOT_CON or PORTFOLIO_CON in the header to access the ST_Cabinet dashboard. Visualize Aggregate AUM/NAV, configure investment syndicates with 10% platform fee models, and trigger stress scenarios like Central Bank interest rate shocks or vacancy spikes.",
      descRu: "Перейдите в кабинет инвестора ST_Cabinet через хедер. Оцените AUM/NAV вашего портфеля, запускайте инвестиционные пулы (синдикаты) и стресс-тесты под влиянием ставки ЦБ РФ или падения доходности аренды.",
      actionEn: "Toggle Cabinet Dashboard Open",
      actionRu: "Открыть терминал ST_Cabinet",
      onAction: () => {
        onToggleCabinet(true);
        soundService.playSuccess();
      }
    },
    {
      titleEn: "05 // SOVEREIGN ADMIN GEOSPATIAL CO-AXIS",
      titleRu: "05 // ГЕОДЕЗИЧЕСКИЙ КОНТУР РЕДАКТИРОВАНИЯ",
      icon: Target,
      color: "border-emerald-500/50 text-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.45)",
      descEn: "Authorized personnel can use the 'Polygon Design Pen' to trace custom land boundaries directly on the deck.gl interface. Draw points, compute areas automatically in sqm, and transition designs directly into EGRN legal database ingestion drafts.",
      descRu: "Авторизованные операторы системы могут использовать графическое перо для рисования контуров прямо поверх 3D-тайлов. Программа сама считает площадь в кв.м. и подготовит документы для пакетного экспорта/загрузки.",
      actionEn: "Elevate User Role to ADMIN",
      actionRu: "Повысить уровень доступа до ADMIN",
      onAction: () => {
        onSetSimRole('admin');
        soundService.playSuccess();
      }
    },
    {
      titleEn: "06 // COGNITIVE AGENT // LOCAL GEMINI API CO-PILOT",
      titleRu: "06 // КОГНИТИВНЫЙ ПОМОЩНИК // GEMINI API",
      icon: Sparkles,
      color: "border-purple-500/50 text-purple-400",
      glowColor: "rgba(168, 85, 247, 0.45)",
      descEn: "The military-grade bottom-right intelligence drawer uses Gemini models to analyze SWOT matrices, local competition profiles, and catchment areas. It writes structured Strategic Reports in Markdown so you're always aligned with market liquidity vectors.",
      descRu: "Интеллектуальный планшет в правом нижнем углу задействует ИИ для анализа SWOT-матрицы активов, плотности пешеходного трафика и зон обслуживания. Ассистент составляет полные меморандумы в Markdown для инвесткомитета.",
      actionEn: "Complete UI Tactical Tour",
      actionRu: "Завершить тактический тур",
      onAction: () => {
        onClose();
        soundService.playSuccess();
      }
    }
  ];

  const currentStep = steps[activeStep];
  const IconComponent = currentStep.icon;

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      if (useVoiceTick) soundService.playSonar();
      setActiveStep(prev => prev + 1);
    } else {
      soundService.playSuccess();
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      if (useVoiceTick) soundService.playSonar();
      setActiveStep(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="ui-tour-overlay"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`relative max-w-xl w-full bg-slate-950 border-2 ${currentStep.color} rounded-2xl overflow-hidden shadow-[0_0_35px_${currentStep.glowColor}]`}
        >
          {/* Neon scan lines */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-70 animate-[pulse_1.5s_infinite]" />

          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-slate-900/60 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                {language === 'ru' ? "СПРАВОЧНО-КОГНИТИВНЫЙ ЦЕНТР // HUD_TOUR" : "TUP_COGNITIVE_CENTER // HUD_TOUR"}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setUseVoiceTick(!useVoiceTick)}
                title="Toggle Beep Feedback"
                className={cn(
                  "p-1.5 rounded-lg border transition-all",
                  useVoiceTick ? "border-slate-800 text-primary" : "border-slate-900 text-slate-600"
                )}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-slate-950 border border-white/5 ${currentStep.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
                  {language === 'ru' ? currentStep.titleRu : currentStep.titleEn}
                </h4>
                <div className="h-0.5 w-16 bg-current opacity-60" />
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/50 p-4 border border-white/5 rounded-xl">
              {language === 'ru' ? currentStep.descRu : currentStep.descEn}
            </p>

            {/* Quick Interactive Actions */}
            <div className="space-y-2">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block">
                {language === 'ru' ? "КЛИКАБЕЛЬНАЯ СИМУЛЯЦИЯ // INTERACTIVE TRIGGER" : "INTERACTIVE MACRO TRIGGER"}
              </span>
              <button
                onClick={currentStep.onAction}
                className="w-full flex justify-between items-center bg-slate-900 hover:bg-slate-900/80 border border-white/10 hover:border-white/20 px-4 py-3 rounded-xl text-[10px] transition-all group font-bold font-mono tracking-wider active:scale-[0.99]"
              >
                <span className="text-slate-300 uppercase leading-none group-hover:text-white transition-all">
                  ⚡ {language === 'ru' ? currentStep.actionRu : currentStep.actionEn}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex justify-between items-center p-4 bg-slate-900/40 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">
                Step {activeStep + 1} of {steps.length}
              </span>
              <button
                onClick={onClose}
                className="text-[8px] text-slate-400 hover:text-white transition-all uppercase font-bold hover:underline cursor-pointer"
              >
                {language === 'ru' ? "⚡ Пропустить" : "⚡ Skip Tour"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={activeStep === 0}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 transition-all",
                  activeStep === 0 
                    ? "border-slate-950 text-slate-700 bg-transparent cursor-not-allowed" 
                    : "border-slate-800 text-slate-400 bg-slate-950 hover:text-white"
                )}
              >
                <ChevronLeft className="w-3 h-3" />
                {language === 'ru' ? "Назад" : "Back"}
              </button>
              
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-white text-slate-950 flex items-center gap-1.5 transition-all outline-none"
              >
                {activeStep === steps.length - 1 
                  ? (language === 'ru' ? "Готово" : "Finish") 
                  : (language === 'ru' ? "Далее" : "Next")}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Helper utility for conditional classes if not already imported or defined
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
