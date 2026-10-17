import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import {
  Clock,
  MapPin,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

function CountdownTimer({ deadline, onExpire }) {
  const calculateRemaining = () => {
    if (!deadline) return 120; // default 2 minutes
    const diff = Math.floor((new Date(deadline).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft < 30;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
        isUrgent
          ? 'bg-rose-100 text-rose-700 animate-pulse'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} remaining
      </span>
    </div>
  );
}

export default function IncomingRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getIncomingRequests();
      const list = res?.data?.requests || res?.data || [];
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load incoming requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    // Refresh every 15s for new offers
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAccept = async (bookingId) => {
    try {
      await bookingsApi.accept(bookingId);
      showToast.success('Job confirmed! Proceed to customer location.');
      navigate(`/technician/active-job/${bookingId}`);
    } catch (err) {
      showToast.error(err.message || 'Failed to accept job');
      fetchRequests();
    }
  };

  const handleReject = async (bookingId) => {
    try {
      await bookingsApi.reject(bookingId, 'Technician declined request');
      showToast.info('Request declined. Cascaded to backup technician.');
      fetchRequests();
    } catch (err) {
      showToast.error(err.message || 'Failed to decline request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Job Dispatch Offers
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Incoming Job Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accept or decline nearby dispatch requests before the auto-cascade timer expires.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchRequests}
        >
          Check for New Jobs
        </Button>
      </div>

      {loading ? (
        <Spinner size="lg" label="Listening for job dispatches..." className="py-16" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No pending requests right now"
          description="Make sure your status is toggled ONLINE and your GPS location is up to date to receive job dispatches."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const bookingId = req.booking_id || req.id;
            const isEmergency = Boolean(req.is_emergency || req.urgency === 'emergency');

            return (
              <div
                key={req.id || bookingId}
                className={`bg-white rounded-3xl p-6 border-2 transition-all shadow-md ${
                  isEmergency ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      #{req.booking_number || `BK-${bookingId}`}
                    </span>
                    {isEmergency && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        EMERGENCY 30 MIN
                      </span>
                    )}
                  </div>

                  <CountdownTimer
                    deadline={req.deadline || req.expires_at}
                    onExpire={fetchRequests}
                  />
                </div>

                <div className="py-4 space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {req.service_name || req.title || 'Local Repair Request'}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                    {req.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-2">
                    <MapPin className="w-4 h-4 text-fixteal-600 shrink-0" />
                    <span>{req.customer_address || 'Address provided upon acceptance'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/technician/requests/${bookingId}`}
                    className="text-xs font-bold text-fixblue-900 hover:text-fixteal-600 flex items-center gap-1"
                  >
                    <span>View Full Job Scope</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={X}
                      onClick={() => handleReject(bookingId)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Decline
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleAccept(bookingId)}
                    >
                      Accept & Confirm
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
