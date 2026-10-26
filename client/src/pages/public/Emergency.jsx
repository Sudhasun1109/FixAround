import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { servicesApi } from '../../services/api';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  Phone,
  Zap,
  MapPin,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function Emergency() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      showToast.error('Please select the service category');
      return;
    }
    if (!address.trim()) {
      showToast.error('Please specify your current address');
      return;
    }

    if (!isAuthenticated) {
      // Store temporary emergency data in sessionStorage and redirect to login/register
      sessionStorage.setItem(
        'fixaround_pending_emergency',
        JSON.stringify({
          categoryId: selectedCategory,
          address: address.trim(),
          description: description.trim(),
        })
      );
      showToast.info('Please sign in or create an account to dispatch emergency technician');
      navigate('/login?redirect=/customer/emergency');
      return;
    }

    // Authenticated user navigates to emergency request handler
    navigate(
      `/customer/emergency?categoryId=${selectedCategory}&address=${encodeURIComponent(address)}&desc=${encodeURIComponent(description)}`
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const { latitude, longitude } = pos.coords;
        setAddress(`Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Fetching exact street...)`);
        showToast.success('GPS coordinates retrieved');
      },
      (err) => {
        setLoading(false);
        showToast.error(`Location access denied: ${err.message}`);
      }
    );
  };

  return (
    <div className="space-y-16 py-10">
      {/* Red Alert Hero */}
      <section className="bg-gradient-to-b from-rose-950 via-slate-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-rose-900/60 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-6 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span>24/7 Rapid Emergency Response Active</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Emergency Repairs at Your Doorstep in <span className="text-rose-400">30 Minutes</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Plumbing overflows, total electrical blackouts, gas leaks, and jammed locks require immediate intervention. Our cascading dispatcher guarantees rapid response.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="tel:9597993402"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-rose-700 font-extrabold text-sm shadow-xl hover:bg-slate-100 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Call Emergency Dispatch: 1800-FIX-AROUND</span>
            </a>
          </div>
        </div>
      </section>

      {/* Quick Emergency Request Form */}
      <section className="max-w-3xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-200">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-3 rounded-xl bg-rose-100 text-rose-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Trigger Immediate Emergency Request
              </h2>
              <p className="text-xs text-slate-500">
                Nearest verified technician will be notified immediately upon submission.
              </p>
            </div>
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <Select
              label="Select Emergency Service Category"
              required
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              placeholder="Choose category (e.g. Electrician, Plumber)"
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Service Address / Location <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-xs font-semibold text-fixteal-600 hover:text-fixteal-700 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Detect My GPS
                </button>
              </div>
              <Input
                placeholder="Enter flat/house no, street, landmark, and pincode"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <Textarea
              label="Describe the Emergency Problem"
              placeholder="e.g. Main water pipe burst in master bathroom, water flooding living room floor."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <Button
              type="submit"
              variant="emergency"
              size="lg"
              fullWidth
              loading={loading}
              icon={ArrowRight}
              className="py-3.5 text-base"
            >
              Dispatch Nearest Technician Immediately
            </Button>
          </form>
        </div>
      </section>

      {/* How Emergency Backup Dispatch Works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Fail-Safe Technology
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-1">
            How FixAround Cascading Dispatch Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              Proximity Scan
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Using the Haversine spatial algorithm, our system isolates active, online technicians within your exact 10km radius.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              120s Acceptance Deadline
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The assigned pro receives high-priority acoustic alert with a 2-minute countdown. If unacknowledged, it auto-expires.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-fixteal-50 text-fixteal-600 flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-2">
              Instant Failover Cascade
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The system automatically cascades the dispatch offer to the next closest technician until secured.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
