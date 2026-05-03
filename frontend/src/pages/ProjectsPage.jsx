/**
 * @file ProjectsPage.jsx
 * @description Deal pipeline management. Fully responsive — mobile card layout.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, CheckCircle, XCircle, AlertCircle,
  ChevronDown, Briefcase, Clock, Filter, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import { PROJECT_STATUSES } from '../constants/appConstants';
import { formatRupiah, formatDate } from '../utils/formatUtils';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge, PageLoader, EmptyState, FormGroup } from '../components/UIComponents';

const customerIconUrl = new URL('../assets/icons/customer.png', import.meta.url).href;

// ─── Project Form ──────────────────────────────────────────────────────────────
const ProjectForm = ({ onSubmit, isLoading }) => {
  const [projectName, setProjectName] = useState('');
  const [leadId, setLeadId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, negotiatedPrice: '' }]);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-for-project'],
    queryFn: async () => (await apiService.get('/leads?status=new')).data.data,
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await apiService.get('/products')).data.data,
  });

  const addItem = () => setItems((p) => [...p, { productId: '', quantity: 1, negotiatedPrice: '' }]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) =>
    setItems((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  const getSellingPrice = (productId) =>
    products.find((p) => p.id === parseInt(productId))?.selling_price;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      projectName,
      leadId: parseInt(leadId),
      notes,
      items: items.map((i) => ({ ...i, productId: parseInt(i.productId) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormGroup label="Nama Project" required>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="input"
          placeholder="Deal dengan PT. ABC"
          required
        />
      </FormGroup>
      {/* Stack on mobile, 2-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Lead" required>
          <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="input" required>
            <option value="">-- Pilih Lead --</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Catatan">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder="Catatan tambahan..."
          />
        </FormGroup>
      </div>

      {/* Product items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Produk / Layanan *</label>
          <button
            type="button"
            onClick={addItem}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
          >
            <Plus size={12} /> Tambah Produk
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => {
            const sellingPrice = getSellingPrice(item.productId);
            const isBelow =
              item.negotiatedPrice && sellingPrice &&
              Number(item.negotiatedPrice) < Number(sellingPrice);
            return (
              <motion.div
                key={i}
                className="p-3 border border-slate-200 rounded-xl space-y-2 bg-slate-50/60"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Produk full width */}
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(i, 'productId', e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({formatRupiah(p.selling_price)})
                    </option>
                  ))}
                </select>
                {/* Qty + harga nego side by side */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" min="1" value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    className="input" placeholder="Qty"
                  />
                  <input
                    type="number" min="0" value={item.negotiatedPrice}
                    onChange={(e) => updateItem(i, 'negotiatedPrice', e.target.value)}
                    className={`input ${isBelow ? 'border-amber-400 bg-amber-50 focus:ring-amber-400/30' : ''}`}
                    placeholder="Harga nego (Rp)" required
                  />
                </div>
                {isBelow && (
                  <p className="text-xs text-amber-700 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Di bawah harga jual ({formatRupiah(sellingPrice)}) — perlu approval
                  </p>
                )}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Hapus baris ini
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <motion.button type="submit" className="btn-primary" disabled={isLoading} whileTap={{ scale: 0.97 }}>
          {isLoading ? 'Menyimpan...' : 'Buat Project'}
        </motion.button>
      </div>
    </form>
  );
};

// ─── Approval Modal ────────────────────────────────────────────────────────────
const ApprovalModal = ({ project, onClose }) => {
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: ({ action, rejectionReason }) =>
      apiService.patch(`/projects/${project.id}/approve`, { action, rejectionReason }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['projects']);
      toast.success(vars.action === 'approve' ? 'Project disetujui!' : 'Project ditolak.');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal.'),
  });

  return (
    <Modal isOpen={!!project} onClose={onClose} title="Review Project" size="md">
      <div className="space-y-4">
        <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
          <p className="font-bold text-slate-900 text-sm">{project?.project_name}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            Lead: {project?.lead_name} · Sales: {project?.sales_name}
          </p>
          <p className="text-sky-600 font-bold text-base mt-2">
            {formatRupiah(project?.total_value)}
          </p>
        </div>
        <FormGroup label="Alasan Penolakan (opsional)">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input"
            rows={2}
            placeholder="Tulis alasan jika ditolak..."
          />
        </FormGroup>
        <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 pt-4">
          <motion.button
            className="btn-danger flex-1 justify-center"
            onClick={() => approveMutation.mutate({ action: 'reject', rejectionReason: reason })}
            disabled={approveMutation.isPending}
            whileTap={{ scale: 0.97 }}
          >
            <XCircle size={15} /> Tolak
          </motion.button>
          <motion.button
            className="btn-primary flex-1 justify-center"
            onClick={() => approveMutation.mutate({ action: 'approve' })}
            disabled={approveMutation.isPending}
            whileTap={{ scale: 0.97 }}
          >
            <CheckCircle size={15} /> Setujui
          </motion.button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Project Items Detail ──────────────────────────────────────────────────────
const ProjectItemsDetail = ({ projectId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['project-detail', projectId],
    queryFn: async () => (await apiService.get(`/projects/${projectId}`)).data.data,
  });

  if (isLoading) return <p className="text-xs text-slate-400">Memuat detail...</p>;

  return (
    <div className="space-y-2">
      {data?.items?.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-700 truncate">{item.product_name}</p>
            <p className="text-[11px] text-slate-400">Qty: {item.quantity} · Jual: {formatRupiah(item.selling_price)}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className={`text-xs font-bold ${Number(item.negotiated_price) < Number(item.selling_price) ? 'text-amber-600' : 'text-slate-700'}`}>
              {formatRupiah(item.negotiated_price)}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">
              = {formatRupiah(item.negotiated_price * item.quantity)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ProjectsPage = () => {
  const { isManager } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return (await apiService.get(`/projects${params}`)).data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiService.post('/projects', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['projects']);
      toast.success(res.data.message);
      setIsFormOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat project.'),
  });

  const filterButtons = [
    { val: '', label: 'Semua' },
    ...Object.entries(PROJECT_STATUSES).map(([val, { label }]) => ({ val, label })),
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-3 flex-wrap"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
            <Briefcase size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deal Pipeline</h1>
            <p className="text-sm text-slate-500 mt-0.5">Proses konversi lead menjadi customer</p>
          </div>
        </div>
        <motion.button
          className="btn-primary flex-shrink-0"
          onClick={() => setIsFormOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Buat Project</span>
          <span className="sm:hidden">Buat</span>
        </motion.button>
      </motion.div>

      {/* Status Filter — horizontal scroll on mobile */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {filterButtons.map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              statusFilter === val
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Projects List */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="card">
            <EmptyState title="Belum ada project" description="Klik Buat Project untuk memulai." />
          </div>
        ) : (
          projects.map((proj, idx) => {
            const isExpanded = expandedId === proj.id;
            return (
              <motion.div
                key={proj.id}
                className="card overflow-hidden"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                {/* Project header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center p-1.5 border border-emerald-100 flex-shrink-0 mt-0.5 shadow-sm">
                      <img src={customerIconUrl} alt="Deal" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm">{proj.project_name}</h3>
                        <Badge
                          label={PROJECT_STATUSES[proj.status]?.label}
                          color={PROJECT_STATUSES[proj.status]?.color}
                        />
                        {proj.needs_approval && proj.status === 'waiting_approval' && (
                          <Badge label="Butuh Approval" color="bg-amber-100 text-amber-700" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {proj.lead_name} · {proj.sales_name} · {formatDate(proj.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Value + actions row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <span className="text-base font-bold text-slate-900">
                      {formatRupiah(proj.total_value)}
                    </span>
                    <div className="flex items-center gap-2">
                      {isManager && proj.status === 'waiting_approval' && (
                        <motion.button
                          onClick={() => setApprovalTarget(proj)}
                          className="btn-primary py-1.5 text-xs"
                          whileTap={{ scale: 0.97 }}
                        >
                          <Clock size={13} /> Review
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => setExpandedId(isExpanded ? null : proj.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        animate={{ rotate: 0 }}
                      >
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} />
                        </motion.div>
                        <span className="hidden sm:inline">Detail</span>
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Expandable detail */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 px-4 pb-4 pt-3 bg-slate-50/60">
                        {proj.rejection_reason && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex items-start gap-2">
                            <XCircle size={13} className="flex-shrink-0 mt-0.5" />
                            <span><strong>Alasan penolakan:</strong> {proj.rejection_reason}</span>
                          </div>
                        )}
                        {proj.notes && (
                          <p className="text-xs text-slate-500 mb-3 italic">Catatan: {proj.notes}</p>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Item Produk</p>
                        <ProjectItemsDetail projectId={proj.id} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Buat Project Baru" size="xl">
        <ProjectForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
      </Modal>

      {approvalTarget && (
        <ApprovalModal project={approvalTarget} onClose={() => setApprovalTarget(null)} />
      )}
    </div>
  );
};

export default ProjectsPage;
