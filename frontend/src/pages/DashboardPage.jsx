/**
 * @file DashboardPage.jsx
 * @description Full CRM dashboard — KPI, pipeline kanban, recent leads,
 * customer MRR, lead distribution donut, dan quick actions.
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, TrendingUp, Clock, CheckCircle2,
  ArrowRight, Wifi, Plus, UserCheck, BarChart2,
  Phone, Mail, Circle, Package,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import apiService from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, formatDate } from '../utils/formatUtils';
import { PageLoader, Badge } from '../components/UIComponents';
import { LEAD_STATUSES, PROJECT_STATUSES } from '../constants/appConstants';

const manIconUrl = new URL('../assets/icons/bussiness-man.png', import.meta.url).href;
const womanIconUrl = new URL('../assets/icons/businesswoman.png', import.meta.url).href;

/* ─── Konstanta ─────────────────────────────────────────────────────────────── */
const STATUS_COLORS = {
  new:       '#0ea5e9',
  contacted: '#f59e0b',
  qualified: '#3b82f6',
  converted: '#22c55e',
  lost:      '#f43f5e',
};

const PIPELINE_CONFIG = {
  draft:            { icon: Circle,       bg: 'bg-slate-50',  text: 'text-slate-500',  border: 'border-slate-200' },
  waiting_approval: { icon: Clock,        bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200' },
  approved:         { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  rejected:         { icon: BarChart2,    bg: 'bg-red-50',    text: 'text-red-500',    border: 'border-red-200' },
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

/* ─── Sub-components ─────────────────────────────────────────────────────────── */
const MetricCard = ({ label, value, icon: Icon, iconBg, iconColor, accentClass, sub }) => (
  <motion.div
    className="card p-4 relative overflow-hidden"
    whileHover={{ y: -2 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accentClass}`} />
    <div className="flex items-start justify-between pl-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-1.5 truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800">{d.name}</p>
      <p className="text-slate-500 mt-0.5">
        <span className="font-bold text-slate-900">{d.value}</span> lead · {d.payload.percent}%
      </p>
    </div>
  );
};

/* ─── Main ───────────────────────────────────────────────────────────────────── */
const DashboardPage = () => {
  const { authUser, isManager } = useAuth();
  const navigate = useNavigate();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['dashboard-report'],
    queryFn: async () => (await apiService.get('/reports/summary')).data.data,
  });

  const { data: pendingProjects = [] } = useQuery({
    queryKey: ['projects-pending'],
    queryFn: async () => (await apiService.get('/projects?status=waiting_approval')).data.data,
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects-all-dash'],
    queryFn: async () => (await apiService.get('/projects')).data.data,
  });

  const { data: recentLeads = [] } = useQuery({
    queryKey: ['leads-recent'],
    queryFn: async () => (await apiService.get('/leads')).data.data,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-dash'],
    queryFn: async () => (await apiService.get('/customers')).data.data,
  });

  if (isLoading) return <PageLoader />;

  /* derived */
  const totalLeads = reportData?.leadsByStatus?.reduce((a, s) => a + parseInt(s.count), 0) || 0;
  const pieData = (reportData?.leadsByStatus || []).map(s => {
    const pct = totalLeads > 0 ? Math.round((parseInt(s.count) / totalLeads) * 100) : 0;
    return {
      name: LEAD_STATUSES[s.status]?.label || s.status,
      status: s.status,
      value: parseInt(s.count),
      percent: pct,
      color: STATUS_COLORS[s.status] || '#94a3b8',
    };
  });

  const monthlyMRR = customers.reduce((sum, c) => sum + Number(c.monthly_value || 0), 0);
  const convRate = totalLeads > 0
    ? Math.round(((reportData?.leadsByStatus?.find(s => s.status === 'converted')?.count || 0) / totalLeads) * 100)
    : 0;

  // Pipeline counts per status
  const pipelineCounts = Object.keys(PIPELINE_CONFIG).reduce((acc, key) => {
    acc[key] = allProjects.filter(p => p.status === key).length;
    return acc;
  }, {});

  const kpis = [
    { label: 'Total Revenue', value: formatRupiah(reportData?.totalRevenue || 0), icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', accentClass: 'bg-emerald-500', sub: 'Akumulasi' },
    { label: 'MRR Customer', value: formatRupiah(monthlyMRR), icon: UserCheck, iconBg: 'bg-sky-50', iconColor: 'text-sky-600', accentClass: 'bg-sky-500', sub: `${customers.length} customer aktif` },
    { label: 'Menunggu Approval', value: pendingProjects.length, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', accentClass: 'bg-amber-400', sub: pendingProjects.length > 0 ? 'Perlu ditindaklanjuti' : 'Semua clear' },
    { label: 'Conversion Rate', value: `${convRate}%`, icon: BarChart2, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', accentClass: 'bg-violet-400', sub: `dari ${totalLeads} lead` },
  ];

  const quickActions = [
    { label: 'Tambah Lead', icon: Plus, color: 'bg-sky-500 hover:bg-sky-600', path: '/leads' },
    { label: 'Buat Project', icon: Briefcase, color: 'bg-emerald-500 hover:bg-emerald-600', path: '/projects' },
    { label: 'Lihat Customer', icon: UserCheck, color: 'bg-violet-500 hover:bg-violet-600', path: '/customers' },
    { label: 'Lihat Laporan', icon: BarChart2, color: 'bg-amber-500 hover:bg-amber-600', path: '/reports' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <motion.div className="flex items-center justify-between flex-wrap gap-3"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <p className="text-[11px] font-bold text-sky-500 uppercase tracking-widest mb-0.5">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-slate-900">{authUser?.fullName} 👋</h1>
          <p className="text-sm text-slate-400 mt-0.5">Ringkasan CRM Smart ISP hari ini</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">Live</span>
          <div className="w-px h-4 bg-slate-200" />
          <Wifi size={13} className="text-sky-500" />
          <span className="text-xs text-slate-400">Smart ISP CRM</span>
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        {quickActions.map((a, i) => (
          <motion.button
            key={a.label}
            onClick={() => navigate(a.path)}
            className={`${a.color} text-white rounded-2xl p-3.5 flex items-center gap-2.5 text-sm font-semibold transition-all duration-200 shadow-sm`}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <a.icon size={15} />
            </div>
            <span className="truncate">{a.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}>
            <MetricCard {...k} />
          </motion.div>
        ))}
      </div>

      {/* ── Pipeline Kanban Summary ── */}
      <motion.div className="card p-5"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Pipeline Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribusi project berdasarkan tahapan</p>
          </div>
          <button onClick={() => navigate('/projects')}
            className="text-xs text-sky-600 font-semibold flex items-center gap-1 hover:text-sky-700 transition-colors">
            Lihat semua <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(PIPELINE_CONFIG).map(([status, cfg], i) => {
            const Icon = cfg.icon;
            const count = pipelineCounts[status] || 0;
            return (
              <motion.div key={status}
                className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 flex flex-col gap-2`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.33 + i * 0.06 }}
                whileHover={{ y: -1 }}>
                <div className="flex items-center justify-between">
                  <Icon size={16} className={cfg.text} />
                  <span className={`text-2xl font-bold ${cfg.text}`}>{count}</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-600 leading-tight">
                  {PROJECT_STATUSES[status]?.label}
                </p>
                <div className="h-1 bg-white/60 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${cfg.text.replace('text-', 'bg-')}`}
                    initial={{ width: 0 }}
                    animate={{ width: allProjects.length > 0 ? `${Math.round((count / allProjects.length) * 100)}%` : '0%' }}
                    transition={{ duration: 0.7, delay: 0.5 + i * 0.06 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Bottom Row: Donut + Recent Leads + Recent Customers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Lead Donut */}
        <motion.div className="card p-5"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Distribusi Lead</h3>
              <p className="text-xs text-slate-400 mt-0.5">{totalLeads} total</p>
            </div>
            <button onClick={() => navigate('/leads')}
              className="text-xs text-sky-600 font-semibold flex items-center gap-1 hover:text-sky-700">
              Kelola <ArrowRight size={12} />
            </button>
          </div>
          {pieData.length > 0 ? (
            <>
              <div className="w-full h-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                      dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
                      fill="#0f172a" fontSize={18} fontWeight={700}>{totalLeads}</text>
                    <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle"
                      fill="#94a3b8" fontSize={10}>Lead</text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.status} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-slate-600 flex-1">{d.name}</span>
                    <span className="text-xs font-bold text-slate-800">{d.value}</span>
                    <span className="text-[10px] text-slate-400 w-7 text-right">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-36 flex items-center justify-center">
              <p className="text-sm text-slate-400">Belum ada lead</p>
            </div>
          )}
        </motion.div>

        {/* Recent Leads */}
        <motion.div className="card p-5"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lead Terbaru</h3>
              <p className="text-xs text-slate-400 mt-0.5">5 paling baru</p>
            </div>
            <button onClick={() => navigate('/leads')}
              className="text-xs text-sky-600 font-semibold flex items-center gap-1 hover:text-sky-700">
              Semua <ArrowRight size={12} />
            </button>
          </div>
          {recentLeads.length > 0 ? (
            <div className="space-y-1">
              {recentLeads.slice(0, 5).map((lead, i) => (
                <motion.div key={lead.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 p-1">
                    <img 
                      src={lead.gender === 'wanita' ? womanIconUrl : manIconUrl} 
                      alt="avatar" 
                      className="w-full h-full object-contain drop-shadow-sm" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{lead.full_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {lead.phone && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Phone size={9}/>{lead.phone}</span>}
                    </div>
                  </div>
                  <Badge
                    label={LEAD_STATUSES[lead.status]?.label}
                    color={LEAD_STATUSES[lead.status]?.color}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Users size={24} className="text-slate-200" />
              <p className="text-xs text-slate-400">Belum ada lead</p>
            </div>
          )}
        </motion.div>

        {/* Active Customers + Pending projects */}
        <motion.div className="card p-5 flex flex-col gap-4"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>

          {/* Customer MRR mini */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Customer Aktif</h3>
                <p className="text-xs text-slate-400 mt-0.5">MRR bulan ini</p>
              </div>
              <button onClick={() => navigate('/customers')}
                className="text-xs text-sky-600 font-semibold flex items-center gap-1 hover:text-sky-700">
                Lihat <ArrowRight size={12} />
              </button>
            </div>
            {customers.slice(0, 3).map((c, i) => (
              <motion.div key={c.id}
                className="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-0"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}>
                <div className="w-7 h-7 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 p-0.5">
                  <img 
                    src={c.gender === 'wanita' ? womanIconUrl : manIconUrl} 
                    alt="avatar" 
                    className="w-full h-full object-contain drop-shadow-sm" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{c.full_name}</p>
                  <p className="text-[11px] text-slate-400">{c.service_count} layanan</p>
                </div>
                <p className="text-xs font-bold text-emerald-600">{formatRupiah(c.monthly_value)}</p>
              </motion.div>
            ))}
            {customers.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Belum ada customer</p>
            )}
          </div>

          {/* Pending approval alert */}
          {pendingProjects.length > 0 && (
            <motion.div
              className="mt-auto p-3 bg-amber-50 border border-amber-100 rounded-xl"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={13} className="text-amber-500" />
                <p className="text-xs font-bold text-amber-700">Butuh Review</p>
              </div>
              {pendingProjects.slice(0, 2).map(p => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <p className="text-[11px] text-amber-800 font-medium truncate flex-1">{p.project_name}</p>
                  <p className="text-[11px] font-bold text-amber-700 flex-shrink-0 ml-2">{formatRupiah(p.total_value)}</p>
                </div>
              ))}
              {pendingProjects.length > 2 && (
                <button onClick={() => navigate('/projects')}
                  className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                  +{pendingProjects.length - 2} lainnya <ArrowRight size={10} />
                </button>
              )}
            </motion.div>
          )}

          {/* Approved projects mini */}
          {reportData?.projects?.length > 0 && pendingProjects.length === 0 && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-700">Deal Terbaru</p>
                <button onClick={() => navigate('/projects')}
                  className="text-xs text-sky-600 font-semibold hover:text-sky-700">Semua</button>
              </div>
              {reportData.projects.slice(0, 3).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 bg-emerald-50 rounded flex items-center justify-center flex-shrink-0">
                      <Briefcase size={10} className="text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-700 truncate">{p.project_name}</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 flex-shrink-0 ml-2">{formatRupiah(p.total_value)}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;
