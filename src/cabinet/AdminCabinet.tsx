// src/cabinet/AdminCabinet.tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Users, Activity, FileText, Key, Database, 
  AlertTriangle, Server, Lock, Eye, Zap 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminCabinetProps {
  isOpen: boolean;
  onClose: () => void;
  totalUsers?: number;
  activeSessions?: number;
  systemLoad?: number;
  buildings?: any[];
  onTriggerDrawMode?: () => void;
  onTriggerCreateAsset?: () => void;
  onTriggerBulkImport?: () => void;
}

export const AdminCabinet = ({ 
  isOpen, 
  onClose, 
  totalUsers = 3840, 
  activeSessions = 142, 
  systemLoad = 67,
  buildings = [],
  onTriggerDrawMode,
  onTriggerCreateAsset,
  onTriggerBulkImport
}: AdminCabinetProps) => {
  const [activeModule, setActiveModule] = useState<'health' | 'users' | 'assets' | 'logs' | 'keys' | 'config'>('health');

  if (!isOpen) return null;

  const mockMetrics = [
    { name: '00:00', load: 34 }, 
    { name: '04:00', load: 21 },
    { name: '08:00', load: 67 }, 
    { name: '12:00', load: 89 },
    { name: '16:00', load: 95 }, 
    { name: '20:00', load: 42 }
  ];

  const modules = [
    { id: 'health', label: 'Platform Health', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'assets', label: 'Asset Registry', icon: Database },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'config', label: 'System Config', icon: Server }
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
          <Shield className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">
            Admin Console // Root Access
          </h2>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-64 border-r border-white/10 bg-[#050505] p-6 space-y-8 flex flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-3">
              System Modules
            </p>
            {modules.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                  activeModule === m.id 
                    ? "bg-primary text-black" 
                    : "text-slate-500 hover:bg-white/5 hover:text-white"
                }`}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3 h-3 text-red-400" />
              <p className="text-[8px] text-red-400 uppercase font-bold tracking-widest">
                Security Level
              </p>
            </div>
            <p className="text-xs font-bold text-white">ROOT_ACCESS</p>
            <p className="text-[7px] text-slate-500 mt-1">All systems unlocked</p>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#0a0a0a] space-y-8">
          {activeModule === 'health' && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Активные сессии', val: activeSessions, icon: Users, color: 'text-primary' },
                  { label: 'Нагрузка CPU', val: `${systemLoad}%`, icon: Activity, color: systemLoad > 80 ? 'text-red-400' : 'text-emerald-400' },
                  { label: 'Пользователей', val: totalUsers, icon: Users, color: 'text-secondary' },
                  { label: 'Ошибок (24ч)', val: 12, icon: AlertTriangle, color: 'text-amber-400' }
                ].map((m, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-2">{m.label}</p>
                    <p className={`text-2xl font-bold font-mono ${m.color}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              {/* System Load Chart */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-[10px] text-white uppercase tracking-widest mb-4">
                  Нагрузка Платформы (24ч)
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockMetrics}>
                      <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} />
                      <YAxis stroke="#ffffff20" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#000', 
                          border: '1px solid #333', 
                          fontSize: '10px' 
                        }} 
                      />
                      <Bar 
                        dataKey="load" 
                        fill="var(--primary-accent)" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Audit Log Preview */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-[10px] text-white uppercase tracking-widest mb-4">
                  Последние действия
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                  {[
                    { time: '14:22:01', action: 'ASSET_APPROVED', user: 'admin_01', ip: '192.168.1.10' },
                    { time: '14:18:44', action: 'USER_KYC_PASSED', user: 'user_882', ip: '10.0.0.55' },
                    { time: '14:05:12', action: 'EXPORT_GENERATED', user: 'investor_12', ip: '172.16.0.3' }
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded text-[8px] font-mono">
                      <span className="text-slate-500">{log.time}</span>
                      <span className="text-white font-bold">{log.action}</span>
                      <span className="text-primary/60">{log.user}</span>
                      <span className="text-slate-600">{log.ip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeModule === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                  User Management
                </h3>
                <button className="px-4 py-2 bg-primary text-black text-[9px] font-bold uppercase tracking-widest rounded hover:bg-primary/80 transition-all">
                  + Add User
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">User ID</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Email</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Role</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">KYC Status</th>
                      <th className="p-4 text-[8px] font-mono text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { id: 'user_882', email: 'investor@example.com', role: 'investor', kyc: 'VERIFIED' },
                      { id: 'user_445', email: 'demo@example.com', role: 'demo', kyc: 'PENDING' },
                      { id: 'admin_01', email: 'admin@yardsoft.ru', role: 'admin', kyc: 'VERIFIED' }
                    ].map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-[10px] text-white font-mono">{user.id}</td>
                        <td className="p-4 text-[10px] text-slate-400">{user.email}</td>
                        <td className="p-4">
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 uppercase">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                            user.kyc === 'VERIFIED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {user.kyc}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button className="p-1 hover:bg-white/10 rounded transition-colors">
                            <Eye className="w-3 h-3 text-slate-500" />
                          </button>
                          <button className="p-1 hover:bg-white/10 rounded transition-colors">
                            <Zap className="w-3 h-3 text-primary" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeModule === 'logs' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                Black Box Recorder // Audit Trail
              </h3>
              <div className="space-y-2">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded text-[8px] font-mono">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">2026-05-22 14:{(15 - i).toString().padStart(2, '0')}:22</span>
                      <span className="text-white font-bold">ACCESS_GRANTED</span>
                      <span className="text-slate-400">IP: 192.168.1.{100 + i}</span>
                    </div>
                    <span className="text-primary/40">NODE_{774 + i}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeModule === 'keys' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                API Key Management
              </h3>
              <div className="space-y-4">
                {[
                  { name: 'Gemini_AI_Uplink', expires: '12 days', status: 'ACTIVE' },
                  { name: 'Cadastral_Proxy', expires: '45 days', status: 'ACTIVE' },
                  { name: 'Payment_Gateway', expires: '89 days', status: 'ACTIVE' }
                ].map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-bold">{key.name}</span>
                      <span className="text-[7px] text-slate-500">Expires in {key.expires}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[8px] text-emerald-400 uppercase font-bold">{key.status}</span>
                      <button className="text-[8px] text-red-400 uppercase font-bold hover:text-red-300">
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 border border-dashed border-primary/30 rounded text-[9px] text-primary uppercase font-bold hover:bg-primary/5 transition-all">
                  + Generate New API Key
                </button>
              </div>
            </div>
          )}

          {activeModule === 'assets' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-4 h-4 text-red-500 animate-pulse" />
                    Asset Registry // Palantir Foundry
                  </h3>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                    Centralized Real Estate Asset Control Panel
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      onTriggerDrawMode?.();
                    }}
                    className="px-4 py-2 border border-red-500/30 bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    ✦ Draw Contour
                  </button>
                  <button
                    onClick={onTriggerCreateAsset}
                    className="px-4 py-2 bg-red-400 text-black text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    + Forge Asset
                  </button>
                  <button
                    onClick={onTriggerBulkImport}
                    className="px-4 py-2 border border-white/10 bg-white/5 text-slate-300 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    📦 Bulk Import
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Total Assets Registered</p>
                  <p className="text-xl font-bold text-white">{(buildings || []).length} Objects</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Book Capitalization</p>
                  <p className="text-xl font-bold text-red-400">
                    ₽{((buildings || []).reduce((sum, b) => sum + (b.properties?.cost || 0), 0)).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Forecast Recurring Yield</p>
                  <p className="text-xl font-bold text-emerald-400">
                    ₽{((buildings || []).reduce((sum, b) => sum + (b.properties?.yield || 0), 0)).toLocaleString()}/мес
                  </p>
                </div>
              </div>

              {/* Table List of Buildings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead className="bg-[#000000]/80 border-b border-white/10 sticky top-0">
                      <tr>
                        <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest font-bold">ID</th>
                        <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest font-bold">Cost (Cap)</th>
                        <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest font-bold">Gross Yield</th>
                        <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest font-bold">ROI Factor</th>
                        <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest font-bold">Height</th>
                        <th className="p-4 text-[8px] text-slate-500 uppercase tracking-widest font-bold">Owner ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {(buildings || []).map((b, i) => {
                        const p = b.properties || {};
                        return (
                          <tr key={`asset_${p.id || i}`} className="hover:bg-white/5 transition-colors font-mono font-bold">
                            <td className="p-4 font-mono font-bold text-white">ASSET_{p.id}</td>
                            <td className="p-4 text-red-400 font-bold">₽{p.cost?.toLocaleString() || 'N/A'}</td>
                            <td className="p-4 text-emerald-400 font-bold">₽{p.yield?.toLocaleString() || 'N/A'}/мес</td>
                            <td className="p-4"><span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">{p.roi || '10'}%</span></td>
                            <td className="p-4 font-mono text-slate-400">{p.height}m</td>
                            <td className="p-4 truncate max-w-[120px] font-mono text-slate-500">{p.owner || 'System Reserve'}</td>
                          </tr>
                        );
                      })}
                      {(buildings || []).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                            No registry items located. Run "Forge" to ingest.
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
      </div>
    </motion.div>
  );
};
