import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { UserPlus, User, Mail, Phone, Lock, Wrench, ShieldCheck } from 'lucide-react';

export default function RegisterCustomer() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: 'customer',
      });

      showToast.success('Account created successfully! Welcome to FixAround.');

      // Check if user had an unsubmitted emergency
      const pendingEmergency = sessionStorage.getItem('fixaround_pending_emergency');
      if (pendingEmergency) {
        navigate('/customer/emergency', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
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
          Create Customer Account
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Book verified local repairs with warranty protection
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
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                placeholder="Priya"
                value={form.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
              <Input
                label="Last Name"
                required
                placeholder="Sharma"
                value={form.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="priya@example.com"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Phone Number"
              type="tel"
              icon={Phone}
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              autoComplete="tel"
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              icon={Lock}
              placeholder="Re-enter password"
              value={form.confirm_password}
              onChange={(e) => handleChange('confirm_password', e.target.value)}
              autoComplete="new-password"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={UserPlus}
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-fixteal-600 hover:text-fixteal-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
