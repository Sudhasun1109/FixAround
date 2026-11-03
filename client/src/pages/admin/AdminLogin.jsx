import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { showToast } from '../../components/common/Toast';
import Spinner from '../../components/common/Spinner';
import {
  Wrench,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Users,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Server,
  Zap,
} from 'lucide-react';

const REMEMBERED_EMAIL_KEY = 'fixaround_remembered_admin_email';

export default function AdminLogin() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Destination route after login
  const from = location.state?.from?.pathname;
  const redirectTarget = from && from.startsWith('/admin') && from !== '/admin/login'
    ? from
    : '/admin/dashboard';

  // Restore remembered email on initial mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // If already logged in as Admin, redirect immediately
  useEffect(() => {
    if (isAuthenticated && user?.role === ROLES.ADMIN) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTarget]);

  // Form Validation
  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage('Admin email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMessage('Password is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // 1. Authenticate with existing backend API
      const { user: loggedInUser } = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      // 2. Strict Server-Side & Client Role Verification: Admin Only
      if (loggedInUser.role !== ROLES.ADMIN) {
        // Immediately terminate session if non-admin attempted admin login
        await logout();
        const roleDeniedMsg = `Access Denied: Administrator privileges required. Your account (${loggedInUser.role}) is not authorized to access the Admin Panel.`;
        setErrorMessage(roleDeniedMsg);
        showToast.error('Access Denied: Administrator privileges required.');
        return;
      }

      // 3. Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      // 4. Success feedback and redirect to Admin Dashboard
      showToast.success(`Welcome to Admin Control Center, ${loggedInUser.first_name || 'Administrator'}!`);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid administrator credentials.';
      setErrorMessage(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for developers & administrators
  const handleQuickFill = () => {
    setEmail('admin@fixaround.com');
    setPassword('Password123!');
    setErrorMessage('');
    showToast.info('Filled default admin credentials');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-center selection:bg-fixblue-500 selection:text-white">
      {/* Outer Centered Container */}
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-3xl shadow-card border border-[#E5EAF2] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
          
          {/* ========================================================= */}
          {/* LEFT SIDE: BRANDING & SYSTEM OVERVIEW (5 cols)             */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0F1E36] via-[#162C4E] to-[#0A1628] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#3498F6]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#1976D2]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#3498F6] text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-wider text-white">
                      FIX<span className="text-[#3498F6]">AROUND</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-blue-200 border border-white/15 uppercase tracking-wider">
                      Portal
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-300">
                    Smart Local Service & Emergency Repair
                  </p>
                </div>
              </div>

              {/* Main Heading & Description */}
              <div className="space-y-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3498F6]/20 text-blue-300 text-xs font-bold border border-[#3498F6]/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#3498F6]" />
                  Secure Admin Gateway
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Admin Panel Access
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Manage your platform, customers, technicians, and services efficiently from one secure dashboard.
                </p>
              </div>

              {/* Three Feature Highlights */}
              <div className="space-y-3 pt-2">
                {/* 1. User Management */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="w-9 h-9 rounded-xl bg-[#3498F6]/20 text-[#3498F6] flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">User Management</h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Manage customer and technician accounts.
                    </p>
                  </div>
                </div>

                {/* 2. Service Management */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="w-9 h-9 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Service Management</h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Control service categories and platform services.
                    </p>
                  </div>
                </div>

                {/* 3. Booking Monitoring */}
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Booking Monitoring</h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Monitor service requests and booking activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service-Management Graphic Preview (Decorative Visual) */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/10">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-[11px] font-bold text-white">FixAround Core Engine</p>
                    <p className="text-[10px] text-slate-400">All Microservices Operational</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Zap className="w-3 h-3" />
                  <span>99.98% Uptime</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: ADMIN LOGIN FORM (7 cols)                     */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
            <div className="max-w-md w-full mx-auto space-y-6">
              
              {/* Top Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#3498F6] flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#3498F6] uppercase tracking-wider">
                      Administration Portal
                    </span>
                  </div>
                  {/* Subtle Quick Demo Fill button */}
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    title="Fill test administrator credentials"
                  >
                    Demo Fill
                  </button>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
                  Admin Login
                </h2>
                <p className="text-xs sm:text-sm text-[#7B8494] font-medium">
                  Sign in to access the administration dashboard.
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Field 1: Admin Email Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-bold text-[#172033]"
                  >
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="admin@fixaround.com"
                      required
                      autoComplete="username"
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F7FB] text-slate-900 text-xs sm:text-sm font-medium rounded-2xl border border-[#E5EAF2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498F6] focus:border-transparent transition-all placeholder:text-slate-400 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Field 2: Password with Show/Hide */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-bold text-[#172033]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="w-full pl-11 pr-11 py-3 bg-[#F4F7FB] text-slate-900 text-xs sm:text-sm font-medium rounded-2xl border border-[#E5EAF2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3498F6] focus:border-transparent transition-all placeholder:text-slate-400 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Additional Options: Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                      className="w-4 h-4 rounded text-[#3498F6] focus:ring-[#3498F6] border-slate-300 accent-[#3498F6] cursor-pointer"
                    />
                    <span className="font-semibold text-slate-600">Remember Me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="font-bold text-[#3498F6] hover:text-[#1976D2] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Primary Button: Login */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-full bg-[#3498F6] hover:bg-[#1976D2] active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" />
                        <span>Verifying Authorization...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Login</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Below Form: Security Notice Section */}
              <div className="pt-3 border-t border-[#E5EAF2]">
                <div className="p-3.5 rounded-2xl bg-[#F4F7FB] border border-[#E5EAF2] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#172033]">
                      Authorized Personnel Only
                    </h4>
                    <p className="text-[11px] text-[#7B8494] mt-0.5 leading-snug">
                      This area is restricted to authorized FixAround administrators. All login attempts are audited for security compliance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Back to Home Link */}
              <div className="text-center pt-1">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7B8494] hover:text-[#3498F6] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="text-center text-[11px] text-slate-400 pt-6">
              FixAround Administration &bull; Security Compliance &bull; TLS 1.3
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FORGOT PASSWORD MODAL (Requirement 7)                     */}
      {/* ========================================================= */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#3498F6] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    Admin Password Recovery
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Security Protocol Notice
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                For administrative accounts, self-service automated password recovery is disabled in accordance with the FixAround platform security policy.
              </p>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Administrative Recovery Procedure:
                </p>
                <p>
                  1. Contact the platform Super-Admin or Infrastructure Lead.
                </p>
                <p>
                  2. Present your verified hardware security token or organizational credentials.
                </p>
                <p>
                  3. An encrypted one-time administrative reset token will be dispatched to your registered enterprise inbox.
                </p>
              </div>

              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Send Recovery Request to Infrastructure Team:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@fixaround.com"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3498F6]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!email.trim()) {
                        showToast.error('Please enter your admin email address.');
                        return;
                      }
                      showToast.success('Admin recovery ticket dispatched to Infrastructure Ops.');
                      setShowForgotModal(false);
                    }}
                    className="px-4 py-2 bg-[#3498F6] text-white font-bold text-xs rounded-xl hover:bg-[#1976D2] transition-colors"
                  >
                    Request
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
