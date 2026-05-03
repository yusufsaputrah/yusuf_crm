// Full CRUD management for leads.
// Mobile: card list view. Desktop: table view.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, Filter, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import { LEAD_STATUSES } from '../constants/appConstants';
import { formatDate, truncate } from '../utils/formatUtils';
import {
  Modal, Badge, PageLoader, EmptyState,
  ConfirmDialog, FormGroup,
} from '../components/UIComponents';

const manIconUrl = new URL('../assets/icons/bussiness-man.png', import.meta.url).href;
const womanIconUrl = new URL('../assets/icons/businesswoman.png', import.meta.url).href;

// ─── Lead Form ─────────────────────────────────────────────────────────────────
const LeadForm = ({ initialData, onSubmit, isLoading }) => {
  const [form, setForm] = useState({
    fullName:     initialData?.full_name     || '',
    phone:        initialData?.phone         || '',
    email:        initialData?.email         || '',
    address:      initialData?.address       || '',
    gender:       initialData?.gender        || 'pria',
    requirements: initialData?.requirements  || '',
    status:       initialData?.status        || 'new',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* stack on mobile, 2-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Nama Lengkap" required>
          <input name="fullName" value={form.fullName} onChange={handleChange} className="input" placeholder="John Doe" required />
        </FormGroup>
        <FormGroup label="Status">
          <select name="status" value={form.status} onChange={handleChange} className="input">
            {Object.entries(LEAD_STATUSES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </FormGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormGroup label="Telepon">
          <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="08xxxxxxxxxx" />
        </FormGroup>
        <FormGroup label="Email">
          <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="john@example.com" />
        </FormGroup>
        <FormGroup label="Jenis Kelamin">
          <select name="gender" value={form.gender} onChange={handleChange} className="input">
            <option value="pria">Pria</option>
            <option value="wanita">Wanita</option>
          </select>
        </FormGroup>
      </div>
      <FormGroup label="Alamat">
        <textarea name="address" value={form.address} onChange={handleChange} className="input" rows={2} placeholder="Jl. ..." />
      </FormGroup>
      <FormGroup label="Kebutuhan">
        <textarea name="requirements" value={form.requirements} onChange={handleChange} className="input" rows={2} placeholder="Butuh paket internet..." />
      </FormGroup>
      <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
        <motion.button type="submit" className="btn-primary" disabled={isLoading} whileTap={{ scale: 0.97 }}>
          {isLoading ? 'Menyimpan...' : 'Simpan Data'}
        </motion.button>
      </div>
    </form>
  );
};

// ─── Lead Card (mobile view) ──────────────────────────────────────────────────
const LeadCard = ({ lead, onEdit, onDelete, idx }) => (
  <motion.div
    className="card p-4"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.04 }}
  >
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <User size={18} className="text-sky-600" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{lead.full_name}</p>
          <p className="text-[11px] text-slate-400">{lead.sales_name} · {formatDate(lead.created_at)}</p>
        </div>
      </div>
      <Badge label={LEAD_STATUSES[lead.status]?.label} color={LEAD_STATUSES[lead.status]?.color} />
    </div>

    <div className="space-y-1 mb-3">
      {lead.phone && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Phone size={11} className="text-slate-400 flex-shrink-0" />{lead.phone}
        </div>
      )}
      {lead.email && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Mail size={11} className="text-slate-400 flex-shrink-0" />{lead.email}
        </div>
      )}
      {lead.gender && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 capitalize">
          <User size={11} className="text-slate-400 flex-shrink-0" />{lead.gender}
        </div>
      )}
      {lead.address && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={11} className="text-slate-400 flex-shrink-0" />{truncate(lead.address, 40)}
        </div>
      )}
      {lead.requirements && (
        <p className="text-xs text-slate-400 italic mt-1">{truncate(lead.requirements, 60)}</p>
      )}
    </div>

    <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2.5">
      <button
        onClick={() => onEdit(lead)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
      >
        <Edit2 size={12} /> Edit
      </button>
      <button
        onClick={() => onDelete(lead)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={12} /> Hapus
      </button>
    </div>
  </motion.div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
const LeadsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await apiService.get(`/leads?${params}`);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiService.post('/leads', data),
    onSuccess: () => { queryClient.invalidateQueries(['leads']); toast.success('Lead berhasil ditambahkan.'); setIsFormOpen(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menambahkan lead.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiService.put(`/leads/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['leads']); toast.success('Lead berhasil diperbarui.'); setSelectedLead(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal memperbarui lead.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiService.delete(`/leads/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['leads']); toast.success('Lead dihapus.'); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus lead.'),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-3 flex-wrap"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-sm">
            <Users size={20} className="text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads</h1>
            <p className="text-sm text-slate-500 mt-0.5">{leads.length} calon customer terdaftar</p>
          </div>
        </div>
        <motion.button
          className="btn-primary flex-shrink-0"
          onClick={() => setIsFormOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Lead</span>
          <span className="sm:hidden">Tambah</span>
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex flex-col sm:flex-row gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Cari nama, telepon, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            className="input pl-9 appearance-none pr-8 cursor-pointer w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            {Object.entries(LEAD_STATUSES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Mobile: Card List */}
      <div className="block lg:hidden space-y-3">
        {leads.length === 0 ? (
          <div className="card">
            <EmptyState title="Belum ada lead" description="Klik Tambah Lead untuk menambahkan calon customer." />
          </div>
        ) : (
          leads.map((lead, idx) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              idx={idx}
              onEdit={setSelectedLead}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </div>

      {/* Desktop: Table */}
      <motion.div
        className="hidden lg:block card overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-th">Nama</th>
                <th className="table-th">Kontak</th>
                <th className="table-th">Kebutuhan</th>
                <th className="table-th">Status</th>
                <th className="table-th">Sales</th>
                <th className="table-th">Tgl Buat</th>
                <th className="table-th">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="Belum ada lead" description="Klik Tambah Lead untuk menambahkan calon customer." />
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => (
                  <motion.tr
                    key={lead.id}
                    className="hover:bg-sky-50/40 transition-colors duration-150"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                  >
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 p-1 border border-sky-100">
                          <img 
                            src={lead.gender === 'wanita' ? womanIconUrl : manIconUrl} 
                            alt="Avatar" 
                            className="w-full h-full object-contain drop-shadow-sm" 
                          />
                        </div>
                        <span className="font-semibold text-slate-900">{lead.full_name}</span>
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="space-y-1">
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={11} className="text-slate-400" />{lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={11} className="text-slate-400" />{lead.email}
                          </div>
                        )}
                        {lead.gender && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 capitalize">
                            <User size={11} className="text-slate-400" />{lead.gender}
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin size={11} className="text-slate-400" />{truncate(lead.address, 28)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-td text-slate-500 text-xs">{truncate(lead.requirements, 40)}</td>
                    <td className="table-td">
                      <Badge label={LEAD_STATUSES[lead.status]?.label} color={LEAD_STATUSES[lead.status]?.color} />
                    </td>
                    <td className="table-td text-slate-500 text-xs font-medium">{lead.sales_name}</td>
                    <td className="table-td text-slate-400 text-xs">{formatDate(lead.created_at)}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedLead(lead)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-150">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(lead)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Tambah Lead Baru" size="lg">
        <LeadForm onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Edit Lead" size="lg">
        <LeadForm
          initialData={selectedLead}
          onSubmit={(data) => updateMutation.mutate({ id: selectedLead.id, data })}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        isLoading={deleteMutation.isPending}
        title="Hapus Lead"
        message={`Apakah Anda yakin ingin menghapus lead "${deleteTarget?.full_name}"? Tindakan ini tidak bisa dibatalkan.`}
      />
    </div>
  );
};

export default LeadsPage;
