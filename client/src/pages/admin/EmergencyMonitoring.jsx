import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, techniciansApi } from '../../services/api';
import StatusBadge from '../../components/booking/StatusBadge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, formatDistance } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  AlertTriangle,
  Radio,
  Clock,
  MapPin,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  PhoneCall,
} from 'lucide-react';

export default function EmergencyMonitoring() {
  const [emergencyBookings, setEmergencyBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Intervention modal
  const [interveneBooking, setInterveneBooking] = useState(null);
  const [overrideTechId, setOverrideTechId] = useState('');
  const [intervening, setIntervening] = useState(false);

  const fetchEmergencies = useCallback(async () => {
    try {
      setLoading(true);
      let list = [];
      try {
        const res = await adminApi.getEmergencyBookings();
        list = res?.data?.bookings || res?.data || [];
      } catch {
        const resAll = await adminApi.getBookings({ is_emergency: 1 });
        list = resAll?.data?.bookings || resAll?.data || [];
      }

      setEmergencyBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load emergency monitoring feed:', err);
      setEmergencyBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 10000); // 10s live pulse
    return () => clearInterval(interval);
  }, [fetchEmergencies]);

  useEffect(() => {
    const fetchTechs = async () => {
      try {
        const res = await techniciansApi.getAll({ is_available: 1 });
        const list = res?.data?.technicians || res?.data || [];
        setTechnicians(Array.isArray(list) ? list : []);
      } catch {
        // Optional
      }
    };
    fetchTechs();
  }, []);

  const handleInterveneSubmit = async (e) => {
    e.preventDefault();
    if (!overrideTechId) {
      showToast.error('Please pick a technician for manual emergency dispatch override');
      return;
    }

    try {
      setIntervening(true);
      await adminApi.reassignBooking(interveneBooking.id, parseInt(overrideTechId, 10));
      showToast.success('Emergency manual override dispatched!');
      setInterveneBooking(null);
      setOverrideTechId('');
      fetchEmergencies();
    } catch (err) {
      showToast.error(err.message || 'Failed to dispatch override');
    } finally {
      setIntervening(false);
    }
  };

  const activeEmergencies = emergencyBookings.filter(
    (b) => !['COMPLETED', 'CANCELLED'].includes(b.status)
  );

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-fixblue-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/20 text-white animate-pulse">
            <Radio className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
              Live Dispatch Radar (10s sync)
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              Emergency Services Monitoring
            </h1>
            <p className="text-xs text-rose-100 mt-0.5">
              Rapid response telemetry, cascade countdown tracking, and administrator intervention controls.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchEmergencies}
          className="border-white/30 text-white hover:bg-white/10 shrink-0"
        >
          Sync Radar
        </Button>
      </div>

      {/* Emergency Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active In-Flight Calls
            </span>
            <span className="text-2xl font-extrabold text-rose-600">
              {activeEmergencies.length}
            </span>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              SLA Standard Target
            </span>
            <span className="text-2xl font-extrabold text-fixblue-900">
              &lt; 30 Mins
            </span>
          </div>
          <Clock className="w-8 h-8 text-fixteal-600" />
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Auto-Cascade Timeout
            </span>
            <span className="text-2xl font-extrabold text-slate-800">
              120s / tech
            </span>
          </div>
          <ShieldAlert className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Live Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Emergency Dispatches ({emergencyBookings.length})
          </h3>
        </div>

        {loading && emergencyBookings.length === 0 ? (
          <Spinner size="lg" label="Polling radar telemetry..." className="py-16" />
        ) : emergencyBookings.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="All quiet on emergency radar"
            description="There are currently no active emergency calls awaiting technician assignment."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Emergency #</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Customer & Location</th>
                  <th className="py-3 px-4">Technician Assigned</th>
                  <th className="py-3 px-4 text-center">Cascade Attempts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {emergencyBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      #{b.booking_number || `EM-${b.id}`}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {b.service_name || b.title}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{b.customer_name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{b.customer_address}</p>
                    </td>

                    <td className="py-3 px-4">
                      {b.technician_name ? (
                        <div>
                          <p className="font-bold text-slate-800">{b.technician_name}</p>
                          <p className="text-[10px] text-slate-400">{b.technician_phone}</p>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-bold animate-pulse">
                          Cascading Dispatches...
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {b.assignment_attempts || 1}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="xs" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!['COMPLETED', 'CANCELLED'].includes(b.status) && (
                        <Button
                          variant="emergency"
                          size="sm"
                          icon={UserCheck}
                          onClick={() => {
                            setInterveneBooking(b);
                            setOverrideTechId('');
                          }}
                        >
                          Override Tech
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Override Modal */}
      <Modal
        isOpen={Boolean(interveneBooking)}
        onClose={() => setInterveneBooking(null)}
        title="Admin Manual Emergency Dispatch Override"
        size="md"
      >
        {interveneBooking && (
          <form onSubmit={handleInterveneSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
              <span className="font-bold block mb-0.5">Emergency Incident #{interveneBooking.booking_number || interveneBooking.id}</span>
              <p>{interveneBooking.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Force-Assign Standby Specialist
              </label>
              <select
                value={overrideTechId}
                onChange={(e) => setOverrideTechId(e.target.value)}
                className="w-full text-xs font-semibold py-2.5 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select available standby specialist</option>
                {technicians.map((t) => (
                  <option key={t.user_id || t.id} value={t.user_id || t.id}>
                    {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`} ({t.service_city || 'Delhi'} &bull; Phone: {t.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInterveneBooking(null)}
                disabled={intervening}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                loading={intervening}
              >
                Dispatch Manual Override
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
