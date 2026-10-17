import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { servicesApi, techniciansApi, bookingsApi, addressesApi } from '../../services/api';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import PriceRange from '../../components/service/PriceRange';
import { showToast } from '../../components/common/Toast';
import {
  Calendar,
  AlertTriangle,
  MapPin,
  Clock,
  Wrench,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function CreateBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedCategory = searchParams.get('categoryId') || '';
  const preselectedTech = searchParams.get('technicianId') || '';

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(preselectedCategory);
  const [technicianId, setTechnicianId] = useState(preselectedTech);
  const [technicianName, setTechnicianName] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [scheduledAt, setScheduledAt] = useState('');

  // Address
  const [address, setAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await servicesApi.getAll({ is_active: 1 });
        const catList = catRes?.data?.categories || catRes?.data || [];
        setCategories(Array.isArray(catList) ? catList : []);

        // Load saved addresses
        try {
          const addrRes = await addressesApi.getAll();
          const addrList = addrRes?.data?.addresses || addrRes?.data || [];
          setSavedAddresses(Array.isArray(addrList) ? addrList : []);
          if (addrList.length > 0) {
            const def = addrList.find((a) => a.is_default) || addrList[0];
            setSelectedAddressId(def.id);
            setAddress(`${def.address_line1}, ${def.city} - ${def.pincode}`);
            if (def.latitude && def.longitude) {
              setLatitude(def.latitude);
              setLongitude(def.longitude);
            }
          }
        } catch {
          // Address loading is optional
        }

        // If specific tech requested, fetch name
        if (preselectedTech) {
          try {
            const techRes = await techniciansApi.getById(preselectedTech);
            const tech = techRes?.data || techRes;
            setTechnicianName(tech.full_name || `${tech.first_name || ''} ${tech.last_name || ''}`.trim());
          } catch {
            // Ignore tech load failure
          }
        }
      } catch (err) {
        console.error('Failed to load initial booking data:', err);
      }
    };

    initData();
  }, [preselectedTech]);

  const handleSavedAddressChange = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (!id) {
      setAddress('');
      return;
    }
    const found = savedAddresses.find((a) => String(a.id) === String(id));
    if (found) {
      setAddress(`${found.address_line1}, ${found.city} - ${found.pincode}`);
      setLatitude(found.latitude || null);
      setLongitude(found.longitude || null);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAddress(`GPS Coords: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        showToast.success('Location coordinates acquired');
      },
      (err) => {
        showToast.error(`Location error: ${err.message}`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      showToast.error('Please choose a service category');
      return;
    }
    if (!title.trim()) {
      showToast.error('Please enter a brief booking summary');
      return;
    }
    if (!address.trim()) {
      showToast.error('Please provide service address');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        category_id: selectedCategoryId,
        title: title.trim(),
        description: description.trim(),
        urgency,
        is_emergency: urgency === 'emergency' ? 1 : 0,
        customer_address: address.trim(),
        customer_latitude: latitude,
        customer_longitude: longitude,
        address_id: selectedAddressId ? parseInt(selectedAddressId, 10) : undefined,
        scheduled_at: urgency === 'normal' && scheduledAt ? scheduledAt : undefined,
        technician_id: technicianId ? parseInt(technicianId, 10) : undefined,
      };

      const res = await bookingsApi.create(payload);
      const bookingData = res?.data?.booking || res?.data || res;
      showToast.success('Booking request placed successfully!');
      navigate(`/customer/bookings/${bookingData.id || bookingData.booking_id}`);
    } catch (err) {
      const msg = err.message || 'Failed to submit booking';
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = categories.find((c) => String(c.id) === String(selectedCategoryId));

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          New Service Request
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-0.5">
          Schedule Doorstep Repair Service
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide problem details to get an itemized upfront quote and confirmed technician.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Body */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category selection */}
            <Select
              label="Service Category"
              required
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={categories.map((c) => ({
                value: c.id,
                label: `${c.name} (Warranty: ${c.warranty_period_days} days)`,
              }))}
              placeholder="Choose category (e.g. Electrician, Plumber)"
            />

            {technicianName && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs text-teal-800">
                <span>Preferred Specialist: <strong>{technicianName}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setTechnicianId('');
                    setTechnicianName('');
                  }}
                  className="text-fixteal-700 underline font-bold"
                >
                  Clear Preference
                </button>
              </div>
            )}

            {/* Urgency Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Service Urgency
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUrgency('normal')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    urgency === 'normal'
                      ? 'border-fixblue-800 bg-fixblue-50/50 ring-2 ring-fixblue-800 text-fixblue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <Calendar className="w-4 h-4 text-fixblue-800" />
                    <span>Standard Schedule</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Pick preferred appointment slot</p>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('emergency')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    urgency === 'emergency'
                      ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-600 text-rose-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Emergency (30 Min)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Immediate technician dispatch</p>
                </button>
              </div>
            </div>

            {/* Scheduled Date/Time if standard */}
            {urgency === 'normal' && (
              <Input
                label="Preferred Service Date & Time (Optional)"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            )}

            {/* Title & Description */}
            <Input
              label="Issue Summary"
              required
              placeholder="e.g. Master bathroom tap dripping constantly"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              label="Detailed Problem Description"
              placeholder="Explain what is broken, model numbers if known, and any safety hazards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            {/* Address */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Service Address <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="text-xs font-semibold text-fixteal-600 hover:text-fixteal-700 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Use GPS
                </button>
              </div>

              {savedAddresses.length > 0 && (
                <Select
                  value={selectedAddressId}
                  onChange={handleSavedAddressChange}
                  options={savedAddresses.map((a) => ({
                    value: a.id,
                    label: `${a.label || 'Address'}: ${a.address_line1}, ${a.city}`,
                  }))}
                  placeholder="Or choose a saved address"
                />
              )}

              <Input
                placeholder="Flat / House No, Street, Landmark, Pincode"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                type="submit"
                variant={urgency === 'emergency' ? 'emergency' : 'primary'}
                size="lg"
                fullWidth
                loading={loading}
                icon={ArrowRight}
              >
                {urgency === 'emergency' ? 'Dispatch Emergency Pro Now' : 'Confirm & Request Service'}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar Info & Indicative Rates */}
        <div className="space-y-5">
          {currentCategory ? (
            <PriceRange
              minPrice={currentCategory.min_price}
              maxPrice={currentCategory.max_price}
              inspectionCharge={currentCategory.inspection_charge}
            />
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 space-y-2">
              <h4 className="font-bold text-slate-800">Select a category</h4>
              <p>Choose an item on the left to inspect its transparent rate card and visiting fees.</p>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-fixblue-900 text-sm">Booking Guarantee</h4>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>You do not pay upfront. Payment is released after repair satisfaction.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>The technician will submit an itemized electronic estimate before touching any equipment.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
