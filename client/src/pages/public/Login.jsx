import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { LogIn, Lock, Mail, Wrench, ShieldCheck, User } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-fixblue-800 flex items-center justify-center text-white shadow-md">
            <Wrench className="w-5 h-5 text-fixteal-400" />
          </div>
          <span className="text-2xl font-extrabold text-fixblue-900">
            Fix<span className="text-fixteal-600">Around</span>
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Access your bookings, active jobs, or manage the platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={LogIn}
              >
                Sign In
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                shape="rectangular"
                theme="outline"
                size="large"
                width="100%"
                text="continue_with"
              />
            </div>

          </form>
          
          {/* Quick Demo Logins for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2.5">
              Quick Test Accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('priya.sharma@example.com', 'Customer')}
                className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200 transition-colors"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('suresh.electrician@example.com', 'Technician')}
                className="py-1.5 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-[11px] font-semibold text-fixteal-800 border border-teal-200 transition-colors"
              >
                Technician
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@fixaround.com', 'Admin')}
                className="py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[11px] font-semibold text-fixblue-900 border border-indigo-200 transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Registration Links */}
          <div className="mt-6 text-center space-y-2 text-xs">
            <p className="text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-fixteal-600 hover:text-fixteal-700">
                Sign up as Customer
              </Link>
            </p>
            <p className="text-slate-500">
              Are you a service technician?{' '}
              <Link to="/register-technician" className="font-bold text-fixblue-800 hover:text-fixblue-950">
                Join our expert network
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
