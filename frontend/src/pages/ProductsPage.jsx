// Master product management. Sales can view; Manager can CRUD.
// Redesigned with HeroUI + Framer Motion.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Package, Tag, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import { formatRupiah } from '../utils/formatUtils';
import { useAuth } from '../context/AuthContext';
import {
  Modal, PageLoader, EmptyState, ConfirmDialog, FormGroup,
} from '../components/UIComponents';

const ProductForm = ({ initialData, onSubmit, isLoading }) => {
  const [form, setForm] = useState({
    productName:   initialData?.product_name   || '',
    description:   initialData?.description    || '',
    baseCost:      initialData?.base_cost      || '',
    marginPercent: initialData?.margin_percent || '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const computedSellingPrice =
    form.baseCost && form.marginPercent
      ? Number(form.baseCost) + (Number(form.baseCost) * Number(form.marginPercent)) / 100
      : 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <FormGroup label="Nama Produk" required>
        <input name="productName" value={form.productName} onChange={handleChange} className="input" placeholder="Paket Internet 50 Mbps" required />
      </FormGroup>
      <FormGroup label="Deskripsi">
        <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={2} placeholder="Deskripsi singkat produk..." />
      </FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="HPP (Rp)" required>
          <input type="number" name="baseCost" value={form.baseCost} onChange={handleChange} className="input" placeholder="200000" required min="0" />
        </FormGroup>
        <FormGroup label="Margin Sales (%)" required>
          <input type="number" name="marginPercent" value={form.marginPercent} onChange={handleChange} className="input" placeholder="25" required min="0" max="100" step="0.01" />
        </FormGroup>
      </div>

      {computedSellingPrice > 0 && (
        <motion.div
          className="p-4 bg-sky-50 rounded-xl border border-sky-100"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <p className="text-xs text-sky-600 font-medium">
            Harga Jual (otomatis):{' '}
            <span className="font-bold text-sky-700 text-sm">{formatRupiah(computedSellingPrice)}</span>
          </p>
        </motion.div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <motion.button type="submit" className="btn-primary" disabled={isLoading} whileTap={{ scale: 0.97 }}>
          {isLoading ? 'Menyimpan...' : 'Simpan Produk'}
        </motion.button>
      </div>
    </form>
  );
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  visible: (i) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 300, damping: 28 },
  }),
};

const ProductsPage = () => {
  const { isManager } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await apiService.get('/products')).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiService.post('/products', data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Produk ditambahkan.'); setIsFormOpen(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiService.put(`/products/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Produk diperbarui.'); setSelectedProduct(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiService.delete(`/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['products']); toast.success('Produk dinonaktifkan.'); setDeleteTarget(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal.'),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="page-title">Master Produk</h1>
          <p className="page-subtitle">Daftar paket layanan internet</p>
        </div>
        {isManager && (
          <motion.button
            className="btn-primary"
            onClick={() => setIsFormOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={16} />
            Tambah Produk
          </motion.button>
        )}
      </motion.div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <div className="col-span-3">
            <EmptyState title="Belum ada produk" description="Tambah produk untuk memulai." />
          </div>
        ) : (
          products.map((product, i) => (
            <motion.div
              key={product.id}
              className="card p-5 hover:shadow-md transition-all duration-200 group"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -2 }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                  <Package size={20} className="text-sky-600" />
                </div>
                {isManager && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-1">{product.product_name}</h3>
              {product.description && (
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{product.description}</p>
              )}

              {/* Pricing breakdown */}
              <div className="space-y-2 border-t border-slate-100 pt-3 mt-auto">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Tag size={11} /> HPP
                  </span>
                  <span className="font-medium text-slate-700">{formatRupiah(product.base_cost)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Percent size={11} /> Margin
                  </span>
                  <span className="font-medium text-slate-700">{product.margin_percent}%</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
                  <span className="text-sm font-semibold text-slate-700">Harga Jual</span>
                  <span className="text-sm font-bold text-sky-600">{formatRupiah(product.selling_price)}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Tambah Produk Baru" size="md">
        <ProductForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
      </Modal>
      <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Edit Produk" size="md">
        <ProductForm
          initialData={selectedProduct}
          onSubmit={(d) => updateMutation.mutate({ id: selectedProduct.id, data: d })}
          isLoading={updateMutation.isPending}
        />
      </Modal>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        isLoading={deleteMutation.isPending}
        title="Nonaktifkan Produk"
        message={`Produk "${deleteTarget?.product_name}" akan dinonaktifkan dari sistem.`}
        confirmLabel="Nonaktifkan"
        variant="warning"
      />
    </div>
  );
};

export default ProductsPage;
