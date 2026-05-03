import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Wifi, LogIn, Lock, Mail, Signal, Globe, Zap, Shield, BarChart2, Network } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
const bgLoginUrl = new URL('../assets/images/bg-login.jpeg', import.meta.url).href;
const checkIconUrl = new URL('../assets/icons/check.png', import.meta.url).href;
const removeIconUrl = new URL('../assets/icons/remove.png', import.meta.url).href;
const formContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const formItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: 'easeOut' } },
};

const ICONS = [
  { Icon: Wifi,      size: 20, top: '10%', left: '8%',  delay: 0,    color: '#38bdf8', dur: 3.6 },
  { Icon: Signal,    size: 16, top: '17%', left: '74%', delay: 0.5,  color: '#7dd3fc', dur: 4.0 },
  { Icon: Globe,     size: 22, top: '57%', left: '6%',  delay: 0.9,  color: '#0ea5e9', dur: 3.8 },
  { Icon: Network,   size: 18, top: '73%', left: '71%', delay: 0.25, color: '#38bdf8', dur: 4.2 },
  { Icon: Zap,       size: 14, top: '37%', left: '83%', delay: 1.1,  color: '#fbbf24', dur: 3.4 },
  { Icon: Shield,    size: 18, top: '48%', left: '3%',  delay: 0.7,  color: '#34d399', dur: 4.1 },
  { Icon: BarChart2, size: 16, top: '83%', left: '26%', delay: 1.3,  color: '#a78bfa', dur: 3.7 },
];

const FloatingIcon = ({ Icon, size, top, left, delay, color, dur }) => (
  <motion.div
    className="absolute z-10 pointer-events-none"
    style={{ top, left }}
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 0.9, 0.55, 0.9], y: [0, -11, 0] }}
    transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    <motion.div
      className="absolute inset-0 rounded-xl"
      style={{ background: `${color}30`, filter: 'blur(7px)' }}
      animate={{ scale: [1, 1.7, 1], opacity: [0.7, 0, 0.7] }}
      transition={{ duration: dur * 0.75, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
    <span
      className="relative flex items-center justify-center rounded-xl border border-white/20 backdrop-blur-sm"
      style={{ width: size + 18, height: size + 18, background: `${color}16`, boxShadow: `0 0 14px ${color}50` }}
    >
      <Icon size={size} color={color} strokeWidth={1.6} />
    </span>
  </motion.div>
);

const LoginPage = () => {
  const { login }                       = useAuth();
  const navigate                        = useNavigate();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiService.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      login(token, user);
      setErrorMsg('');
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Email atau password salah.');
      setShowErrorModal(true);
      setTimeout(() => {
        setShowErrorModal(false);
      }, 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const bgStyle = { backgroundImage: `url(${bgLoginUrl})` };

  return (
    <div className="min-h-screen flex flex-row overflow-hidden">

      {/* LEFT PANEL — foto + ikon animasi (lg ke atas) */}
      <motion.aside
        aria-hidden="true"
        className="hidden lg:flex flex-col items-center justify-center w-[56%] xl:w-[60%] relative overflow-hidden shrink-0"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={bgStyle} />
        <div className="absolute inset-0 bg-gradient-to-br from-sky-950/45 via-slate-900/25 to-sky-900/40" />

        {ICONS.map((cfg, i) => <FloatingIcon key={i} {...cfg} />)}

        {/* Orbiting rings */}
        <motion.div
          className="absolute w-72 h-72 rounded-full border border-sky-400/20 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
        </motion.div>
        <motion.div
          className="absolute w-48 h-48 rounded-full border border-white/10 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_6px_#7dd3fc]" />
        </motion.div>

        {/* Brand badge */}
        <div className="absolute top-7 left-7 z-20 flex items-center gap-2.5">
          <motion.div
            className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Wifi size={16} className="text-white" />
          </motion.div>
          <span className="text-white font-bold text-sm tracking-widest uppercase drop-shadow">Smart CRM</span>
        </div>

        {/* Hero text — dinonaktifkan sementara
        <motion.div
          className="relative z-20 mx-10 max-w-sm"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.65 }}
        >
          <div
            className="rounded-2xl px-8 py-7 text-center"
            style={{
              background: 'rgba(2, 14, 36, 0.48)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
            }}
          >
            <h2 className="text-white text-2xl xl:text-3xl font-extrabold leading-snug drop-shadow">
              Kelola Pelanggan ISP<br />
              <span className="text-sky-300">dengan Mudah</span>
            </h2>
            <div className="mx-auto mt-4 mb-4 h-px w-16 bg-sky-400/50 rounded-full" />
            <p className="text-sky-100/80 text-sm leading-relaxed">
              Platform CRM terpadu untuk tim sales,<br />
              manager, dan customer Anda.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {['Lead Management', 'Deal Pipeline', 'Laporan Real-time'].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 text-white text-xs font-medium rounded-full border border-white/25 hover:bg-white/20 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
        */}

        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-slate-950/50 to-transparent pointer-events-none" />
      </motion.aside>

      {/* RIGHT PANEL — form login */}
      <div className="flex-1 flex items-center justify-center relative min-h-screen lg:min-h-0 lg:bg-slate-50 px-4 py-10 sm:px-8">

        {/* Mobile background */}
        <div className="absolute inset-0 bg-cover bg-center lg:hidden" style={bgStyle} />
        <div
          className="absolute inset-0 lg:hidden"
          style={{ background: 'rgba(2,14,36,0.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
        />

        <motion.div
          className="relative z-10 w-full max-w-sm lg:bg-transparent lg:border-0 lg:shadow-none lg:rounded-none lg:p-0 rounded-2xl p-7"
          variants={formContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div variants={formItem} className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-md">
              <Wifi size={15} className="text-white" />
            </div>
            <span className="font-bold text-sm lg:text-slate-800 text-white">Smart CRM</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={formItem} className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight lg:text-slate-900 text-white">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm mt-1 lg:text-slate-500 text-sky-200">
              Masuk untuk mengakses dashboard Anda
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <motion.div variants={formItem}>
              <label className="label lg:text-slate-500 text-sky-300">Email</label>
              <div className="relative">
                <motion.div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Mail size={15} className="text-slate-400" />
                </motion.div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input pl-10"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={formItem}>
              <label className="label lg:text-slate-500 text-sky-300">Password</label>
              <div className="relative">
                <motion.div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  animate={{ rotate: [0, -12, 12, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <Lock size={15} className="text-slate-400" />
                </motion.div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {showPassword ? (
                      <motion.span key="off" initial={{ opacity: 0, rotate: -10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
                        <EyeOff size={15} />
                      </motion.span>
                    ) : (
                      <motion.span key="on" initial={{ opacity: 0, rotate: 10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
                        <Eye size={15} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div variants={formItem} className="pt-1">
              <motion.button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary justify-center py-3 text-base"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <LogIn size={16} />
                    </motion.span>
                    Masuk
                  </span>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.p variants={formItem} className="text-center text-xs mt-8 lg:text-slate-400 text-sky-300/60">
            &copy; {new Date().getFullYear()} Smart CRM &middot; PT. Smart ISP
          </motion.p>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center relative overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Glow background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-sky-100 blur-3xl rounded-full opacity-60" />
              
              <motion.div 
                className="w-20 h-20 bg-sky-50 border border-sky-100 shadow-xl shadow-sky-100/50 rounded-full flex items-center justify-center mb-5 relative z-10 p-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [-10, 10, 0] }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              >
                <img src={checkIconUrl} alt="Success" className="w-full h-full object-contain drop-shadow-md" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2 relative z-10 tracking-tight">Login Berhasil!</h2>
              <p className="text-slate-500 text-sm relative z-10 mb-2">Selamat datang kembali di Smart CRM.</p>
              
              {/* Loading dots */}
              <div className="mt-4 flex gap-1.5 relative z-10 items-center h-4">
                <motion.div className="w-2 h-2 rounded-full bg-sky-500" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                <motion.div className="w-2 h-2 rounded-full bg-sky-500" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                <motion.div className="w-2 h-2 rounded-full bg-sky-500" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center relative overflow-hidden"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Glow background merah */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-100 blur-3xl rounded-full opacity-60" />
              
              <motion.div 
                className="w-20 h-20 bg-red-50 border border-red-100 shadow-xl shadow-red-100/50 rounded-full flex items-center justify-center mb-5 relative z-10 p-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [-10, 10, 0] }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              >
                <img src={removeIconUrl} alt="Error" className="w-full h-full object-contain drop-shadow-md" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2 relative z-10 tracking-tight">Login Gagal</h2>
              <p className="text-slate-500 text-sm relative z-10 mb-2">{errorMsg}</p>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LoginPage;
