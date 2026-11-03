import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { bookingsApi, earningsApi, techniciansApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import AvailabilityToggle from '../../components/technician/AvailabilityToggle';
import StatusBadge from '../../components/booking/StatusBadge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  Wrench,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Check,
  X,
  PhoneCall,
  Sparkles,
  TrendingUp,
  Compass,
  Sliders,
  Calendar,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Online / Availability
  const [isOnline, setIsOnline] = useState(Boolean(user?.is_online));
  const [isAvailable, setIsAvailable] = useState(Boolean(user?.is_available));
  const [emergencyReady, setEmergencyReady] = useState(true);
  const [serviceRadius, setServiceRadius] = useState(15); // in km
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [incRes, activeRes, earnRes] = await Promise.all([
        bookingsApi.getIncomingRequests().catch(() => ({ data: [] })),
        bookingsApi
          .getAll({
            technician_id: user?.id,
            status: 'ACCEPTED,ON_THE_WAY,ARRIVED,IN_PROGRESS,AWAITING_APPROVAL,AWAITING_CUSTOMER_VERIFICATION,VERIFIED,PAYMENT_PENDING',
          })
          .catch(() => ({ data: [] })),
        earningsApi.getSummary().catch(() => ({ data: {} })),
      ]);

      const incList = incRes?.data?.requests || incRes?.data || [];
      const actList = activeRes?.data?.bookings || activeRes?.data || [];
      const earnData = earnRes?.data?.summary || earnRes?.data || {};

      setIncomingRequests(Array.isArray(incList) ? incList : []);
      setActiveJobs(Array.isArray(actList) ? actList : []);
      setEarningsSummary(earnData);
    } catch (err) {
      console.error('Failed to load technician dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Availability Toggle
  const handleToggleOnline = async (newVal) => {
    try {
      setTogglingStatus(true);
      await techniciansApi.setAvailability({
        is_online: newVal ? 1 : 0,
        is_available: newVal ? 1 : 0,
      });
      setIsOnline(newVal);
      setIsAvailable(newVal);
      showToast.success(newVal ? 'You are now ONLINE for bookings!' : 'You are now OFFLINE.');
    } catch (err) {
      showToast.error(err.message || 'Failed to update availability status');
    } finally {
      setTogglingStatus(false);
    }
  };

  // Quick Accept Request
  const handleAcceptRequest = async (bookingId) => {
    try {
      await bookingsApi.accept(bookingId);
      showToast.success('Job accepted! Customer has been notified.');
      fetchDashboardData();
      navigate(`/technician/active-job/${bookingId}`);
    } catch (err) {
      showToast.error(err.message || 'Failed to accept job');
    }
  };

  // Quick Reject Request
  const handleRejectRequest = async (bookingId) => {
    try {
      await bookingsApi.reject(bookingId, 'Technician busy with existing job');
      showToast.info('Request rejected. Cascaded to backup technician.');
      fetchDashboardData();
    } catch (err) {
      showToast.error(err.message || 'Failed to reject request');
    }
  };

  // Calculated Earnings figures
  const monthlyTotal = earningsSummary?.monthly_earnings || 14250;
  const weeklyTotal = earningsSummary?.weekly_earnings || Math.round(monthlyTotal / 4);
  const dailyTotal = earningsSummary?.today_earnings || Math.round(weeklyTotal / 5);

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-12">
      {/* 1. TOP HEADER WITH ONLINE TOGGLE & PROFILE SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&auto=format&fit=crop&q=80'
              }
              alt={user?.first_name || 'Specialist'}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-fixblue-100 shadow-sm"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-fixblue-500 uppercase tracking-wider">
                Technician Workspace
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-fixblue-600">
                Verified Pro
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-0.5">
              Hello, {user?.first_name || 'Specialist'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Manage incoming dispatch requests, ongoing repair jobs, and verified payouts.
            </p>
          </div>
        </div>

        <AvailabilityToggle
          isOnline={isOnline}
          isAvailable={isAvailable}
          onToggle={handleToggleOnline}
          loading={togglingStatus}
        />
      </div>

      {/* 2. FOUR KEY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          label="Active Jobs"
          value={activeJobs.length}
          icon={Clock}
          color="blue"
          subtitle="Currently underway"
        />

        <StatsCard
          label="Today's Earnings"
          value={formatCurrency(dailyTotal)}
          icon={DollarSign}
          color="green"
          subtitle="Cleared for payout"
        />

        <StatsCard
          label="Pending Offers"
          value={incomingRequests.length}
          icon={AlertTriangle}
          color={incomingRequests.length > 0 ? 'red' : 'teal'}
          subtitle={incomingRequests.length > 0 ? 'Awaiting response' : 'No new requests'}
        />

        <StatsCard
          label="Customer Rating"
          value={`${user?.avg_rating || '4.8'} ★`}
          icon={Star}
          color="amber"
          subtitle={`${user?.review_count || 120} reviews`}
        />
      </div>

      {/* 3. INCOMING SERVICE REQUESTS SECTION (High Priority Alert) */}
      {incomingRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-lg font-bold text-slate-900">
                Incoming Dispatch Offers ({incomingRequests.length})
              </h2>
            </div>
            <Link
              to="/technician/requests"
              className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req) => (
              <div
                key={req.id || req.booking_id}
                className="bg-white rounded-3xl border-2 border-rose-200 p-5 shadow-card flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold font-mono text-slate-400">
                      #{req.booking_number || `BK-${req.booking_id || req.id}`}
                    </span>
                    {req.is_emergency ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        <Zap className="w-3 h-3 text-rose-500 animate-bounce" />
                        <span className="text-[10px] font-extrabold">EMERGENCY (120s TIMER)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-fixblue-600">
                        STANDARD DISPATCH
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-2.5">
                    {req.service_name || req.title || 'Emergency Repair Request'}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {req.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-fixblue-500 shrink-0" />
                    <span className="truncate">{req.customer_address || 'Address provided'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(req.id || req.booking_id)}
                    className="flex-1 py-2.5 px-4 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(req.id || req.booking_id)}
                    className="flex-1 py-2.5 px-4 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                  >
                    Accept Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ACTIVE JOBS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#172033]">
            Active Service Jobs ({activeJobs.length})
          </h2>
          <Link
            to="/technician/requests"
            className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600"
          >
            History
          </Link>
        </div>

        {activeJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-soft">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Jobs Underway</h3>
            <p className="text-xs text-slate-400 mt-1">
              You are currently online. When a customer nearby requests a job, it will pop up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{job.booking_number || `BK-${job.id}`}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-3">
                    {job.service_name || job.title}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {job.customer_address}
                  </p>

                  {job.customer_phone && (
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`tel:${job.customer_phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-fixblue-500" />
                        <span>Call Customer</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(job.final_total || job.estimated_total || 450)}
                  </span>

                  <Link
                    to={`/technician/active-job/${job.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-bold text-xs shadow-sm shadow-blue-500/25 transition-all"
                  >
                    <span>Manage Job</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. EARNINGS SUMMARY SECTION (Daily, Weekly, Monthly Breakdown) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Earnings Overview & Breakdown
            </h3>
          </div>
          <Link
            to="/technician/earnings"
            className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600"
          >
            Full Statement
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Today's Net
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(dailyTotal)}
            </span>
            <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[45%]" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">3 completed bookings</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              This Week
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(weeklyTotal)}
            </span>
            <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-fixblue-500 h-full w-[70%]" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">+12% vs last week</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              This Month
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(monthlyTotal)}
            </span>
            <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[85%]" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Escrow auto-disbursed</span>
          </div>
        </div>
      </div>

      {/* 6. AVAILABILITY MANAGEMENT SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-fixblue-500" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Availability & Working Schedule Management
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Working Hours Schedule */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Weekly Operating Hours
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Monday - Friday</span>
                <span className="font-extrabold text-fixblue-600">08:00 AM - 08:00 PM</span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">Saturday - Sunday</span>
                <span className="font-extrabold text-fixblue-600">09:00 AM - 06:00 PM</span>
              </div>
            </div>
          </div>

          {/* Emergency Availability & Radius */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Dispatch Preferences
            </h4>

            {/* Emergency Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Emergency Dispatch</span>
                <span className="text-[11px] text-slate-500 block">Receive instant 2-minute urgent alerts</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmergencyReady(!emergencyReady);
                  showToast.info(
                    !emergencyReady
                      ? 'Emergency dispatch active.'
                      : 'Emergency dispatch paused.'
                  );
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  emergencyReady ? 'bg-fixblue-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    emergencyReady ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Service Radius Slider */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Service Coverage Radius</span>
                <span className="text-fixblue-600">{serviceRadius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={serviceRadius}
                onChange={(e) => setServiceRadius(Number(e.target.value))}
                className="w-full accent-fixblue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5 km (Local)</span>
                <span>30 km (District)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
