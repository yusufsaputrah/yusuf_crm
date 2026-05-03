/**
 * @file UIComponents.jsx
 * @description Shared reusable UI primitives powered by HeroUI + Framer Motion.
 */

import { X, AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  const maxW = maxWidthMap[size] || 'max-w-lg';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = 'bg-slate-100 text-slate-700' }) => (
  <span className={`badge ${color}`}>{label}</span>
);

// ─── Spinner / Loader ─────────────────────────────────────────────────────────
export const Spinner = ({ size = 24 }) => (
  <Loader2
    size={size}
    className="animate-spin text-indigo-600"
  />
);

export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    >
      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full" />
    </motion.div>
    <p className="text-sm text-slate-400 font-medium">Memuat data...</p>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ title = 'Tidak ada data', description = '' }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-16 text-center"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Inbox size={28} className="text-slate-400" />
    </div>
    <p className="text-sm font-semibold text-slate-600">{title}</p>
    {description && (
      <p className="text-xs text-slate-400 mt-1.5 max-w-xs">{description}</p>
    )}
  </motion.div>
);

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Hapus',
  isLoading,
  variant = 'danger', // 'danger' | 'warning'
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex gap-4 mb-6">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'
          }`}
      >
        <AlertTriangle
          size={20}
          className={variant === 'danger' ? 'text-red-600' : 'text-amber-600'}
        />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed pt-1">{message}</p>
    </div>
    <div className="flex gap-2 justify-end">
      <button className="btn-secondary" onClick={onClose}>
        Batal
      </button>
      <button
        className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? 'Memproses...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export const LogoutConfirmDialog = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {/* Decorative top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

          <div className="p-6">
            {/* Icon */}
            <motion.div
              className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1, stiffness: 500 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7 text-red-500"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </motion.div>

            <h3 className="text-center text-lg font-bold text-slate-900 mb-1">
              Keluar dari Akun?
            </h3>
            <p className="text-center text-sm text-slate-500 mb-6">
              Sesi Anda akan diakhiri. Pastikan semua pekerjaan sudah tersimpan.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Form Group ───────────────────────────────────────────────────────────────
export const FormGroup = ({ label, required, children, error }) => (
  <div>
    <label className="label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          className="text-xs text-red-500 mt-1"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─── Stats Card ───────────────────────────────────────────────────────────────
export const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = 'text-indigo-600',
  bgColor = 'bg-indigo-50',
  trend,
}) => (
  <motion.div
    className="card p-5 flex items-center gap-4"
    whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)' }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  >
    <div
      className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}
    >
      <Icon size={22} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  </motion.div>
);
