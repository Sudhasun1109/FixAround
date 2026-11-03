import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { LogIn, Lock, Mail, Wrench, ShieldCheck, User, Sparkles, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || null;

  const handleRedirect = (user) => {
    if (from) {
      navigate(from, { replace: true });
    } else if (user.role === ROLES.ADMIN) {
      navigate('/admin/dashboard', { replace: true });
    } else if (user.role === ROLES.TECHNICIAN) {
      navigate('/technician/dashboard', { replace: true });
    } else {
      navigate('/customer/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { user } = await login({ email, password });
      showToast.success(`Welcome back, ${user.first_name || 'User'}!`);
      handleRedirect(user);
    } catch (err) {
      const msg = err.message || 'Invalid email or password';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google did not provide a valid login credential');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { user } = await googleLogin(credentialResponse.credential, ROLES.CUSTOMER);
      showToast.success(`Welcome, ${user.first_name || 'User'}! Signed in with Google.`);
      handleRedirect(user);
    } catch (err) {
      const msg = err.message || 'Google sign-in failed. Please try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or encountered an error.');
    showToast.error('Google sign-in failed');
  };

  // Quick fill helper for testers
  const fillCredentials = (userEmail, userRole) => {
    setEmail(userEmail);
    setPassword('Password123!');
    showToast.info(`Filled credentials for ${userRole}`);
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-fixblue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Fix<span className="text-fixblue-500">Around</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Access your bookings, track emergency technicians, or manage orders.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-card rounded-3xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                shape="pill"
                theme="outline"
                size="large"
                width="100%"
                text="continue_with"
              />
            </div>
          </form>

          {/* Quick Demo Logins for Evaluator / Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2.5">
              Quick Test Credentials
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('priya.sharma@example.com', 'Customer')}
                className="py-1.5 px-2 rounded-full bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('suresh.electrician@example.com', 'Technician')}
                className="py-1.5 px-2 rounded-full bg-blue-50 hover:bg-blue-100 text-[11px] font-bold text-fixblue-600 border border-blue-200 transition-colors"
              >
                Technician
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@fixaround.com', 'Admin')}
                className="py-1.5 px-2 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-900 border border-slate-300 transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Registration Links */}
          <div className="mt-6 text-center space-y-2 text-xs">
            <p className="text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-fixblue-500 hover:text-fixblue-600">
                Sign up as Customer
              </Link>
            </p>
            <p className="text-slate-500 font-medium">
              Are you a service professional?{' '}
              <Link to="/register-technician" className="font-bold text-slate-700 hover:text-fixblue-500">
                Join our expert network
              </Link>
            </p>
            <p className="text-slate-400 font-medium pt-2 border-t border-slate-100">
              Platform administrator?{' '}
              <Link to="/admin/login" className="font-bold text-fixblue-500 hover:text-fixblue-600 inline-flex items-center gap-1">
                <span>Access Admin Portal</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
