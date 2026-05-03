import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download, TrendingUp, Briefcase, CalendarDays,
  RefreshCw, ArrowUpRight, FileSpreadsheet, Target,
  CheckCircle2, XCircle, Clock, Layers,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import { API_ENDPOINTS } from '../constants/apiConstants';
import { STORAGE_KEYS, LEAD_STATUSES, PROJECT_STATUSES } from '../constants/appConstants';
import { formatRupiah, formatDate } from '../utils/formatUtils';
import { PageLoader } from '../components/UIComponents';

const STATUS_CONFIG = {
  new:       { color: '#0ea5e9', bg: '#e0f2fe', icon: Layers },
  contacted: { color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  qualified: { color: '#3b82f6', bg: '#dbeafe', icon: Target },
  converted: { color: '#22c55e', bg: '#dcfce7', icon: CheckCircle2 },
  lost:      { color: '#f43f5e', bg: '#ffe4e6', icon: XCircle },
};

const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const FunnelBar = ({ label, count, total, color, bg, Icon, delay }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >

      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={14} style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-700">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{count}</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ color, background: bg }}
            >
              {pct}%
            </span>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

const KpiTile = ({ label, value, sub, icon: Icon, accentBg, accentText, accentBar, delay }) => (
  <motion.div
    className="card p-4 relative overflow-hidden"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
    whileHover={{ y: -2 }}
  >

    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar}`} />
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-base sm:text-2xl font-bold break-words ${accentText}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBg}`}>
        <Icon size={18} className={accentText} />
      </div>
    </div>
  </motion.div>
);

const ProjectRow = ({ proj, rank, idx }) => {
  const rankColors = ['bg-amber-400', 'bg-slate-300', 'bg-orange-400'];
  const rankBg = rank <= 3 ? rankColors[rank - 1] : 'bg-slate-100';
  const rankText = rank <= 3 ? 'text-white' : 'text-slate-500';

  return (
    <motion.div
      className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 group"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 + idx * 0.05 }}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${rankBg} ${rankText}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{proj.project_name}</p>
        <p className="text-[11px] text-slate-400">{proj.sales_name} · {formatDate(proj.created_at)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-bold text-emerald-600">{formatRupiah(proj.total_value)}</p>
      </div>
    </motion.div>
  );
};

const ReportsPage = () => {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);

  const { data: reportData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-summary', startDate, endDate],
    queryFn: async () => {
      const res = await apiService.get(
        `/reports/summary?startDate=${startDate}&endDate=${endDate}`
      );
      return res.data.data;
    },
  });

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(
        `${API_ENDPOINTS.REPORTS.EXPORT}?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Export gagal');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SmartCRM_${startDate}_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Laporan berhasil didownload!');
    } catch {
      toast.error('Gagal mengexport laporan.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <PageLoader />;

  const totalLeads = reportData?.leadsByStatus?.reduce((a, s) => a + parseInt(s.count), 0) || 0;
  const convertedCount = reportData?.leadsByStatus?.find(s => s.status === 'converted')?.count || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;

  const funnelData = (reportData?.leadsByStatus || []).map(s => ({
    status: s.status,
    label: LEAD_STATUSES[s.status]?.label || s.status,
    count: parseInt(s.count),
    ...(STATUS_CONFIG[s.status] || { color: '#94a3b8', bg: '#f1f5f9', icon: Layers }),
  }));

  const rankedProjects = [...(reportData?.projects || [])].sort(
    (a, b) => Number(b.total_value) - Number(a.total_value)
  );

  const areaData = funnelData.map(f => ({ name: f.label, lead: f.count }));

  const formatPeriod = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-5">

      <motion.div
        className="flex items-center justify-between gap-3 flex-wrap mb-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm">
            <TrendingUp size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-sky-500 uppercase tracking-widest mb-0.5">Analitik</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Penjualan</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {formatPeriod(startDate)} — {formatPeriod(endDate)}
            </p>
          </div>
        </div>
        <motion.button
          className="btn-amber flex-shrink-0"
          onClick={handleExportExcel}
          disabled={isExporting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <FileSpreadsheet size={15} />
          {isExporting ? 'Mengexport...' : 'Export Excel'}
        </motion.button>
      </motion.div>

      <motion.div
        className="card p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="label">Dari</label>
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input pl-10 w-full"
                max={endDate}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="label">Sampai</label>
            <div className="relative">
              <CalendarDays size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input pl-10 w-full"
                min={startDate}
                max={today}
              />
            </div>
          </div>
          <motion.button
            className="btn-secondary sm:flex-shrink-0 justify-center"
            onClick={() => refetch()}
            disabled={isFetching}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Memuat...' : 'Terapkan'}
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile
          label="Total Revenue"
          value={formatRupiah(reportData?.totalRevenue || 0)}
          sub="Periode ini"
          icon={TrendingUp}
          accentBg="bg-emerald-50"
          accentText="text-emerald-600"
          accentBar="bg-emerald-400"
          delay={0.1}
        />
        <KpiTile
          label="Proyek Deal"
          value={reportData?.totalApprovedProjects || 0}
          sub="Disetujui"
          icon={Briefcase}
          accentBg="bg-sky-50"
          accentText="text-sky-600"
          accentBar="bg-sky-400"
          delay={0.15}
        />
        <KpiTile
          label="Total Lead"
          value={totalLeads}
          sub="Semua status"
          icon={Layers}
          accentBg="bg-blue-50"
          accentText="text-blue-600"
          accentBar="bg-blue-400"
          delay={0.18}
        />
        <KpiTile
          label="Conversion Rate"
          value={`${conversionRate}%`}
          sub={`${convertedCount} dari ${totalLeads} lead`}
          icon={ArrowUpRight}
          accentBg="bg-violet-50"
          accentText="text-violet-600"
          accentBar="bg-violet-400"
          delay={0.21}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        <motion.div
          className="card p-5 lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">Funnel Konversi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tahapan pipeline lead ISP</p>
          </div>
          {funnelData.length > 0 ? (
            <div className="space-y-4">
              {funnelData.map((f, i) => (
                <FunnelBar
                  key={f.status}
                  label={f.label}
                  count={f.count}
                  total={totalLeads}
                  color={f.color}
                  bg={f.bg}
                  Icon={f.icon}
                  delay={0.3 + i * 0.07}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
              <Target size={32} />
              <p className="text-sm mt-2 text-slate-400">Belum ada data lead</p>
            </div>
          )}
        </motion.div>

        <motion.div
          className="card p-5 lg:col-span-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Volume per Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Komposisi lead saat ini</p>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">
              {totalLeads} total
            </span>
          </div>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={areaData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Inter, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Inter, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<AreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="lead"
                  name="Lead"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fill="url(#leadGrad)"
                  dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm text-slate-400">Belum ada data</p>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        className="card p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Ranking Proyek Disetujui</h3>
            <p className="text-xs text-slate-400 mt-0.5">Diurutkan berdasarkan nilai tertinggi</p>
          </div>
          {rankedProjects.length > 0 && (
            <span className="text-xs font-semibold text-slate-400">
              {rankedProjects.length} proyek
            </span>
          )}
        </div>

        {rankedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-300">
            <Briefcase size={28} />
            <p className="text-sm mt-2 text-slate-400">Tidak ada proyek di periode ini</p>
          </div>
        ) : (
          <>

            {rankedProjects.length >= 3 && (
              <div className="hidden sm:grid grid-cols-3 gap-3 mb-5">
                {[1, 0, 2].map((rankIdx) => {
                  const proj = rankedProjects[rankIdx];
                  const rank = rankIdx + 1;
                  const configs = [
                    { h: 'h-16', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', label: '🥇 #1' },
                    { h: 'h-24', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', label: '🏆 #2 → #1' },
                    { h: 'h-10', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', label: '🥉 #3' },
                  ];

                  const podiumOrder = [1, 0, 2]; 
                  const displayRank = podiumOrder[rankIdx] + 1;
                  const realProj = rankedProjects[podiumOrder[rankIdx]];
                  const podiumLabels = ['🥈 2nd', '🥇 1st', '🥉 3rd'];
                  const podiumBgs = ['bg-slate-50 border-slate-200', 'bg-amber-50 border-amber-200', 'bg-orange-50 border-orange-200'];
                  const podiumTexts = ['text-slate-600', 'text-amber-600', 'text-orange-600'];
                  const podiumH = ['h-20', 'h-28', 'h-16'];
                  return (
                    <motion.div
                      key={displayRank}
                      className={`${podiumBgs[rankIdx]} border rounded-2xl p-3 flex flex-col items-center text-center ${podiumH[rankIdx]} justify-end pb-3`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + rankIdx * 0.08 }}
                    >
                      <p className={`text-xs font-bold ${podiumTexts[rankIdx]} mb-1`}>{podiumLabels[rankIdx]}</p>
                      <p className="text-[11px] font-semibold text-slate-700 truncate w-full">{realProj.project_name}</p>
                      <p className="text-xs font-bold text-emerald-600">{formatRupiah(realProj.total_value)}</p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto scrollbar-hide">
              {rankedProjects.map((proj, idx) => (
                <ProjectRow key={proj.id} proj={proj} rank={idx + 1} idx={idx} />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {reportData?.totalRevenue > 0 && (
        <motion.div
          className="bg-sky-500 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div>
            <p className="text-sky-100 text-xs font-semibold uppercase tracking-widest">Total Revenue Periode Ini</p>
            <p className="text-white text-xl sm:text-3xl font-bold mt-1 tracking-tight break-words">
              {formatRupiah(reportData.totalRevenue)}
            </p>
            <p className="text-sky-200 text-xs mt-1">
              Dari {reportData.totalApprovedProjects} proyek · Conversion rate {conversionRate}%
            </p>
          </div>
          <motion.button
            className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 flex-shrink-0 backdrop-blur-sm"
            onClick={handleExportExcel}
            disabled={isExporting}
            whileTap={{ scale: 0.97 }}
          >
            <Download size={15} />
            Download Laporan
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsPage;
