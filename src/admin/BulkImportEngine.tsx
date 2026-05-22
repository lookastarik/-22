// src/admin/BulkImportEngine.tsx
import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Upload, FileJson, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { soundService } from '../services/soundService';
import { cn } from '../lib/utils';

interface BulkImportEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (assets: any[]) => void;
}

export const BulkImportEngine = ({ isOpen, onClose, onImport }: BulkImportEngineProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [conflictResolution, setConflictResolution] = useState<'skip' | 'overwrite' | 'merge'>('skip');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setErrors([]);
    setPreview([]);
    soundService.playSonar();

    try {
      let parsed: any[] = [];

      if (uploadedFile.name.endsWith('.json') || uploadedFile.name.endsWith('.geojson')) {
        // GeoJSON parsing
        const text = await uploadedFile.text();
        const geojson = JSON.parse(text);
        if (geojson.type === 'FeatureCollection' && geojson.features) {
          parsed = geojson.features.map((f: any, idx: number) => {
            const props = f.properties || {};
            const geometry = f.geometry || {};
            
            // Extract coordinates or polygon
            let polygon = null;
            let latitude = props.latitude || 55.7558;
            let longitude = props.longitude || 37.6173;

            if (geometry.type === 'Polygon') {
              polygon = geometry.coordinates;
              // Extrapolate center vertex
              const firstRing = polygon[0] || [];
              if (firstRing.length > 0) {
                const centerLng = firstRing.reduce((sum: number, p: any) => sum + p[0], 0) / firstRing.length;
                const centerLat = firstRing.reduce((sum: number, p: any) => sum + p[1], 0) / firstRing.length;
                longitude = centerLng;
                latitude = centerLat;
              }
            } else if (geometry.type === 'Point') {
              longitude = geometry.coordinates[0];
              latitude = geometry.coordinates[1];
            }

            return {
              title: props.title || `Asset_OSM_${f.id || idx}`,
              type: props.type || 'office',
              model: props.model || 'office',
              address: props.address || `OSM Geo Location ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`,
              description: props.description || 'Импортированный геопространственный актив.',
              cost: Number(props.cost || 75000000),
              yield: Number(props.yield || 600000),
              sqft: Number(props.sqft || props.area || 18000),
              yearBuilt: Number(props.yearBuilt || props.year || 2016),
              height: Number(props.height || 25),
              levels: Number(props.levels || 6),
              polygon: polygon,
              latitude: latitude,
              longitude: longitude,
              cadastreNumber: props.cadastre || `77:01:${Math.floor(100000 + Math.random() * 900000)}`,
              legalPurity: Number(props.legalPurity || 100),
              encumbrances: props.encumbrances || 'None',
              owner: props.owner || 'ООО ЯрдСофт Резерв'
            };
          });
        } else {
          throw new Error("Invalid GeoJSON format. Missing FeatureCollection skeleton.");
        }
      } else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.csv')) {
        // XLSX/CSV parsing using array buffers
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        
        parsed = rows.map((row: any, idx: number) => {
          const lat = parseFloat(row.latitude || row.Latitude || row.Широта || 55.7558);
          const lng = parseFloat(row.longitude || row.Longitude || row.Долгота || 37.6173);
          const cost = parseFloat(row.cost || row.Cost || row.Стоимость || 60000000);
          const monthlyYield = parseFloat(row.yield || row.Yield || row.Доход || 500000);

          return {
            title: row.title || row.Title || row.Название || `Batch_Asset_${idx + 1}`,
            type: row.type || row.Type || 'office',
            model: row.model || row.Model || 'office',
            address: row.address || row.Address || row.Адрес || `Координаты: ${lat}, ${lng}`,
            description: row.description || row.Description || 'Массово импортированный реестровый объект.',
            cost,
            yield: monthlyYield,
            latitude: lat,
            longitude: lng,
            sqft: parseFloat(row.sqft || row.Area || 15000),
            yearBuilt: parseInt(row.yearBuilt || row.Year || 2014),
            height: parseInt(row.height || 15),
            levels: parseInt(row.levels || 4),
            cadastreNumber: row.cadastre || `77:01:${Math.floor(100000 + Math.random() * 900000)}`,
            legalPurity: parseInt(row.legalPurity || 95),
            encumbrances: row.encumbrances || 'None',
            owner: row.owner || 'ООО Пул Инвест'
          };
        });
      } else {
        throw new Error("Неподдерживаемый тип файла. Загрузите .json, .geojson, .xlsx или .csv");
      }

      // Check validation
      const validationErrors: string[] = [];
      if (parsed.length === 0) {
        validationErrors.push("Файл не содержит валидных записей");
      }
      parsed.forEach((asset, idx) => {
        if (!asset.title) validationErrors.push(`Строка ${idx + 1}: Пропущено название объекта`);
        if (asset.cost <= 0) validationErrors.push(`Строка ${idx + 1}: Неподходящая стоимость (${asset.cost} руб.)`);
        if (asset.yield <= 0) validationErrors.push(`Строка ${idx + 1}: Неподходящая доходность`);
      });

      setErrors(validationErrors);
      setPreview(parsed);
      soundService.playSuccess();
    } catch (err: any) {
      setErrors([`Ошибка парсинга: ${err?.message || 'Unknown structure'}`]);
      soundService.playDenied();
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleImport = () => {
    if (errors.length > 0) {
      soundService.playDenied();
      return;
    }
    
    onImport(preview);
    soundService.playSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 font-mono pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-4xl h-[80vh] bg-[#0c0c0c] rounded-3xl border border-red-500/20 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                  Bulk Import Engine
                </h2>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                  GeoJSON / CSV / XLSX Mass Ingestion Protocol
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
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Zone */}
          <label className="block">
            <input
              type="file"
              accept=".json,.geojson,.csv,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="border border-dashed border-red-500/20 rounded-2xl p-8 text-center hover:border-red-500/40 hover:bg-red-500/5 transition-all cursor-pointer">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-3" />
              ) : (
                <>
                  <div className="flex justify-center gap-4 mb-3">
                    <FileJson className="w-8 h-8 text-red-500/55" />
                    <FileSpreadsheet className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-white font-bold uppercase text-xs mb-1">
                    {file ? file.name : 'Выбрать Файл Данных'}
                  </p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                    Поддерживаются: GeoJSON, CSV, XLSX • Макс 10,000 записей
                  </p>
                </>
              )}
            </div>
          </label>

          {/* Errors list */}
          {errors.length > 0 && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1 max-h-32 overflow-y-auto">
              <p className="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Ошибки Верификации ({errors.length})
              </p>
              {errors.map((err, i) => (
                <p key={i} className="text-[9px] text-slate-400 font-mono">• {err}</p>
              ))}
            </div>
          )}

          {/* Preview grid */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Предпросмотр структуры ({preview.length} строк)
                </h3>
                <div className="flex gap-2">
                  {(['skip', 'overwrite', 'merge'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setConflictResolution(mode)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[8px] font-bold uppercase cursor-pointer",
                        conflictResolution === mode
                          ? "bg-red-500 text-black shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                          : "bg-white/5 text-slate-500 hover:bg-white/10"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-white/5 rounded-xl overflow-hidden bg-black/40">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-[9px] font-mono border-collapse">
                    <thead className="bg-white/5 border-b border-white/5 sticky top-0">
                      <tr>
                        <th className="p-2 text-slate-500 uppercase">#</th>
                        <th className="p-2 text-slate-500 uppercase">Название</th>
                        <th className="p-2 text-slate-500 uppercase">Тип</th>
                        <th className="p-2 text-slate-500 uppercase">Стоимость</th>
                        <th className="p-2 text-slate-500 uppercase">Доход/мес</th>
                        <th className="p-2 text-slate-500 uppercase">Локация</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {preview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-2 text-slate-500">{i + 1}</td>
                          <td className="p-2 text-white font-bold truncate max-w-[150px]">{row.title}</td>
                          <td className="p-2 text-slate-400 uppercase">{row.type}</td>
                          <td className="p-2 text-red-400">₽{row.cost?.toLocaleString()}</td>
                          <td className="p-2 text-emerald-400">₽{row.yield?.toLocaleString()}</td>
                          <td className="p-2 text-slate-500">{row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}</td>
                        </tr>
                      ))}
                      {preview.length > 10 && (
                        <tr>
                          <td colSpan={6} className="p-2 text-center text-slate-500 text-[8px] bg-white/5 uppercase font-bold">
                            ... И ЕЩЕ {preview.length - 10} ОБЪЕКТОВ УСПЕШНО ОЦИФРОВАНО ...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || errors.length > 0}
            className="px-6 py-2.5 rounded-xl bg-red-500 text-black font-bold uppercase tracking-widest hover:bg-red-400 disabled:opacity-30 shadow-[0_0_20px_rgba(239,68,68,0.3)] cursor-pointer"
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Ingest {preview.length} Assets
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
