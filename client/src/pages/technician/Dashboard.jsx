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
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [incRes, activeRes, earnRes] = await Promise.all([
        bookingsApi.getIncomingRequests().catch(() => ({ data: [] })),
        bookingsApi.getAll({
          technician_id: user?.id,
          status: 'ACCEPTED,ON_THE_WAY,ARRIVED,IN_PROGRESS,AWAITING_APPROVAL',
        }).catch(() => ({ data: [] })),
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

  return (
    <div className="space-y-8">
      {/* Top Header with Online Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Technician Workspace
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Hello, {user?.first_name || 'Specialist'}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage incoming dispatch requests, ongoing jobs, and tracked earnings.
          </p>
        </div>

        <AvailabilityToggle
          isOnline={isOnline}
          isAvailable={isAvailable}
          onToggle={handleToggleOnline}
          loading={togglingStatus}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          label="Active Jobs"
          value={activeJobs.length}
          icon={Clock}
          color="blue"
          subtitle="Currently underway"
        />

        <StatsCard
          label="Incoming Requests"
          value={incomingRequests.length}
          icon={AlertTriangle}
          color={incomingRequests.length > 0 ? 'red' : 'teal'}
          subtitle={incomingRequests.length > 0 ? 'Awaiting your response' : 'No new requests'}
        />

        <StatsCard
          label="Earnings This Month"
          value={formatCurrency(earningsSummary?.monthly_earnings || 0)}
          icon={DollarSign}
          color="green"
          subtitle="Net after commission"
        />

        <StatsCard
          label="Pro Rating"
          value={`${user?.avg_rating || '4.8'} ★`}
          icon={Star}
          color="amber"
          subtitle={`${user?.review_count || 0} reviews`}
        />
      </div>

      {/* Incoming Requests Section (High Priority) */}
      {incomingRequests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
              <h2 className="text-lg font-bold text-fixblue-900">
                Incoming Dispatch Offers ({incomingRequests.length})
              </h2>
            </div>
            <Link
              to="/technician/requests"
              className="text-xs font-bold text-fixteal-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req) => (
              <div
                key={req.id || req.booking_id}
                className="bg-white rounded-2xl border-2 border-rose-300 p-5 shadow-md flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold font-mono text-slate-500">
                      #{req.booking_number || `BK-${req.booking_id || req.id}`}
                    </span>
                    {req.is_emergency ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                        EMERGENCY 30M
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        STANDARD
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    {req.service_name || req.title || 'Emergency Repair Request'}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {req.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-3">
                    <MapPin className="w-3.5 h-3.5 text-fixteal-600 shrink-0" />
                    <span className="truncate">{req.customer_address || 'Address provided'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={X}
                    onClick={() => handleRejectRequest(req.booking_id || req.id)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Decline
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Check}
                    onClick={() => handleAcceptRequest(req.booking_id || req.id)}
                  >
                    Accept Job
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ongoing Active Jobs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-fixblue-900">
            Active Jobs Underway ({activeJobs.length})
          </h2>
        </div>

        {loading ? (
          <Spinner size="lg" label="Loading jobs..." className="py-12" />
        ) : activeJobs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-500">
            You currently have no active jobs in progress. Keep your toggle online to receive requests.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold font-mono text-fixblue-900">
                      #{job.booking_number || `BK-${job.id}`}
                    </span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>

                  <h4 className="text-base font-bold text-slate-800 mt-2">
                    {job.service_name || job.title}
                  </h4>

                  <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Client:</span>
                      <span>{job.customer_name || 'Customer'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.customer_address}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estimate</span>
                    <span className="font-bold text-fixblue-900">
                      {job.estimated_total ? formatCurrency(job.estimated_total) : 'Not submitted yet'}
                    </span>
                  </div>

                  <Link to={`/technician/active-job/${job.id}`}>
                    <Button variant="primary" size="sm" icon={ArrowRight}>
                      Manage Job
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
