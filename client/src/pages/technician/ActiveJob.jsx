import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsApi, estimatesApi } from '../../services/api';
import BookingTimeline from '../../components/booking/BookingTimeline';
import StatusBadge from '../../components/booking/StatusBadge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import InteractiveMap from '../../components/common/InteractiveMap';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  Clock,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Save,
  Wrench,
} from 'lucide-react';

export default function ActiveJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');

  // Job duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getById(id);
      const data = res?.data?.booking || res?.data || res;
      setBooking(data);
      setNotes(data.notes || '');

      // Load timeline
      try {
        const tRes = await bookingsApi.getTimeline(id);
        const tList = tRes?.data?.timeline || tRes?.data || [];
        setTimeline(Array.isArray(tList) ? tList : []);
      } catch {
        // Optional
      }

      // Load estimate
      try {
        const eRes = await estimatesApi.getByBooking(id);
        let eData = eRes?.data?.estimate || eRes?.data?.estimates || eRes?.data || eRes;
        if (Array.isArray(eData)) {
          eData = eData[0] || null;
        }
        if (eData?.id) setEstimate(eData);
      } catch {
        setEstimate(null);
      }
    } catch (err) {
      showToast.error(err.message || 'Active job not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Elapsed time counter
  useEffect(() => {
    if (!booking) return;
    const startTime = booking.started_at || booking.accepted_at || booking.created_at;
    if (!startTime) return;

    const startMs = new Date(startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  const handleTransition = async (nextStatus) => {
    try {
      setUpdating(true);
      await bookingsApi.updateStatus(id, nextStatus, notes);
      showToast.success(`Job updated to: ${nextStatus.replace(/_/g, ' ')}`);
      fetchJob();
    } catch (err) {
      showToast.error(err.message || 'Status transition failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setUpdating(true);
      await bookingsApi.updateStatus(id, booking.status, notes);
      showToast.success('Job notes saved.');
    } catch (err) {
      showToast.error(err.message || 'Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading job workflow..." />;
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Job Not Found</h2>
        <Link to="/technician/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const isEmergency = Boolean(booking.is_emergency || booking.urgency === 'emergency');

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top Banner / Timer */}
      <div className="bg-fixblue-900 text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-fixteal-300 font-bold">
              #{booking.booking_number || `BK-${booking.id}`}
            </span>
            {isEmergency && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                EMERGENCY JOB
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            {booking.service_name || booking.title}
          </h1>
        </div>

        {/* Stopwatch */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
          <Clock className="w-5 h-5 text-fixteal-400" />
          <div>
            <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">
              Elapsed Time
            </span>
            <span className="text-lg font-mono font-extrabold text-white">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Job State Progression
          </h3>
          <StatusBadge status={booking.status} size="sm" />
        </div>
        <BookingTimeline currentStatus={booking.status} history={timeline} />
      </div>

      {/* Primary Workflow Status Actions */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
        <h3 className="text-xs font-bold text-fixblue-900 uppercase tracking-wider">
          Action Required for Current State ({booking.status})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {booking.status === 'ACCEPTED' && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={updating}
              icon={Navigation}
              onClick={() => handleTransition('ON_THE_WAY')}
            >
              1. Mark On The Way
            </Button>
          )}

          {booking.status === 'ON_THE_WAY' && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={updating}
              icon={MapPin}
              onClick={() => handleTransition('ARRIVED')}
            >
              2. Mark Arrived at Site
            </Button>
          )}

          {booking.status === 'ARRIVED' && (
            <>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                icon={FileText}
                onClick={() => navigate(`/technician/estimates/new/${booking.id}`)}
              >
                Submit Estimate Quote
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={updating}
                icon={Wrench}
                onClick={() => handleTransition('IN_PROGRESS')}
              >
                Start Physical Work
              </Button>
            </>
          )}

          {booking.status === 'AWAITING_APPROVAL' && (
            <div className="col-span-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>Estimate submitted. Awaiting customer confirmation on their phone.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/technician/estimates/new/${booking.id}`)}
              >
                Revise Estimate
              </Button>
            </div>
          )}

          {booking.status === 'IN_PROGRESS' && (
            <>
              {!estimate && (
                <Button
                  variant="outline"
                  size="md"
                  icon={FileText}
                  onClick={() => navigate(`/technician/estimates/new/${booking.id}`)}
                >
                  Create Estimate
                </Button>
              )}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                icon={CheckCircle2}
                onClick={() => navigate(`/technician/jobs/${booking.id}/complete`)}
              >
                Complete Job & Finalize Billing
              </Button>
            </>
          )}

          {booking.status === 'COMPLETED' && (
            <div className="col-span-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Job is officially completed. Earnings recorded in your ledger.</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Location & Problem Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Customer Information
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <p className="text-sm font-bold text-slate-800">
              {booking.customer_name || 'Customer'}
            </p>
            {booking.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-fixteal-600" />
                <a href={`tel:${booking.customer_phone}`} className="font-semibold text-fixblue-900 hover:underline">
                  {booking.customer_phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p>{booking.customer_address}</p>
            </div>

            <div className="pt-2">
              <InteractiveMap
                latitude={booking.customer_latitude}
                longitude={booking.customer_longitude}
                markerTitle={booking.customer_name || 'Customer Location'}
                height="160px"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Technician Notes & Progress
          </h3>
          <textarea
            rows={4}
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fixteal-500"
            placeholder="Record notes on inspection findings, parts procured, or customer instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={Save}
              loading={updating}
              onClick={handleSaveNotes}
            >
              Save Progress Notes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
