import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { techniciansApi, bookingsApi } from '../../services/api';
import {
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  User,
  Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BackupRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const navigate = useNavigate();

  const fetchBackupRequests = async () => {
    try {
      setLoading(true);
      const res = await techniciansApi.getBackupRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load backup requests:', err);
      toast.error('Could not load backup requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupRequests();
    // Auto refresh every 30 seconds for live backup feed
    const interval = setInterval(fetchBackupRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptBackup = async (requestId) => {
    try {
      setAcceptingId(requestId);
      const res = await bookingsApi.acceptBackup(requestId);
      toast.success('You have successfully accepted the backup job! Work transferred to you.');
      navigate('/technician/ongoing');
    } catch (err) {
      toast.error(err.message || 'Failed to accept backup request. It may have already been taken.');
      fetchBackupRequests();
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Emergency Backup Requests</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Urgent job dispatch requests where originally assigned technicians experienced unexpected breakdowns or delays.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchBackupRequests}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-500">Checking for live backup requests in your trade area...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Active Backup Requests</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            All assigned jobs in your trade area are progressing smoothly. Any technician requiring an emergency takeover will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> Urgent Backup Needed
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    #{req.booking_number}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{req.booking_title}</h3>
                  <div className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1">
                    {req.category_name}
                  </div>
                </div>

                {/* Reason Banner */}
                <div className="bg-rose-50 rounded-xl p-3 border border-rose-200/80 text-xs text-rose-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Reason: {req.reason.replace(/_/g, ' ')}
                  </div>
                  {req.explanation && <p className="text-rose-800 italic">"{req.explanation}"</p>}
                  <p className="text-[11px] text-rose-700 mt-1">
                    Originally assigned to {req.original_tech_first_name} {req.original_tech_last_name}
                  </p>
                </div>

                {/* Location & Customer */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer: {req.customer_first_name} {req.customer_last_name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{req.customer_address || 'Address provided on booking'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Expirable Offer
                </span>
                <button
                  type="button"
                  disabled={acceptingId === req.id}
                  onClick={() => handleAcceptBackup(req.id)}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{acceptingId === req.id ? 'Accepting...' : 'Accept & Take Over Job'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
