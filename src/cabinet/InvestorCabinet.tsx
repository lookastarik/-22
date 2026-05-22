// src/cabinet/InvestorCabinet.tsx
import { motion } from 'motion/react';
import { 
  Briefcase, Wallet, TrendingUp, Maximize, MapPin, 
  ExternalLink, BarChart3, AlertCircle, Eye, Shield, Landmark
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface InvestorCabinetProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  portfolioValue: number;
  portfolio: any[]; // Detailed portfolio features
  onSelectAsset: (asset: any) => void;
  t: any;
}

export const InvestorCabinet = ({ 
  isOpen, 
  onClose, 
  balance, 
  portfolioValue, 
  portfolio = [], 
  onSelectAsset,
  t 
}: InvestorCabinetProps) => {
  if (!isOpen) return null;

  // Calculate yield sums
  const totalYield = portfolio.reduce((acc, curr) => {
    const properties = curr.properties || {};
    return acc + (properties.yield || 0);
  }, 0);

  // Platform fee (10% as requested by the original specification)
  const platformFee = totalYield * 0.10;
  const netYield = totalYield - platformFee;

  // Mock forecast metrics for Recharts
  const projectionData = [
    { month: 'Jun', income: netYield },
    { month: 'Jul', income: netYield * 1.05 },
    { month: 'Aug', income: netYield * 1.08 },
    { month: 'Sep', income: netYield * 1.15 },
    { month: 'Oct', income: netYield * 1.25 },
    { month: 'Nov', income: netYield * 1.30 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-xl flex flex-col font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
            Investor Desk // Strategic Investment Console
          </h2>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Core Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-2">Liquid Cash (Treasury)</p>
            <p className="text-2xl font-bold text-secondary font-mono">${balance.toLocaleString()}</p>
            <p className="text-[7px] text-slate-500 mt-1 uppercase">Ready for immediate allocation</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-2">Total Managed Assets Value</p>
            <p className="text-2xl font-bold text-primary font-mono">${portfolioValue.toLocaleString()}</p>
            <p className="text-[7px] text-slate-500 mt-1 uppercase">{portfolio.length} Strategic properties acquired</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden group">
            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-2">Platform Fee (10%)</p>
            <p className="text-2xl font-bold text-amber-500 font-mono">${platformFee.toLocaleString()}</p>
            <p className="text-[7px] text-slate-500 mt-1 uppercase">Palantir Brokerage Service charge</p>
          </div>

          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[8px] text-emerald-500 uppercase tracking-widest font-bold mb-2">Net Monthly Yield</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">+${netYield.toLocaleString()}</p>
            <p className="text-[7px] text-emerald-500 mt-1 uppercase">Net of platform service charges</p>
          </div>
        </div>

        {/* Assets & Visual Projections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Building Registry */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-primary" />
                Asset Registry ({portfolio.length})
              </h3>
            </div>

            {portfolio.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">No active positions</p>
                <p className="text-[8px] text-slate-500 uppercase">Deploy capital on 3D map interface to begin.</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-wider">Asset ID</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-wider">Market Value</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-wider">Yield / Mo</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-wider">Cap rate</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase tracking-wider">Interventions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {portfolio.map((asset, i) => {
                      const properties = asset.properties || {};
                      const cost = properties.cost || 0;
                      const yld = properties.yield || 0;
                      const capRate = cost > 0 ? ((yld * 12) / cost) * 100 : 0;
                      return (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="text-[10px] text-white font-mono uppercase font-bold">NODE_{asset.id}</span>
                          </td>
                          <td className="p-4 text-[10px] text-slate-300 font-mono">${cost.toLocaleString()}</td>
                          <td className="p-4 text-[10px] text-secondary font-mono">+${yld.toLocaleString()}</td>
                          <td className="p-4 text-[10px] text-emerald-400 font-mono">{capRate.toFixed(2)}%</td>
                          <td className="p-4">
                            <button 
                              onClick={() => {
                                onSelectAsset(asset);
                                onClose();
                              }}
                              className="px-2 py-1 bg-primary/10 text-primary border border-primary/30 text-[8px] rounded uppercase font-bold tracking-wider hover:bg-primary hover:text-black transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Revenue Forecast Visualizer */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-secondary" />
              6-Month Revenue Projection
            </h3>

            <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
              <p className="text-[8px] text-slate-500 uppercase tracking-widest leading-relaxed">
                Compound projection based on current strategic acquisitions and rental growth target rates.
              </p>

              <div className="h-48 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData}>
                    <XAxis dataKey="month" stroke="#ffffff20" fontSize={10} />
                    <YAxis stroke="#ffffff20" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#000', 
                        border: '1px solid #333', 
                        fontSize: '9px',
                        fontFamily: 'monospace'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="var(--secondary-accent)" 
                      strokeWidth={2}
                      activeDot={{ r: 4 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex justify-between text-[8px] text-slate-400 font-mono uppercase">
                  <span>Gross annual run rate:</span>
                  <span className="text-white font-bold">${(totalYield * 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[8px] text-slate-400 font-mono uppercase">
                  <span>Net annual run rate:</span>
                  <span className="text-emerald-400 font-bold">${(netYield * 12).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
