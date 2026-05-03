// Main navigation sidebar — sky-blue palette + logout confirmation popup + mobile support.

import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, Briefcase,
  UserCheck, BarChart2, LogOut, Wifi, ChevronRight, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogoutConfirmDialog } from './UIComponents';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/leads',      label: 'Leads',           icon: Users },
  { to: '/products',   label: 'Master Produk',   icon: Package },
  { to: '/projects',   label: 'Deal Pipeline',   icon: Briefcase },
  { to: '/customers',  label: 'Customer Aktif',  icon: UserCheck },
  { to: '/reports',    label: 'Laporan',         icon: BarChart2 },
];

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

const navItemVariants = {
  hidden: { x: -12, opacity: 0 },
  visible: (i) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.05 + 0.1, duration: 0.25, ease: 'easeOut' },
  }),
};

const Sidebar = ({ isMobile = false, onClose }) => {
  const { authUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    toast.success('Berhasil keluar. Sampai jumpa!');
    navigate('/login');
    setShowLogoutDialog(false);
  };

  const initials = authUser?.fullName
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <>
      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="w-64 min-h-screen bg-white flex flex-col flex-shrink-0 border-r border-slate-100"
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <Wifi size={16} className="text-white" />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm leading-tight">Smart CRM</p>
                <p className="text-slate-400 text-xs font-medium">PT. Smart ISP</p>
              </div>
            </div>
            {/* Tombol close hanya di mobile */}
            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-sky-50">
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-900 text-sm font-semibold truncate leading-tight">
                {authUser?.fullName}
              </p>
              <p className="text-slate-400 text-xs font-medium capitalize mt-0.5">
                {authUser?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Menu
          </p>
          {NAV_ITEMS.map(({ to, label, icon: Icon }, i) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <motion.div
                key={to}
                custom={i}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
              >
                <NavLink
                  to={to}
                  className={() =>
                    `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                    }`
                  }
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-200 rounded-r-full"
                        layoutId="sidebar-indicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </AnimatePresence>
                  <Icon
                    size={17}
                    className={isActive ? 'text-sky-100' : 'text-slate-400 group-hover:text-sky-500 transition-colors'}
                  />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <ChevronRight size={14} className="text-sky-200 opacity-80" />
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <motion.button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={17} className="group-hover:text-red-500 transition-colors" />
            Keluar
          </motion.button>
        </div>
      </motion.aside>

      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default Sidebar;