// src/admin/AdminAssetCreator.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Sparkles, MapPin, Upload, Target, AlertTriangle,
  DollarSign, TrendingUp, Shield, Database, CheckCircle2, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { soundService } from '../services/soundService';
import { RF_LAND_CATEGORIES, RF_LAND_CATEGORY_LABELS } from '../types/rf-legal/landCategories';
import { RF_VRI_CODES, RF_VRI_LABELS } from '../types/rf-legal/vri';
import { RF_FIRE_RESISTANCE, RF_ENERGY_CLASSES } from '../types/rf-legal/commercialClass';
import { RF_ENCUMBRANCES, RF_ENCUMBRANCE_LABELS } from '../types/rf-legal/encumbrances';
import { validateCadastralNumber, extractRegion } from '../types/rf-legal/RFRealEstate';

interface AdminAssetCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: any) => void;
  initialCoordinates?: [number, number];
  initialPolygon?: number[][][];
  user: any;
}

export const AdminAssetCreator = ({
  isOpen,
  onClose,
  onSubmit,
  initialCoordinates,
  initialPolygon,
  user
}: AdminAssetCreatorProps) => {
  const [step, setStep] = useState<'basic' | 'geospatial' | 'financial' | 'legal' | 'ai' | 'review'>('basic');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [asset, setAsset] = useState({
    title: '',
    type: 'office',
    model: 'office',
    address: '',
    description: '',
    latitude: initialCoordinates?.[1] || 55.7558,
    longitude: initialCoordinates?.[0] || 37.6173,
    polygon: initialPolygon || null,
    cost: 50000000,
    yield: 450000,
    roi: 10.8,
    sqft: 25000,
    yearBuilt: new Date().getFullYear() - 5,
    parkingSpaces: 45,
    height: 35,
    levels: 10,
    // Legal & Cadastral
    cadastreNumber: '',
    legalPurity: 100,
    encumbrances: 'None',
    owner: '',
    landCategory: '003002000000',
    vri: '4.1',
    commercialClass: 'A',
    energyClass: 'A',
    fireResistance: 'II',
    ownershipType: 'private',
    encumbrancesList: [] as string[],
    depreciation: 10,
    // AI Generated
    swot: null as any,
    marketContext: '',
    tenantMix: [] as string[],
    // Status
    status: 1
  });

  // Keep coordinates updated if initial coordinates exist
  useEffect(() => {
    if (initialCoordinates) {
      setAsset(prev => ({
        ...prev,
        longitude: initialCoordinates[0],
        latitude: initialCoordinates[1]
      }));
    }
  }, [initialCoordinates]);

  // Keep polygon updated if drawn
  useEffect(() => {
    if (initialPolygon) {
      // Pick first vertex of first contour as general lat/lng if not already populated
      const firstContour = initialPolygon[0] || [];
      const firstVertex = firstContour[0] || [];
      const lng = firstVertex[0];
      const lat = firstVertex[1];
      
      setAsset(prev => ({
        ...prev,
        polygon: initialPolygon,
        ...(lng && lat ? { longitude: lng, latitude: lat } : {})
      }));
    }
  }, [initialPolygon]);

  // AI Auto-Fill via Server-Side endpoint
  const handleAiAutoFill = async () => {
    if (!asset.address.trim()) {
      setValidationErrors({ address: 'Введите адрес для AI-анализа' });
      return;
    }

    setIsAiGenerating(true);
    soundService.playSonar();

    try {
      // 1. Resolve coordinates from Nominatim Geocoding API (client-side)
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(asset.address)}&limit=1`
        );
        const geoData = await geoRes.json();
        if (geoData && geoData[0]) {
          setAsset(prev => ({
            ...prev,
            latitude: parseFloat(geoData[0].lat),
            longitude: parseFloat(geoData[0].lon)
          }));
        }
      } catch (geoErr) {
        console.warn('Geocoding query failed, keeping original coords', geoErr);
      }

      // 2. Fetch SWOT & market intelligence from our secure backend proxy route
      const aiResponse = await fetch('/api/v1/admin/ai-auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: asset.address })
      });

      if (!aiResponse.ok) {
        throw new Error('Server AI call returned non-200 state');
      }

      const parsed = await aiResponse.json();
      setAsset(prev => ({
        ...prev,
        type: parsed.suggestedType || prev.type,
        model: parsed.suggestedModel || prev.model,
        cost: parsed.estimatedCost || prev.cost,
        yield: parsed.estimatedYield || prev.yield,
        roi: parsed.estimatedROI || prev.roi,
        sqft: parsed.sqft || prev.sqft,
        yearBuilt: parsed.yearBuilt || prev.yearBuilt,
        height: parsed.height || prev.height,
        levels: parsed.levels || prev.levels,
        parkingSpaces: parsed.parkingSpaces || prev.parkingSpaces,
        description: parsed.description || prev.description,
        marketContext: parsed.marketContext || '',
        tenantMix: parsed.tenantMix || [],
        swot: parsed.swot || null
      }));

      soundService.playSuccess();
      setStep('ai'); // Switch to AI Intel tab to inspect SWOT analysis!
    } catch (err) {
      console.error('AI Auto-Fill request failed:', err);
      setValidationErrors({ ai: 'Не удалось получить AI аналитику: сервер не отвечает.' });
      soundService.playDenied();
    } finally {
      setIsAiGenerating(false);
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!asset.title.trim()) errors.title = 'Название обязательно';
    if (!asset.address.trim()) errors.address = 'Адрес обязателен';
    if (asset.cost <= 0) errors.cost = 'Стоимость должна быть больше нуля';
    if (asset.yield <= 0) errors.yield = 'Месячный доход должен быть больше нуля';
    if (!asset.latitude || !asset.longitude) errors.geometry = 'Географические координаты обязательны';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    // Auto-calculate exact ROI
    const calculatedRoi = asset.cost > 0 ? (asset.yield * 12 / asset.cost) * 100 : 0;
    const finalAsset = { 
      ...asset, 
      roi: parseFloat(calculatedRoi.toFixed(2)),
      // If no custom polygon, make a simple 30mx30m box around the resolved lat/lng to extrude properly on Map
      polygon: asset.polygon || [
        [
          [asset.longitude - 0.0002, asset.latitude - 0.0002],
          [asset.longitude + 0.0002, asset.latitude - 0.0002],
          [asset.longitude + 0.0002, asset.latitude + 0.0002],
          [asset.longitude - 0.0002, asset.latitude + 0.0002],
          [asset.longitude - 0.0002, asset.latitude - 0.0002]
        ]
      ]
    };
    
    onSubmit(finalAsset);
    soundService.playSuccess();
    onClose();
  };

  const steps = [
    { id: 'basic', label: 'Basic', icon: Building2 },
    { id: 'geospatial', label: 'Geo', icon: MapPin },
    { id: 'financial', label: 'Finance', icon: DollarSign },
    { id: 'legal', label: 'Legal', icon: Shield },
    { id: 'ai', label: 'AI Intel', icon: Sparkles },
    { id: 'review', label: 'Review', icon: CheckCircle2 }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 font-mono pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-5xl h-[85vh] bg-[#0c0c0c] rounded-3xl border border-red-500/20 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                  Admin Asset Forge
                </h2>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                  Strategic Object Creation Protocol
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex flex-wrap items-center gap-1 mt-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPast = steps.findIndex(x => x.id === step) > i;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setStep(s.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer",
                      isActive && "bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.3)]",
                      isPast && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                      !isActive && !isPast && "bg-white/5 text-slate-500 hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {s.label}
                  </button>
                  {i < steps.length - 1 && <div className="w-4 h-px bg-white/10" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* STEP: BASIC */}
          {step === 'basic' && (
            <div className="space-y-4 max-w-3xl mx-auto text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Asset Title *
                </label>
                <input
                  type="text"
                  value={asset.title}
                  onChange={(e) => setAsset(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-red-500/50 outline-none"
                  placeholder="Neo-Center Tower Alpha..."
                />
                {validationErrors.title && (
                  <p className="text-[9px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />{validationErrors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Asset Type
                  </label>
                  <select
                    value={asset.type}
                    onChange={(e) => setAsset(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none cursor-pointer"
                  >
                    <option value="office">Office</option>
                    <option value="retail">Retail</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="residential">Residential</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    3D Model / Height Style
                  </label>
                  <select
                    value={asset.model}
                    onChange={(e) => setAsset(p => ({ ...p, model: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none cursor-pointer"
                  >
                    <option value="office">Office Tower</option>
                    <option value="apartment">Apartment Block</option>
                    <option value="warehouse">Warehouse Loft</option>
                    <option value="house">Detached House</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Address *
                  </label>
                  <button
                    onClick={handleAiAutoFill}
                    disabled={isAiGenerating}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer",
                      isAiGenerating
                        ? "bg-red-500/10 text-red-400 animate-pulse"
                        : "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                    )}
                  >
                    {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isAiGenerating ? 'AI Analysis Live...' : 'AI Auto-Fill'}
                  </button>
                </div>
                <input
                  type="text"
                  value={asset.address}
                  onChange={(e) => setAsset(p => ({ ...p, address: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-red-500/50 outline-none"
                  placeholder="Москва, Пресненская наб. 12..."
                />
                {validationErrors.address && (
                  <p className="text-[9px] text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />{validationErrors.address}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  value={asset.description}
                  onChange={(e) => setAsset(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-red-500/50 outline-none resize-none"
                  placeholder="Стратегический многофункциональный комплекс..."
                />
              </div>
            </div>
          )}

          {/* STEP: GEOSPATIAL */}
          {step === 'geospatial' && (
            <div className="space-y-4 max-w-3xl mx-auto text-xs">
              <p className="text-[10px] text-slate-400 leading-normal bg-white/5 border border-white/5 p-3 rounded-xl">
                <MapPin className="w-3.5 h-3.5 inline text-red-500 mr-2" />
                Вы можете настроить точные географические координаты маркера или прикрепить полигон, нарисованный с помощью Geospatial-редактора на карте.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Широта (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={asset.latitude}
                    onChange={(e) => setAsset(p => ({ ...p, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Долгота (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={asset.longitude}
                    onChange={(e) => setAsset(p => ({ ...p, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-500">Geospatial Polygon State</p>
                {asset.polygon ? (
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400">✓ Нарисованный полигон прикреплён</span>
                    <button 
                      onClick={() => setAsset(p => ({ ...p, polygon: null }))} 
                      className="text-[9px] text-red-400 uppercase hover:underline"
                    >
                      Сбросить контур
                    </button>
                  </div>
                ) : (
                  <span className="text-amber-400 text-[10px]">Координаты будут использованы для рендеринга стандартного контура 30м-квадрат. Используйте редактор на карте для рисования точных 3D-экструзии.</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase">Высота 3D (meters)</label>
                  <input
                    type="number"
                    value={asset.height}
                    onChange={(e) => setAsset(p => ({ ...p, height: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase">Этажность (Levels)</label>
                  <input
                    type="number"
                    value={asset.levels}
                    onChange={(e) => setAsset(p => ({ ...p, levels: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase">Parking Slots</label>
                  <input
                    type="number"
                    value={asset.parkingSpaces}
                    onChange={(e) => setAsset(p => ({ ...p, parkingSpaces: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: FINANCIAL */}
          {step === 'financial' && (
            <div className="space-y-4 max-w-3xl mx-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-red-500" />Стоимость (₽) *
                  </label>
                  <input
                    type="number"
                    value={asset.cost || ''}
                    onChange={(e) => setAsset(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />Месячный Доход (₽) *
                  </label>
                  <input
                    type="number"
                    value={asset.yield || ''}
                    onChange={(e) => setAsset(p => ({ ...p, yield: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">Calculated gross ROI</p>
                  <p className="text-2xl font-bold text-red-400">
                    {asset.cost > 0 ? ((asset.yield * 12 / asset.cost) * 100).toFixed(2) : '0.00'}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase">Calculated net ROI (with 10% Platform Fee)</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {asset.cost > 0 ? ((asset.yield * 0.9 * 12 / asset.cost) * 100).toFixed(2) : '0.00'}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase">Площадь здания кв.м (Area SqFt)</label>
                  <input
                    type="number"
                    value={asset.sqft || ''}
                    onChange={(e) => setAsset(p => ({ ...p, sqft: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase">Год капитальной постройки</label>
                  <input
                    type="number"
                    value={asset.yearBuilt}
                    onChange={(e) => setAsset(p => ({ ...p, yearBuilt: parseInt(e.target.value) || 2015 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: LEGAL */}
          {step === 'legal' && (
            <div className="space-y-4 max-w-4xl mx-auto text-xs font-mono">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-[10px]">
                  <Shield className="w-4 h-4 text-red-500" />
                  Государственный кадастровый учет (ЕГРН РФ)
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Кадастровый номер</label>
                    <input
                      type="text"
                      value={asset.cadastreNumber}
                      onChange={(e) => setAsset(p => ({ ...p, cadastreNumber: e.target.value }))}
                      className={cn(
                        "w-full bg-slate-950 border rounded-xl p-3 text-white font-mono font-bold tracking-widest outline-none transition-all",
                        asset.cadastreNumber === '' ? "border-slate-800 focus:border-red-500/50" :
                        validateCadastralNumber(asset.cadastreNumber) ? "border-emerald-500/50 focus:border-emerald-500" : "border-amber-500/50 focus:border-amber-500"
                      )}
                      placeholder="77:01:0001001:4432"
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest">ФЗ № 218 от 13.07.2015</span>
                      {asset.cadastreNumber && (
                        <span className={cn(
                          "text-[8px] font-bold uppercase",
                          validateCadastralNumber(asset.cadastreNumber) ? "text-emerald-400" : "text-amber-400"
                        )}>
                          {validateCadastralNumber(asset.cadastreNumber) 
                            ? `Регион: ${extractRegion(asset.cadastreNumber) ?? 'РФ'} // Валиден` 
                            : 'Неверный формат ЕГРН'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Номинальный Собственник (Правообладатель)</label>
                    <input
                      type="text"
                      value={asset.owner}
                      onChange={(e) => setAsset(p => ({ ...p, owner: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl p-3 text-white font-mono font-bold"
                      placeholder="ООО 'ЯрдСофт Капитал'"
                    />
                    <span className="text-[8px] text-slate-500 uppercase block px-1">Реестр прав ЕГРН</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Форма собственности</label>
                    <select
                      value={asset.ownershipType}
                      onChange={(e) => setAsset(p => ({ ...p, ownershipType: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500/50 rounded-xl p-3 text-white cursor-pointer font-bold"
                    >
                      <option value="private">Частная собственность (Физ/Юрлица)</option>
                      <option value="state">Государственная собственность</option>
                      <option value="municipal">Муниципальная собственность</option>
                      <option value="federal">Федеральное имущество</option>
                    </select>
                    <span className="text-[8px] text-slate-500 uppercase block px-1">ГК РФ ст. 212-215</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Категория и ВРИ земли */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Земельные параметры (ЗК РФ ст. 7)
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Категория земель (ЗК РФ ст. 7)</label>
                      <select
                        value={asset.landCategory}
                        onChange={(e) => setAsset(p => ({ ...p, landCategory: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer"
                      >
                        {Object.entries(RF_LAND_CATEGORIES).map(([key, val]) => (
                          <option key={key} value={val}>
                            {RF_LAND_CATEGORY_LABELS[val] || val}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Вид разрешённого использования (ВРИ Росреестр)</label>
                      <select
                        value={asset.vri}
                        onChange={(e) => setAsset(p => ({ ...p, vri: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer"
                      >
                        {Object.entries(RF_VRI_LABELS).map(([code, label]) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <span className="text-[8px] text-yellow-500 uppercase block px-1">
                        * Классификатор (Приказ Росреестра № П/0336 от 20.07.2022)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Технические и Энергоэффективные параметры */}
                <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Технические паспорта (384-ФЗ / РГУД)
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Класс объекта (РГУД)</label>
                      <select
                        value={asset.commercialClass}
                        onChange={(e) => setAsset(p => ({ ...p, commercialClass: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer font-bold"
                      >
                        <option value="A+">Класс A+ (Premium)</option>
                        <option value="A">Класс A (Elite)</option>
                        <option value="B+">Класс B+ (Standard Plus)</option>
                        <option value="B">Класс B (Standard)</option>
                        <option value="C">Класс C (Substandard)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Пожаростойкость (123-ФЗ)</label>
                      <select
                        value={asset.fireResistance}
                        onChange={(e) => setAsset(p => ({ ...p, fireResistance: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer"
                      >
                        {Object.entries(RF_FIRE_RESISTANCE).map(([k, v]) => (
                          <option key={k} value={v}>Степень {v}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Энергоэффективность</label>
                      <select
                        value={asset.energyClass}
                        onChange={(e) => setAsset(p => ({ ...p, energyClass: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white cursor-pointer"
                      >
                        {Object.entries(RF_ENERGY_CLASSES).map(([k, v]) => (
                          <option key={k} value={v}>Класс {v} ({k === 'E' ? 'Запрещен с 2025' : 'Приказ 399/пр'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500">Физический износ (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={asset.depreciation}
                        onChange={(e) => setAsset(p => ({ ...p, depreciation: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-center font-bold"
                      />
                    </div>
                  </div>
                  {asset.depreciation > 65 && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1 text-[8px] text-red-400 font-bold animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      ⚠️ ИЗНОС &gt;65% // ЛИМИТ ПП РФ №47: РИСК АВАРИЙНОГО СТАТУСА (СНОС)
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Purity Range */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Показатель юридической чистоты / Legal Purity Index</label>
                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={asset.legalPurity}
                    onChange={(e) => setAsset(p => ({ ...p, legalPurity: parseInt(e.target.value) }))}
                    className="flex-1 accent-red-500 cursor-pointer"
                  />
                  <span className={cn(
                    "text-lg font-bold w-12 text-right",
                    asset.legalPurity > 80 ? "text-emerald-400" :
                    asset.legalPurity > 50 ? "text-amber-400" : "text-red-400"
                  )}>
                    {asset.legalPurity}%
                  </span>
                </div>
              </div>

              {/* Обременения (Due Diligence Checklist) */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Экспресс Due Diligence // Обременения и Ограничения (Идентификатор ЕГРН / ИСОГД)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(RF_ENCUMBRANCES).map(([key, val]) => {
                    const isChecked = asset.encumbrancesList?.includes(val);
                    const isDanger = ['arrest', 'heritage', 'sanitary', 'red_lines'].includes(val);
                    return (
                      <label 
                        key={key} 
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-[9px] transition-all cursor-pointer select-none",
                          isChecked 
                            ? isDanger 
                              ? "bg-red-500/10 border-red-500/35 text-red-200" 
                              : "bg-amber-500/10 border-amber-500/35 text-amber-200" 
                            : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...(asset.encumbrancesList || []), val]
                              : (asset.encumbrancesList || []).filter((x: string) => x !== val);
                            
                            // Adjust legal purity index automatically based on encumbrances!
                            let penalty = 0;
                            updated.forEach(item => {
                              if (['arrest', 'heritage'].includes(item)) penalty += 35;
                              else if (['sanitary', 'red_lines'].includes(item)) penalty += 20;
                              else penalty += 10;
                            });
                            const calculatedPurity = Math.max(0, 100 - penalty);
                            
                            setAsset(p => ({ 
                              ...p, 
                              encumbrancesList: updated, 
                              legalPurity: calculatedPurity,
                              encumbrances: updated.length > 0 ? updated[0] : 'None'
                            }));
                          }}
                          className="rounded text-red-500 focus:ring-red-500/50 bg-slate-950 border-slate-800"
                        />
                        <span className="truncate leading-none">{RF_ENCUMBRANCE_LABELS[val] || val}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP: AI INTEL */}
          {step === 'ai' && (
            <div className="space-y-4 max-w-3xl mx-auto text-xs">
              {asset.swot ? (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> AI SWOT Advantages
                    </h4>
                    <ul className="space-y-1 list-disc list-inside text-slate-300">
                      {asset.swot.advantages?.map((adv: string, i: number) => (
                        <li key={i} className="leading-relaxed">{adv}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-red-400 uppercase mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> AI SWOT Risks
                    </h4>
                    <ul className="space-y-1 list-disc list-inside text-slate-300">
                      {asset.swot.risks?.map((risk: string, i: number) => (
                        <li key={i} className="leading-relaxed">{risk}</li>
                      ))}
                    </ul>
                  </div>

                  {asset.marketContext && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <h4 className="text-[10px] font-bold text-white uppercase mb-2">Market & Local Context</h4>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{asset.marketContext}</p>
                    </div>
                  )}

                  {asset.tenantMix && asset.tenantMix.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-[9px] text-slate-500 uppercase pt-1">Predictive Tenant Mix:</span>
                      {asset.tenantMix.map((t, idx) => (
                        <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md px-2 py-0.5 text-[9px] font-bold">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <Sparkles className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
                  <p className="text-slate-500 text-[11px]">
                    Введите точный адрес на шаге "Basic" и кликните "AI Auto-Fill" для автоматической генерации SWOT-карты и рыночного анализа.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP: REVIEW */}
          {step === 'review' && (
            <div className="space-y-4 max-w-3xl mx-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Название Актива', value: asset.title },
                  { label: 'Тип', value: asset.type.toUpperCase() },
                  { label: 'Адрес', value: asset.address },
                  { label: 'Стоимость (Cap)', value: `₽${asset.cost.toLocaleString()}` },
                  { label: 'Доходность (Yield)', value: `₽${asset.yield.toLocaleString()}/мес` },
                  { label: 'Прогноз ROI', value: `${asset.cost > 0 ? ((asset.yield * 12 / asset.cost) * 100).toFixed(2) : 0}%` },
                  { label: 'Кадастровый номер', value: asset.cadastreNumber || '77:01_UNKNOWN_LEGAL' },
                  { label: 'Площадь / SQFT', value: `${asset.sqft?.toLocaleString()} m²` }
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-[8px] text-slate-500 uppercase mb-1">{item.label}</p>
                    <p className="text-xs font-bold text-white truncate">{item.value || 'N/A'}</p>
                  </div>
                ))}
              </div>

              {Object.keys(validationErrors).length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                  <p className="text-[9px] text-red-400 font-bold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Validation Block Alert
                  </p>
                  <ul className="space-y-0.5 text-[9px] text-slate-400 list-disc list-inside">
                    {Object.values(validationErrors).map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-between">
          <button
            onClick={() => {
              const currentIdx = steps.findIndex(s => s.id === step);
              if (currentIdx > 0) setStep(steps[currentIdx - 1].id as any);
            }}
            disabled={step === 'basic'}
            className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all disabled:opacity-30 cursor-pointer cursor-allowed"
          >
            ← Back
          </button>

          <div className="flex gap-3">
            {step !== 'review' ? (
              <button
                onClick={() => {
                  const currentIdx = steps.findIndex(s => s.id === step);
                  if (currentIdx < steps.length - 1) setStep(steps[currentIdx + 1].id as any);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all cursor-pointer"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-red-500 text-black font-bold uppercase tracking-widest hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
              >
                <Target className="w-4 h-4 inline mr-2" />
                Deploy Asset
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
