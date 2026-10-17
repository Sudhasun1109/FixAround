import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { servicesApi } from '../../services/api';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { Wrench, Mail, Phone, Lock, User, MapPin, CheckCircle2 } from 'lucide-react';

export default function RegisterTechnician() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    experience_years: '3',
    service_city: 'New Delhi',
    service_pincode: '110001',
    service_radius_km: '15',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await servicesApi.getAll({ is_active: 1 });
        const list = res?.data?.categories || res?.data || [];
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (categoryId) => {
    setSelectedSkills((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError('Please provide all mandatory personal details');
      return;
    }

    if (selectedSkills.length === 0) {
      setError('Please select at least one primary service category/skill');
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
        role: 'technician',
        experience_years: parseInt(form.experience_years, 10) || 1,
        service_city: form.service_city.trim(),
        service_pincode: form.service_pincode.trim(),
        service_radius_km: parseFloat(form.service_radius_km) || 10,
        bio: form.bio.trim(),
        skills: selectedSkills,
      });

      showToast.success('Application submitted! Welcome to the FixAround Technician Network.');
      navigate('/technician/verification', { replace: true });
    } catch (err) {
      const msg = err.message || 'Technician registration failed';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-fixblue-800 flex items-center justify-center text-white shadow-md">
            <Wrench className="w-5 h-5 text-fixteal-400" />
          </div>
          <span className="text-2xl font-extrabold text-fixblue-900">
            Fix<span className="text-fixteal-600">Around</span>
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Join FixAround as a Service Professional
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Get continuous job bookings, direct digital settlements, and grow your local client base.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider mb-3">
              1. Personal & Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                placeholder="Suresh"
                value={form.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
              <Input
                label="Last Name"
                required
                placeholder="Kumar"
                value={form.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Email Address"
                type="email"
                required
                icon={Mail}
                placeholder="suresh@example.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <Input
                label="Mobile Phone"
                type="tel"
                required
                icon={Phone}
                placeholder="9200000001"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Create Password"
                type="password"
                required
                icon={Lock}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
            </div>
          </div>

          {/* Trade Skills */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider mb-2">
              2. Select Your Skills & Trades <span className="text-rose-500">*</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Select all categories where you have professional experience:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const isSelected = selectedSkills.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSkill(cat.id)}
                    className={`
                      p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all
                      ${
                        isSelected
                          ? 'border-fixteal-500 bg-teal-50/60 text-fixteal-900 ring-1 ring-fixteal-500 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }
                    `}
                  >
                    <span>{cat.name}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-fixteal-600 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coverage & Experience */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider mb-3">
              3. Service Area & Experience
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Years of Experience"
                type="number"
                min="0"
                max="50"
                value={form.experience_years}
                onChange={(e) => handleChange('experience_years', e.target.value)}
              />

              <Input
                label="Base City"
                value={form.service_city}
                onChange={(e) => handleChange('service_city', e.target.value)}
              />

              <Input
                label="Primary Pincode"
                value={form.service_pincode}
                onChange={(e) => handleChange('service_pincode', e.target.value)}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Service Radius (Kilometers)"
                type="number"
                min="1"
                max="50"
                value={form.service_radius_km}
                onChange={(e) => handleChange('service_radius_km', e.target.value)}
                helperText="How far are you willing to travel for emergency or standard jobs?"
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Professional Bio / Experience Highlights"
                placeholder="Briefly describe your certifications, brand expertise (e.g. Daikin, Havells, Kohler), or tools you carry."
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              loading={loading}
              icon={Wrench}
            >
              Submit Technician Application
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-fixteal-600 hover:text-fixteal-700">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
