import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { servicesApi, bookingsApi, addressesApi } from '../../services/api';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { showToast } from '../../components/common/Toast';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Radio,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export default function EmergencyRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryCat = searchParams.get('categoryId') || '';
  const queryAddr = searchParams.get('address') || '';
  const queryDesc = searchParams.get('desc') || '';

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(queryCat);
  const [address, setAddress] = useState(queryAddr);
  const [description, setDescription] = useState(queryDesc);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState(null); // 'broadcasting' | 'matched'

  useEffect(() => {
    // Check if session had pending emergency data from public page
    const pending = sessionStorage.getItem('fixaround_pending_emergency');
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        if (parsed.categoryId) setSelectedCategory(parsed.categoryId);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.description) setDescription(parsed.description);
        sessionStorage.removeItem('fixaround_pending_emergency');
      } catch {
        // Ignore JSON error
      }
    }

    const fetchCategories = async () => {
      try {
        const res = await servicesApi.getAll({ is_active: 1 });
        const list = res?.data?.categories || res?.data || [];
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();

    // Auto-attempt geolocation if no address provided
    if (!queryAddr && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {
          // Silent fallback to manual address
        }
      );
    }
  }, [queryAddr]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAddress(`GPS Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        showToast.success('Acquired GPS coordinates');
      },
      (err) => {
        showToast.error(`Location access denied: ${err.message}`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      showToast.error('Please select the service category');
      return;
    }
    if (!address.trim()) {
      showToast.error('Please enter your service address');
      return;
    }

    try {
      setSubmitting(true);
      setDispatchStatus('broadcasting');

      const payload = {
        category_id: selectedCategory,
        title: `EMERGENCY: Immediate Repair Request`,
        description: description.trim() || 'Immediate emergency repair needed.',
        urgency: 'emergency',
        is_emergency: 1,
        customer_address: address.trim(),
        customer_latitude: latitude,
        customer_longitude: longitude,
      };

      const res = await bookingsApi.create(payload);
      const bookingData = res?.data?.booking || res?.data || res;

      // Simulate rapid cascade animation for 1.8s
      setTimeout(() => {
        setDispatchStatus('matched');
        setTimeout(() => {
          showToast.success('Emergency request broadcasted! Dispatching nearest technician.');
          navigate(`/customer/bookings/${bookingData.id || bookingData.booking_id}`);
        }, 1200);
      }, 1800);
    } catch (err) {
      setDispatchStatus(null);
      setSubmitting(false);
      showToast.error(err.message || 'Failed to dispatch emergency request');
    }
  };

  if (dispatchStatus === 'broadcasting') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center animate-ping absolute" />
          <div className="w-24 h-24 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl relative z-10">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-fixblue-900">
            Finding Nearest Available Technician...
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Scanning 10km radius. Alerting active verified technicians with a 2-minute acknowledgment timer.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          Do not close this page. Automatic cascading dispatch is currently active.
        </div>
      </div>
    );
  }

  if (dispatchStatus === 'matched') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Emergency Call Successfully Queued!
        </h2>
        <p className="text-xs text-slate-500">
          Redirecting to live booking tracking...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Alert Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-white/20 text-white shrink-0">
          <AlertTriangle className="w-7 h-7 text-amber-200" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
            Rapid Response Mode
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">
            24/7 Immediate Emergency Dispatch
          </h1>
          <p className="text-xs text-rose-100 mt-1">
            Target arrival under 30 mins with automatic failover backup.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-rose-200 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="What is the emergency category?"
            required
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={categories.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.warranty_period_days}d Warranty)`,
            }))}
            placeholder="Select category (e.g. Electrician, Plumber)"
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Emergency Location <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs font-semibold text-fixteal-600 hover:text-fixteal-700 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                Auto-Detect GPS
              </button>
            </div>
            <Input
              placeholder="House/Flat No, Apartment, Street, Landmark"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <Textarea
            label="Briefly describe the emergency hazard"
            required
            placeholder="e.g. Main electrical distribution box is sparking and smoke is emerging."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="emergency"
              size="lg"
              fullWidth
              loading={submitting}
              icon={ArrowRight}
              className="py-3.5 text-base font-extrabold"
            >
              Trigger Rapid Dispatch Now
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
