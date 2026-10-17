import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { techniciansApi } from '../../services/api';
import AvailabilityToggle from '../../components/technician/AvailabilityToggle';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { showToast } from '../../components/common/Toast';
import { MapPin, Navigation, Clock, ShieldCheck, Save } from 'lucide-react';

export default function Availability() {
  const { user } = useAuth();

  const [isOnline, setIsOnline] = useState(Boolean(user?.is_online));
  const [isAvailable, setIsAvailable] = useState(Boolean(user?.is_available));
  const [radiusKm, setRadiusKm] = useState(15);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAvail = async () => {
      try {
        const res = await techniciansApi.getById(user?.id);
        const data = res?.data || res;
        setIsOnline(Boolean(data.is_online));
        setIsAvailable(Boolean(data.is_available));
        if (data.service_radius_km) setRadiusKm(Number(data.service_radius_km));
        if (data.latitude) setLatitude(data.latitude);
        if (data.longitude) setLongitude(data.longitude);
      } catch {
        // Fallback
      }
    };

    fetchAvail();
  }, [user]);

  const handleUpdateGPS = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);

          await techniciansApi.updateLocation({ latitude: lat, longitude: lng });
          showToast.success('Live GPS coordinates updated successfully!');
        } catch (err) {
          showToast.error(err.message || 'Failed to update location on server');
        } finally {
          setLoadingLocation(false);
        }
      },
      (err) => {
        setLoadingLocation(false);
        showToast.error(`Location access denied: ${err.message}`);
      }
    );
  };

  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      await techniciansApi.setAvailability({
        is_online: isOnline ? 1 : 0,
        is_available: isAvailable ? 1 : 0,
        service_radius_km: radiusKm,
      });
      showToast.success('Availability settings saved.');
    } catch (err) {
      showToast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Work Status
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Availability & Service Radius
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Control when you receive dispatch jobs and configure your active travel distance.
        </p>
      </div>

      {/* Online/Offline Control Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Online Work Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Switching online allows the platform to dispatch emergency and standard bookings to you.
            </p>
          </div>

          <AvailabilityToggle
            isOnline={isOnline}
            isAvailable={isAvailable}
            onToggle={(val) => {
              setIsOnline(val);
              setIsAvailable(val);
            }}
          />
        </div>

        {/* Radius Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Maximum Dispatch Radius
            </label>
            <span className="text-sm font-extrabold text-fixblue-900">
              {radiusKm} km
            </span>
          </div>

          <input
            type="range"
            min="2"
            max="50"
            step="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-fixteal-600 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Emergency requests within this distance from your current coordinates will be routed to your device.
          </p>
        </div>

        {/* Live GPS Coordinates */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Current Geographical Location
          </h3>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-fixteal-600 shrink-0" />
              <span>
                {latitude && longitude
                  ? `Latitude: ${Number(latitude).toFixed(4)}, Longitude: ${Number(longitude).toFixed(4)}`
                  : 'GPS coordinates not set. Update your current location.'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Navigation}
              onClick={handleUpdateGPS}
              loading={loadingLocation}
            >
              Update Live GPS
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            variant="primary"
            size="md"
            loading={saving}
            icon={Save}
            onClick={handleSaveAvailability}
          >
            Save Availability Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
