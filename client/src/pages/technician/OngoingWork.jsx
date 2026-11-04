import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { techniciansApi, bookingsApi } from '../../services/api';
import { useCall } from '../../context/CallContext';
import {
  Wrench,
  Clock,
  Phone,
  Video,
  MapPin,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  X,
  Send,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const BACKUP_REASONS = [
  { value: 'VEHICLE_BREAKDOWN', label: 'Vehicle Breakdown / Puncture' },
  { value: 'DELAYED_AT_PREVIOUS_JOB', label: 'Delayed at Previous Job' },
  { value: 'PERSONAL_EMERGENCY', label: 'Personal / Family Emergency' },
  { value: 'TOOL_EQUIPMENT_FAILURE', label: 'Tool or Equipment Failure' },
  { value: 'DISTANCE_OR_TRAFFIC', label: 'Severe Traffic / Road Blockage' },
  { value: 'OTHER', label: 'Other Urgent Reason' }
];

export default function OngoingWork() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackupBooking, setSelectedBackupBooking] = useState(null);
  const [backupReason, setBackupReason] = useState('VEHICLE_BREAKDOWN');
  const [backupExplanation, setBackupExplanation] = useState('');
  const [submittingBackup, setSubmittingBackup] = useState(false);

  // Quick PIN entry modal
  const [pinModalBooking, setPinModalBooking] = useState(null);
  const [inputPin, setInputPin] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  const { startCall } = useCall();

  const fetchOngoingWork = async () => {
    try {
      setLoading(true);
      const res = await techniciansApi.getOngoingBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load ongoing work:', err);
      toast.error('Could not load ongoing bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOngoingWork();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus, notes = '') => {
    try {
      await bookingsApi.updateStatus(bookingId, newStatus, notes);
      toast.success(`Booking status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchOngoingWork();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleGeneratePin = async (bookingId) => {
    try {
      const res = await bookingsApi.generatePin(bookingId);
      toast.success(res.message || 'Customer verification PIN generated');
      fetchOngoingWork();
    } catch (err) {
      toast.error(err.message || 'Failed to generate PIN');
    }
  };

  const handleVerifyPin = async () => {
    if (!inputPin || !/^\d{4}$/.test(inputPin.trim())) {
      toast.error('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setVerifyingPin(true);
      await bookingsApi.verifyPin(pinModalBooking.id, inputPin.trim());
      toast.success('PIN verified! Work confirmed completed.');
      setPinModalBooking(null);
      setInputPin('');
      fetchOngoingWork();
    } catch (err) {
      toast.error(err.message || 'Invalid verification PIN');
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleRequestBackup = async (e) => {
    e.preventDefault();
    if (!selectedBackupBooking) return;

    try {
      setSubmittingBackup(true);
      await bookingsApi.requestBackup(selectedBackupBooking.id, {
        reason: backupReason,
        explanation: backupExplanation
      });
      toast.success('Backup technician request dispatched to nearby professionals');
      setSelectedBackupBooking(null);
      setBackupExplanation('');
      fetchOngoingWork();
    } catch (err) {
      toast.error(err.message || 'Failed to request backup technician');
    } finally {
      setSubmittingBackup(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="bg-sky-100 text-sky-800 border border-sky-200 px-3 py-1 rounded-full text-xs font-bold">Accepted</span>;
      case 'ON_THE_WAY':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold animate-pulse">On The Way</span>;
      case 'ARRIVED':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold">Arrived At Site</span>;
      case 'IN_PROGRESS':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">Work In Progress</span>;
      case 'AWAITING_APPROVAL':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold">Estimate Awaiting Approval</span>;
      case 'AWAITING_CUSTOMER_VERIFICATION':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">Awaiting Customer PIN</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Wrench className="w-6 h-6 text-fixblue-700" />
            <span>Active Ongoing Work</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time management for jobs in progress, customer calling, PIN completion, and emergency backup dispatch.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOngoingWork}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <div className="animate-spin w-8 h-8 border-3 border-fixblue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading your ongoing work items...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Ongoing Jobs Right Now</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            You currently have no active assignments in progress. Check your new incoming requests or dashboard to accept new jobs.
          </p>
          <Link
            to="/technician/requests"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-fixblue-600 hover:bg-fixblue-700 text-white font-semibold text-sm transition"
          >
            <span>View New Requests</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-fixblue-100 text-fixblue-800 flex items-center justify-center font-bold text-lg shrink-0">
                    {booking.category_name ? booking.category_name[0] : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold text-fixblue-700 bg-fixblue-50 border border-fixblue-200 px-2.5 py-0.5 rounded-md">
                        #{booking.booking_number}
                      </span>
                      {booking.is_emergency ? (
                        <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Emergency
                        </span>
                      ) : null}
                      <span className="text-xs font-semibold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                        {booking.category_name}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{booking.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{booking.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {getStatusBadge(booking.status)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Customer Details */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Customer Details
                  </h4>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{booking.customer_name || 'Customer'}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{booking.customer_phone || 'Phone verified'}</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{booking.customer_address || 'Customer site location'}</span>
                  </div>

                  {/* Direct Communication Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        startCall({
                          bookingId: booking.id,
                          recipientId: booking.customer_id,
                          recipientName: booking.customer_name,
                          callType: 'voice'
                        })
                      }
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs flex items-center justify-center gap-1.5 border border-emerald-200/60 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Voice Call
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        startCall({
                          bookingId: booking.id,
                          recipientId: booking.customer_id,
                          recipientName: booking.customer_name,
                          callType: 'video'
                        })
                      }
                      className="flex-1 py-2 px-3 rounded-lg bg-fixblue-50 text-fixblue-700 hover:bg-fixblue-100 font-semibold text-xs flex items-center justify-center gap-1.5 border border-fixblue-200/60 transition"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Video Call
                    </button>
                  </div>
                </div>

                {/* Estimate & Pricing Info */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Estimate & Billing
                  </h4>
                  {booking.latest_estimate_id ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Estimate Total:</span>
                        <span className="text-base font-bold text-slate-900">
                          ₹{Number(booking.total_estimate || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-bold text-fixblue-700">{booking.estimate_status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-1">
                      No estimate submitted yet. Create one once you inspect the issue on-site.
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      to={`/technician/estimates/new/${booking.id}`}
                      className="w-full py-2 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {booking.latest_estimate_id ? 'Update / Revise Estimate' : 'Submit Line-Item Estimate'}
                    </Link>
                  </div>
                </div>

                {/* Service Progress Actions & Backup Request */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Milestone Action
                    </h4>

                    {booking.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(booking.id, 'ON_THE_WAY', 'Technician is en route with tools')}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <span>Start Travel (Mark On The Way)</span>
                      </button>
                    )}

                    {booking.status === 'ON_THE_WAY' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(booking.id, 'ARRIVED', 'Technician arrived at customer location')}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <span>I Have Arrived At Location</span>
                      </button>
                    )}

                    {booking.status === 'ARRIVED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(booking.id, 'IN_PROGRESS', 'Beginning diagnostic and repair work')}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <span>Start Work (In Progress)</span>
                      </button>
                    )}

                    {booking.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => handleGeneratePin(booking.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-fixblue-700 hover:bg-fixblue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Work Finished — Generate Customer PIN</span>
                      </button>
                    )}

                    {booking.status === 'AWAITING_CUSTOMER_VERIFICATION' && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setPinModalBooking(booking)}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Enter Customer Verification PIN</span>
                        </button>
                        <p className="text-[11px] text-slate-500 text-center">
                          PIN was sent to customer's portal
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Backup Technician Dispatch Button */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setSelectedBackupBooking(booking)}
                      className="w-full py-2 px-3 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Request Backup Technician</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BACKUP TECHNICIAN MODAL */}
      {selectedBackupBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <ShieldAlert className="w-5 h-5" />
                <span>Request Backup Technician</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBackupBooking(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestBackup} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Backup Request <span className="text-rose-500">*</span>
                </label>
                <select
                  value={backupReason}
                  onChange={(e) => setBackupReason(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-fixblue-500 focus:outline-hidden"
                >
                  {BACKUP_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Explanation / Notes for Backup Technician
                </label>
                <textarea
                  value={backupExplanation}
                  onChange={(e) => setBackupExplanation(e.target.value)}
                  placeholder="e.g. Flat tire on MG Road, customer already has parts ready..."
                  rows={3}
                  className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-fixblue-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Note:</strong> Once another qualified technician accepts this emergency request, the booking, customer details, and any approved estimates will transfer seamlessly to them.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBackupBooking(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBackup}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingBackup ? 'Dispatching...' : 'Dispatch Backup'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN VERIFICATION MODAL */}
      {pinModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Enter Customer 4-Digit PIN</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ask the customer for the 4-digit verification code shown on their booking screen to confirm service completion.
            </p>

            <div className="mb-6">
              <input
                type="text"
                maxLength={4}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-36 text-center text-3xl font-mono tracking-widest font-bold py-2 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-hidden mx-auto"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPinModalBooking(null);
                  setInputPin('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={verifyingPin || inputPin.length !== 4}
                onClick={handleVerifyPin}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {verifyingPin ? 'Verifying...' : 'Verify PIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
