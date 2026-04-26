import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  MapPin, 
  DollarSign, 
  Tag, 
  Brain, 
  Loader2, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';

interface AssetRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (asset: any) => void;
}

const ASSET_TYPES = [
  'Commercial',
  'Industrial',
  'Residential',
  'Infrastructure',
  'Cyber-Hub',
  'Strategic-Node'
];

export const AssetRegistrationModal = ({ isOpen, onClose, onRegister }: AssetRegistrationModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    cost: '',
    address: '',
    lat: '',
    lng: ''
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ type: string; model: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Identity required';
    if (!formData.type) newErrors.type = 'Classification required';
    if (!formData.cost || isNaN(Number(formData.cost))) newErrors.cost = 'Valid credit values required';
    if (!formData.address) newErrors.address = 'Geospatial vector required';
    if (!formData.lat || isNaN(Number(formData.lat))) newErrors.lat = 'Lat coord invalid';
    if (!formData.lng || isNaN(Number(formData.lng))) newErrors.lng = 'Lng coord invalid';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const suggestWithAi = async () => {
    if (!formData.title || !formData.address) {
      setErrors({ ...errors, ai: 'Title and Address required for AI analysis' });
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze asset: "${formData.title}" at "${formData.address}". Suggest a classification from [Commercial, Industrial, Residential, Infrastructure, Cyber-Hub, Strategic-Node] and specific model.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Category (Commercial, Industrial, etc.)" },
              model: { type: Type.STRING, description: "Detailed sub-type or model description" }
            },
            required: ["type", "model"]
          }
        }
      });

      const suggestion = JSON.parse(response.text || '{}');
      setAiSuggestion(suggestion);
      setFormData(prev => ({ ...prev, type: suggestion.type || prev.type }));
    } catch (error) {
      console.error('AI Suggestion Error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onRegister({
        ...formData,
        cost: Number(formData.cost),
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        id: `ASSET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'Active',
        timestamp: new Date().toISOString()
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-primary/20"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">New Asset Registration</h2>
                  <p className="text-[10px] font-mono text-primary uppercase tracking-[0.2em] opacity-70">Protocol Alpha-7_Security_Layer</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Identity & Classification */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 ml-1">Asset Identity</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="e.g. Neo-Tokyo Server Hub"
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all",
                        errors.title && "border-red-500/50 bg-red-500/5"
                      )}
                      value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  {errors.title && <p className="text-[10px] text-red-500 ml-1">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 ml-1">Classification Type</label>
                  <select 
                    className={cn(
                      "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all appearance-none",
                      errors.type && "border-red-500/50 bg-red-500/5"
                    )}
                    value={formData.type}
                    onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                  >
                    <option value="" className="bg-slate-900">Select Classification</option>
                    {ASSET_TYPES.map(t => (
                      <option key={t} value={t} className="bg-slate-900">{t}</option>
                    ))}
                  </select>
                  {errors.type && <p className="text-[10px] text-red-500 ml-1">{errors.type}</p>}
                </div>
              </div>

              {/* Economic & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 ml-1">Valuation (Credits)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="number" 
                      placeholder="1,250,000"
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all",
                        errors.cost && "border-red-500/50 bg-red-500/5"
                      )}
                      value={formData.cost}
                      onChange={e => setFormData(p => ({ ...p, cost: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 ml-1">Strategic Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Sector 7G, Core City"
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-all",
                        errors.address && "border-red-500/50 bg-red-500/5"
                      )}
                      value={formData.address}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Geospatial Coordinates</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Latitude"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-700"
                      value={formData.lat}
                      onChange={e => setFormData(p => ({ ...p, lat: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Longitude"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-700"
                      value={formData.lng}
                      onChange={e => setFormData(p => ({ ...p, lng: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* AI Logic Suggestion */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={suggestWithAi}
                  disabled={isAiLoading || !formData.title || !formData.address}
                  className="w-full h-12 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center gap-3 text-primary font-bold uppercase text-xs hover:bg-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                >
                  {isAiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  )}
                  <span>{isAiLoading ? 'Analyzing Strategic Data...' : 'Suggest Classification with AI'}</span>
                  
                  {/* Subtle scan animation */}
                  <motion.div 
                    animate={isAiLoading ? { top: ['0%', '100%', '0%'] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-primary/50 blur-sm pointer-events-none"
                  />
                </button>
                {errors.ai && <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.ai}</p>}
                
                <AnimatePresence>
                  {aiSuggestion && !isAiLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3"
                    >
                      <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <div className="flex flex-col">
                        <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">AI Recommendation Verified</p>
                        <p className="text-xs text-white leading-relaxed">
                          The neural net identifies this as <span className="text-emerald-400 font-bold">{aiSuggestion.type}</span>. 
                          Operational Model: <span className="text-emerald-400">{aiSuggestion.model}</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 h-12 border border-white/10 rounded-2xl text-slate-400 text-xs font-bold uppercase hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-[2] h-12 bg-primary rounded-2xl text-white text-xs font-bold uppercase hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Register Asset
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
