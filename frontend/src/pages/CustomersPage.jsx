import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Phone, Mail, Users, Wallet, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/apiService';
import { formatRupiah, formatDate } from '../utils/formatUtils';
import { PageLoader, EmptyState } from '../components/UIComponents';

const manIconUrl = new URL('../assets/icons/bussiness-man.png', import.meta.url).href;
const womanIconUrl = new URL('../assets/icons/businesswoman.png', import.meta.url).href;

const CustomerDetail = ({ customerId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: async () => (await apiService.get(`/customers/${customerId}`)).data.data,
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="overflow-hidden"
    >
      <div className="px-5 pb-5 pt-1 bg-slate-50 border-t border-slate-100">
        {isLoading ? (
          <p className="text-xs text-slate-400 py-3">Memuat layanan...</p>
        ) : (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-3">
              Layanan Aktif
            </p>
            {data?.services?.length === 0 ? (
              <p className="text-xs text-slate-400">Tidak ada layanan tercatat.</p>
            ) : (
              <div className="space-y-2">
                {data?.services?.map((svc, idx) => (
                  <motion.div
                    key={svc.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{svc.product_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mulai: {formatDate(svc.start_date)} · Qty: {svc.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-sky-600">{formatRupiah(svc.negotiated_price)}</p>
                      <p className="text-xs text-slate-400">per bulan</p>
                    </div>
                  </motion.div>
                ))}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-1">
                  <span className="text-xs font-bold text-slate-600">Total Bulanan</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatRupiah(
                      data?.services?.reduce(
                        (sum, s) => sum + Number(s.negotiated_price) * s.quantity,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

const CustomersPage = () => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await apiService.get('/customers')).data.data,
  });

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">

      <motion.div
        className="flex items-center justify-between gap-3 flex-wrap mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shadow-sm">
            <Users size={20} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Aktif</h1>
            <p className="text-sm text-slate-500 mt-0.5">{customers.length} customer terdaftar</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm text-xs text-slate-500 font-medium">
            <Users size={13} className="text-sky-500" />
            {customers.length} total
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm text-xs text-slate-500 font-medium">
            <Wallet size={13} className="text-emerald-500" />
            {formatRupiah(customers.reduce((sum, c) => sum + Number(c.monthly_value || 0), 0))}/bln
          </div>
        </div>
      </motion.div>

      <motion.div
        className="relative max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-10"
          placeholder="Cari customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      <motion.div
        className="card overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="Belum ada customer aktif"
            description="Customer akan muncul setelah project disetujui."
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((customer, idx) => {
              const isExpanded = expandedId === customer.id;
              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                >

                  <div
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors duration-150 ${
                      isExpanded ? 'bg-sky-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                  >

                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 p-1.5 border border-violet-100">
                      <img 
                        src={customer.gender === 'wanita' ? womanIconUrl : manIconUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-contain drop-shadow-sm" 
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{customer.full_name}</p>

                      <p className="text-xs font-bold text-sky-600 sm:hidden">
                        {formatRupiah(customer.monthly_value)}/bln
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {customer.phone && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Phone size={10} />{customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                            <Mail size={10} />{customer.email}
                          </span>
                        )}
                        {customer.gender && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 capitalize">
                            <User size={10} />{customer.gender}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">{customer.service_count} layanan</p>
                        <p className="text-sm font-bold text-slate-900">
                          {formatRupiah(customer.monthly_value)}/bln
                        </p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400">Sales</p>
                        <p className="text-xs font-semibold text-slate-600">{customer.sales_name}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <ChevronDown size={16} className={isExpanded ? 'text-sky-500' : 'text-slate-400'} />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && <CustomerDetail customerId={customer.id} />}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CustomersPage;
