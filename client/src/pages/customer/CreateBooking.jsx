import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { servicesApi, techniciansApi, bookingsApi, addressesApi } from '../../services/api';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import PriceRange from '../../components/service/PriceRange';
import InteractiveMap from '../../components/common/InteractiveMap';
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

  const rawCat = searchParams.get('categoryId');
  const preselectedCategory = rawCat && rawCat !== 'undefined' && rawCat !== 'null' ? rawCat : '';
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
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('110001');
  const [statesList, setStatesList] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await servicesApi.getAll({ is_active: 1 });
        const catList = catRes?.data?.categories || catRes?.data || [];
        setCategories(Array.isArray(catList) ? catList : []);

        // Load states dynamically from API
        try {
          const statesRes = await servicesApi.getStates();
          const rawList = statesRes?.data?.states || statesRes?.data || [];
          const list = Array.isArray(rawList)
            ? rawList.map((item) => (typeof item === 'object' && item !== null ? item.name || item.code : String(item)))
            : [];
          if (list.length > 0) {
            setStatesList(list);
            if (!state) setState(list[0]);
          }
        } catch (err) {
          console.warn('Failed to fetch states from API:', err);
        }

        // Load saved addresses
        try {
          const addrRes = await addressesApi.getAll();
          const addrList = addrRes?.data?.addresses || addrRes?.data || [];
          setSavedAddresses(Array.isArray(addrList) ? addrList : []);
          if (addrList.length > 0) {
            const def = addrList.find((a) => a.is_default) || addrList[0];
            setSelectedAddressId(def.id);
            setStreetAddress(def.address_line1 || '');
            setCity(def.city || 'New Delhi');
            setState(def.state || 'Delhi');
            setPincode(def.pincode || '110001');
            setAddress(`${def.address_line1}, ${def.city}, ${def.state || 'Delhi'} - ${def.pincode}`);
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
      return;
    }
    const found = savedAddresses.find((a) => String(a.id) === String(id));
    if (found) {
      setStreetAddress(found.address_line1 || '');
      setCity(found.city || 'New Delhi');
      setState(found.state || 'Delhi');
      setPincode(found.pincode || '110001');
      setAddress(`${found.address_line1}, ${found.city}, ${found.state || 'Delhi'} - ${found.pincode}`);
      setLatitude(found.latitude || null);
      setLongitude(found.longitude || null);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.state_district || 'New Delhi';
            const detectedState = addr.state || 'Delhi';
            const detectedPostcode = addr.postcode || '';
            const road = [addr.house_number, addr.road, addr.neighbourhood].filter(Boolean).join(', ');

            if (road) setStreetAddress(road);
            if (detectedCity) setCity(detectedCity);
            if (detectedState) setState(detectedState);
            if (detectedPostcode) setPincode(detectedPostcode);

            const compiled = `${road || 'Current Location'}, ${detectedCity}, ${detectedState} - ${detectedPostcode}`;
            setAddress(compiled);
            showToast.success('Live location and address detected!');
          } else {
            setAddress(`GPS Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            showToast.success('Location coordinates acquired');
          }
        } catch {
          setAddress(`GPS Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          showToast.success('Location coordinates acquired');
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        showToast.error(`Location error: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
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

    const finalAddress = streetAddress.trim()
      ? `${streetAddress.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`
      : address.trim();

    if (!finalAddress) {
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
        customer_address: finalAddress,
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
                label: c.name,
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
                  disabled={detectingGps}
                  className="text-xs font-semibold text-fixteal-600 hover:text-fixteal-700 flex items-center gap-1.5 px-2.5 py-1 bg-fixteal-50 rounded-lg border border-fixteal-200"
                >
                  <MapPin className="w-3.5 h-3.5 text-fixteal-600" />
                  {detectingGps ? 'Locating...' : 'Use Live GPS'}
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
                label="House / Flat / Street Address"
                placeholder="e.g. Flat 402, Sunshine Heights, Main Road"
                required
                value={streetAddress || address}
                onChange={(e) => {
                  setStreetAddress(e.target.value);
                  setAddress(e.target.value);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="City"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs font-semibold py-2 px-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500 h-[38px]"
                    required
                  >
                    {statesList.length > 0 ? (
                      statesList.map((st) => {
                        const val = typeof st === 'object' && st !== null ? st.name || st.code : String(st);
                        const label = typeof st === 'object' && st !== null ? st.name || st.code : String(st);
                        return (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        );
                      })
                    ) : (
                      <>
                        <option value="Delhi">Delhi</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                      </>
                    )}
                  </select>
                </div>

                <Input
                  label="Pincode"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-fixteal-600" />
                    Interactive Map Pin
                  </span>
                  <span>Click map to adjust location pin</span>
                </div>
                <InteractiveMap
                  latitude={latitude}
                  longitude={longitude}
                  markerTitle="Service Address"
                  height="180px"
                  onLocationSelect={({ latitude: lat, longitude: lng }) => {
                    setLatitude(lat);
                    setLongitude(lng);
                    showToast.success('Location pinpointed on map');
                  }}
                />
              </div>
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
