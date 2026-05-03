/**
 * @file LoginPage.jsx
 * @description Clean split-screen login page with Lottie networking animation
 * on the left panel and a polished form on the right.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Wifi, LogIn, Lock, Mail } from 'lucide-react';
import Lottie from 'lottie-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import networkingAnimation from '../assets/networking.json';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. POST ke backend untuk verifikasi kredensial
      const res = await apiService.post('/auth/login', { email, password });
      const { token, user } = res.data.data;

      // 2. Simpan sesi ke AuthContext & localStorage
      login(token, user);

      toast.success('Selamat datang kembali! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: Lottie animation ── */}
      <motion.div
        className="hidden lg:flex flex-col items-center justify-center flex-1 bg-sky-500 relative overflow-hidden px-10"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-600/30 rounded-full blur-3xl" />

        {/* Brand mark */}
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Wifi size={15} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">Smart CRM</span>
        </div>

        {/* Lottie */}
        <div className="w-full max-w-sm z-10">
          <Lottie
            animationData={networkingAnimation}
            loop
            autoplay
            style={{ width: '100%', height: 'auto' }}
          />
        </div>

        {/* Caption */}
        <div className="z-10 text-center mt-2">
          <h2 className="text-white text-2xl font-bold leading-tight">
            Kelola Pelanggan ISP<br />dengan Mudah
          </h2>
          <p className="text-sky-100 text-sm mt-2 max-w-xs mx-auto">
            Platform CRM terpadu untuk tim sales, manager, dan customer Anda.
          </p>
        </div>

        {/* Feature pills */}
        <div className="z-10 flex flex-wrap justify-center gap-2 mt-6">
          {['Lead Management', 'Deal Pipeline', 'Laporan Real-time'].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20"
            >
              {f}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Right panel: Login form ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 lg:max-w-md xl:max-w-lg">
        <motion.div
          className="w-full max-w-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile logo (only visible on small screens) */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Wifi size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Smart CRM</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Selamat Datang Kembali
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Masuk untuk mengakses dashboard Anda
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <motion.div variants={itemVariants}>
              <label className="label">Email</label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
            <motion.div variants={itemVariants}>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div variants={itemVariants} className="pt-1">
              <motion.button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary justify-center py-3 text-base"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
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
                    <LogIn size={16} />
                    Masuk
                  </span>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Footer note */}
          <motion.p
            variants={itemVariants}
            className="text-center text-xs text-slate-400 mt-8"
          >
            &copy; {new Date().getFullYear()} Smart CRM · PT. Smart ISP
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
