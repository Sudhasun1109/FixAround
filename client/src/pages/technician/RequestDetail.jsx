import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/booking/StatusBadge';
import { showToast } from '../../components/common/Toast';
import { formatDateTime, formatDistance } from '../../utils/formatters';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  Check,
  X,
  Phone,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await bookingsApi.getById(id);
        const data = res?.data?.booking || res?.data || res;
        setBooking(data);
      } catch (err) {
        showToast.error(err.message || 'Request not found');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleAccept = async () => {
    try {
      setActing(true);
      await bookingsApi.accept(id);
      showToast.success('Job accepted! Routing to active job tracking.');
      navigate(`/technician/active-job/${id}`);
    } catch (err) {
      showToast.error(err.message || 'Failed to accept job');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    try {
      setActing(true);
      await bookingsApi.reject(id, 'Declined by technician from detail view');
      showToast.info('Request declined. Job has been re-routed.');
      navigate('/technician/requests');
    } catch (err) {
      showToast.error(err.message || 'Failed to decline job');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading request details..." />;
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Job Not Found</h2>
        <Link to="/technician/requests">
          <Button variant="outline" icon={ArrowLeft}>
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  const isEmergency = Boolean(booking.is_emergency || booking.urgency === 'emergency');

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <Link
        to="/technician/requests"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Incoming Requests</span>
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-400">
                #{booking.booking_number || `BK-${booking.id}`}
              </span>
              {isEmergency && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                  EMERGENCY
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-fixblue-900">
              {booking.service_name || booking.title}
            </h1>
          </div>

          <StatusBadge status={booking.status} size="md" />
        </div>

        {/* Customer & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              Customer Details
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {booking.customer_name || 'Customer'}
            </p>
            {booking.customer_phone && (
              <p className="text-slate-500">Phone: {booking.customer_phone}</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              Destination Location
            </span>
            <div className="flex items-start gap-1.5 text-slate-700">
              <MapPin className="w-4 h-4 text-fixteal-600 shrink-0 mt-0.5" />
              <span>{booking.customer_address || 'Address provided upon acceptance'}</span>
            </div>
            {booking.distance !== undefined && (
              <p className="text-fixteal-700 font-bold">
                Distance: {formatDistance(booking.distance)}
              </p>
            )}
          </div>
        </div>

        {/* Problem Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Problem Description
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {booking.description || 'No additional details specified.'}
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>
            Scheduled Timing: {booking.scheduled_at ? formatDateTime(booking.scheduled_at) : 'Immediate Emergency Dispatch'}
          </span>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="md"
            icon={X}
            disabled={acting}
            onClick={handleReject}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Decline Request
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={Check}
            loading={acting}
            onClick={handleAccept}
          >
            Accept Job & Go to Job Tracker
          </Button>
        </div>
      </div>
    </div>
  );
}
