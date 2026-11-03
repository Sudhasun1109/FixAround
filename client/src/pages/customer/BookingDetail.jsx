import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookingsApi, estimatesApi, reviewsApi } from '../../services/api';
import BookingTimeline from '../../components/booking/BookingTimeline';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import ReviewForm from '../../components/review/ReviewForm';
import InteractiveMap from '../../components/common/InteractiveMap';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  Calendar,
  User,
  MapPin,
  CreditCard,
  Star,
  XCircle,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Phone,
  MessageSquare,
  Navigation,
  Heart,
  CheckCircle2,
  ChevronRight,
  Wrench,
  Copy,
  Key,
} from 'lucide-react';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [showEstimateRejectModal, setShowEstimateRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingEstimate, setRejectingEstimate] = useState(false);
  const [approvingEstimate, setApprovingEstimate] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // 4-Digit Verification PIN state
  const [pinData, setPinData] = useState(null);
  const [loadingPin, setLoadingPin] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  // Direct Payment state
  const [selectedPayMethod, setSelectedPayMethod] = useState('CASH');
  const [processingPay, setProcessingPay] = useState(false);

  const loadBookingData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await bookingsApi.getById(id);
      const data = res?.data?.booking || res?.data || res;
      setBooking(data);

      // Load timeline
      try {
        const timeRes = await bookingsApi.getTimeline(id);
        const timeList = timeRes?.data?.timeline || timeRes?.data || [];
        setTimeline(Array.isArray(timeList) ? timeList : []);
      } catch {
        setTimeline([]);
      }


      // Load 4-Digit PIN if awaiting verification
      if (data.status === 'AWAITING_CUSTOMER_VERIFICATION') {
        try {
          setLoadingPin(true);
          const pinRes = await bookingsApi.getVerificationPin(id);
          const p = pinRes?.data || pinRes;
          setPinData(p);
        } catch (pinErr) {
          console.warn('PIN fetch error:', pinErr);
        } finally {
          setLoadingPin(false);
        }
      } else {
        setPinData(null);
      }

      // Load estimate
      try {
        const estRes = await estimatesApi.getByBooking(id);
        let estData = estRes?.data?.estimate || estRes?.data?.estimates || estRes?.data || estRes;
        if (Array.isArray(estData)) {
          estData = estData[0] || null;
        }
        if (estData && (estData.id || estData.total_estimate)) {
          setEstimate(estData);
        } else {
          setEstimate(null);
        }
      } catch (err) {
        setEstimate(null);
      }

      // Load invoice
      try {
        const invRes = await invoicesApi.getByBooking(id);
        const invData = invRes?.data?.invoice || invRes?.data || invRes;
        setInvoice(invData);
      } catch {
        setInvoice(null);
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to load booking:', err);
        showToast.error(err.message || 'Could not load booking');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBookingData(false);
  }, [loadBookingData]);

  // Live auto-polling while booking is active
  useEffect(() => {
    if (!booking) return;
    const activeStatuses = ['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_CUSTOMER_VERIFICATION', 'VERIFIED', 'PAYMENT_PENDING'];
    if (!activeStatuses.includes(booking.status)) return;

    const interval = setInterval(() => {
      loadBookingData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [booking?.status, loadBookingData]);

  // Handle Cancel Booking
  const handleCancelBooking = async () => {
    try {
      setCancelling(true);
      await bookingsApi.cancel(id, cancelReason || 'Customer requested cancellation');
      showToast.success('Booking has been cancelled');
      setShowCancelModal(false);
      loadBookingData();
    } catch (err) {
      showToast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Estimate Actions
  const handleApproveEstimate = async () => {
    if (!estimate) return;
    try {
      setApprovingEstimate(true);
      await estimatesApi.approve(estimate.id);
      showToast.success('Estimate approved! The technician can now start work.');
      loadBookingData();
    } catch (err) {
      showToast.error(err.message || 'Failed to approve estimate');
    } finally {
      setApprovingEstimate(false);
    }
  };

  const handleRejectEstimate = async () => {
    if (!estimate) return;
    try {
      setRejectingEstimate(true);
      await estimatesApi.reject(estimate.id, rejectReason || 'Estimate price too high');
      showToast.success('Estimate rejected. The technician has been notified.');
      setShowEstimateRejectModal(false);
      loadBookingData();
    } catch (err) {
      showToast.error(err.message || 'Failed to reject estimate');
    } finally {
      setRejectingEstimate(false);
    }
  };


  // Handle Customer Direct Payment
  const handleConfirmPayment = async () => {
    try {
      setProcessingPay(true);
      await bookingsApi.processPayment(id, {
        payment_method: selectedPayMethod,
        amount: grandTotal,
        notes: `Customer confirmed payment via ${selectedPayMethod}`
      });
      showToast.success('Payment confirmed! Booking marked COMPLETED.');
      loadBookingData();
    } catch (err) {
      showToast.error(err.message || 'Payment confirmation failed');
    } finally {
      setProcessingPay(false);
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = async (reviewData) => {
    try {
      setSubmittingReview(true);
      await reviewsApi.create(reviewData);
      showToast.success('Thank you for rating your technician!');
      setShowReviewModal(false);
      loadBookingData();
    } catch (err) {
      showToast.error(err.message || 'Failed to post review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading booking information..." />;
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
        <Link
          to="/customer/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fixblue-500 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </Link>
      </div>
    );
  }

  const isEmergency = Boolean(booking.is_emergency || booking.urgency === 'emergency');
  const canCancel = ['REQUESTED', 'ASSIGNED', 'ACCEPTED'].includes(booking.status);
  const isCompleted = booking.status === 'COMPLETED';
  const isPaid =
    booking.payment_status === 'SUCCESS' ||
    booking.payment_status === 'PAID' ||
    invoice?.status === 'PAID';
  const canPay =
    !isPaid &&
    (isCompleted ||
      booking.status === 'IN_PROGRESS' ||
      estimate?.status === 'APPROVED' ||
      Boolean(booking.final_total || booking.estimated_total || estimate?.total_estimate));

  // Geolocation & Map Coordinates
  const custLat = Number(booking.customer_latitude) || 28.6139;
  const custLng = Number(booking.customer_longitude) || 77.2090;

  let techLat = booking.technician_latitude ? Number(booking.technician_latitude) : null;
  let techLng = booking.technician_longitude ? Number(booking.technician_longitude) : null;

  if (!techLat || !techLng) {
    if (booking.status === 'ARRIVED' || booking.status === 'IN_PROGRESS') {
      techLat = custLat + 0.0004;
      techLng = custLng + 0.0003;
    } else if (booking.status === 'ON_THE_WAY') {
      techLat = custLat + 0.012;
      techLng = custLng + 0.009;
    } else {
      techLat = custLat + 0.024;
      techLng = custLng + 0.018;
    }
  }

  // Calculate distance
  const dLat = ((custLat - techLat) * Math.PI) / 180;
  const dLon = ((custLng - techLng) * Math.PI) / 180;
  const aDist =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((techLat * Math.PI) / 180) *
      Math.cos((custLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const cDist = 2 * Math.atan2(Math.sqrt(aDist), Math.sqrt(1 - aDist));
  const distanceKm = Math.max(0.1, Math.round(6371 * cDist * 10) / 10);
  const etaMinutes =
    booking.status === 'ARRIVED' || booking.status === 'IN_PROGRESS'
      ? 0
      : Math.max(3, Math.round(distanceKm * 4));

  const trackingMarkers = [
    {
      lat: custLat,
      lng: custLng,
      title: 'Your Destination',
    },
    {
      lat: techLat,
      lng: techLng,
      title: `${booking.technician_name || 'James Anderson'} (Technician)`,
    },
  ];

  // Price calculations matching Screen 3 format
  const baseServiceCharge = Number(
    booking.final_total ||
      booking.estimated_total ||
      estimate?.total_estimate ||
      450
  );
  const platformFee = 20;
  const taxAmount = Math.round(baseServiceCharge * 0.18);
  const grandTotal = baseServiceCharge + platformFee + taxAmount;

  const technicianName = booking.technician_name || 'James Anderson';
  const serviceName = booking.service_name || booking.title || 'Carpentry Work';
  const bookingNumber = booking.booking_number || `BK-${booking.id}`;

  return (
    <div className="max-w-md mx-auto py-2 sm:py-6 px-3 sm:px-4 space-y-4 pb-24 md:pb-12">
      {/* 1. TOP HEADER (Screen 3 Inspiration) */}
      <div className="flex items-center justify-between py-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-2xs text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-extrabold text-[#172033] tracking-tight">
          Booking Details
        </h1>

        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-2xs text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          title="Favorite"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
            }`}
          />
        </button>
      </div>

      {/* 2. BOOKING STATUS & STEPPER (Screen 3 Inspiration) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Booking Status
          </span>
          {isEmergency && (
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-extrabold text-[10px] animate-pulse">
              EMERGENCY
            </span>
          )}
        </div>

        <BookingTimeline
          currentStatus={booking.status}
          history={timeline}
        />
      </div>

      {/* 3. INTERACTIVE MAP & ROUTE CARD (Screen 3 Inspiration) */}
      <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="rounded-2xl overflow-hidden border border-slate-100 relative">
          <InteractiveMap
            latitude={custLat}
            longitude={custLng}
            markerTitle="Service Destination"
            markers={trackingMarkers}
            height="200px"
            interactive={true}
          />

          {/* Floating ETA Pill */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-800 z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              {etaMinutes === 0 ? 'Arrived at site' : `~${etaMinutes} mins away (${distanceKm} km)`}
            </span>
          </div>
        </div>
      </div>

      {/* Phase 7: CUSTOMER 4-DIGIT VERIFICATION PIN CARD */}
      {booking.status === 'AWAITING_CUSTOMER_VERIFICATION' && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-300" />
              Service Completion Verification
            </span>
            {pinData?.seconds_left > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-mono font-bold">
                Expires in {Math.floor(pinData.seconds_left / 60)}:
                {String(pinData.seconds_left % 60).padStart(2, '0')}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Verify Your Service Completion
            </h2>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              Your technician has completed the service. Share this verification PIN with your technician to confirm the work.
            </p>
          </div>

          {/* 4 Visual Digit Boxes */}
          {loadingPin ? (
            <div className="py-6 text-center text-xs text-blue-200 animate-pulse">
              Generating secure verification PIN...
            </div>
          ) : pinData?.is_expired ? (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-300 text-rose-100 text-xs text-center font-bold">
              This verification PIN has expired. Please ask your technician to generate a new PIN.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                {String(pinData?.pin || '----').split('').map((digit, idx) => (
                  <div
                    key={idx}
                    className="w-14 h-16 rounded-2xl bg-white text-fixblue-900 shadow-lg flex items-center justify-center text-3xl font-extrabold font-mono"
                  >
                    {digit}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (pinData?.pin) {
                      navigator.clipboard.writeText(pinData.pin);
                      setPinCopied(true);
                      showToast.success('Verification PIN copied to clipboard!');
                      setTimeout(() => setPinCopied(false), 2500);
                    }
                  }}
                  className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{pinCopied ? 'PIN Copied!' : 'Copy PIN'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200 font-medium">
            <span>Specialist: <strong>{technicianName}</strong></span>
            <span>Booking #{bookingNumber}</span>
          </div>
        </div>
      )}

      {/* Phase 9: CUSTOMER PAYMENT CONFIRMATION CARD */}
      {(booking.status === 'VERIFIED' || booking.status === 'PAYMENT_PENDING') && (
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-extrabold text-slate-900">
              Service Verified – Complete Payment
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Work verified via customer PIN! Please choose your preferred payment method to conclude this service.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: 'CASH', label: 'Cash', desc: 'Pay to Pro' },
              { id: 'UPI', label: 'UPI / QR', desc: 'Instant App' },
              { id: 'ONLINE', label: 'Card / Net', desc: 'Gateway' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedPayMethod(m.id)}
                className={`p-3 rounded-2xl border-2 text-center transition-all ${
                  selectedPayMethod === m.id
                    ? 'border-fixblue-500 bg-blue-50/60 ring-2 ring-blue-100 text-fixblue-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="text-xs font-extrabold">{m.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={processingPay}
              onClick={handleConfirmPayment}
              className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {processingPay ? (
                <span>Confirming Transaction...</span>
              ) : (
                <span>Pay {formatCurrency(grandTotal)} & Complete Service</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Phase 10: BOOKING COMPLETED CELEBRATION CARD */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-6 shadow-md space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            <h3 className="text-lg font-extrabold">Booking Successfully Completed</h3>
          </div>
          <p className="text-xs text-emerald-100">
            Thank you for choosing FixAround! Your service has been completed and verified with guaranteed 30-day warranty.
          </p>
          <div className="pt-2 flex items-center justify-between text-xs font-semibold text-emerald-100 border-t border-white/20">
            <span>Payment Method: {booking.payment_method || 'CASH'}</span>
            <span className="font-extrabold text-white">Status: PAID ({formatCurrency(baseServiceCharge)})</span>
          </div>
        </div>
      )}

      {/* 4. BOOKING ID & SERVICE NAME (Screen 3 Inspiration) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Booking ID
          </span>
          <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 font-mono">
            #{bookingNumber}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Service
          </span>
          <p className="text-sm sm:text-base font-extrabold text-fixblue-600 mt-0.5">
            {serviceName}
          </p>
        </div>
      </div>

      {/* 5. TECHNICIAN INFORMATION CARD (Screen 3 Inspiration) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={
                booking.technician_avatar ||
                'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80'
              }
              alt={technicianName}
              className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {technicianName}
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              {booking.status === 'ON_THE_WAY'
                ? 'On the way'
                : booking.status === 'ARRIVED'
                ? 'Arrived at your door'
                : booking.status === 'IN_PROGRESS'
                ? 'Repair in progress'
                : 'Assigned Specialist'}
            </p>
          </div>
        </div>

        {/* Call & Chat Circular Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              showToast.info('Connecting to live technician support chat...');
            }}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            title="Chat with Technician"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {booking.technician_phone ? (
            <a
              href={`tel:${booking.technician_phone}`}
              className="w-10 h-10 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all"
              title="Call Technician"
            >
              <Phone className="w-4 h-4" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => showToast.info('Specialist contact active via dispatcher.')}
              className="w-10 h-10 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all"
              title="Call Technician"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 6. COST SUMMARY CARD (Screen 3 Inspiration) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Cost Summary
        </h3>

        <div className="space-y-2 text-xs text-slate-600 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Service Charge</span>
            <span className="font-semibold text-slate-800">{formatCurrency(baseServiceCharge)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Platform Convenience Fee</span>
            <span className="font-semibold text-slate-800">{formatCurrency(platformFee)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tax (GST 18%)</span>
            <span className="font-semibold text-slate-800">{formatCurrency(taxAmount)}</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-900">Total</span>
            <span className="text-lg font-extrabold text-fixblue-500">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* 7. BOTTOM CTA ACTION BUTTONS (Screen 3 Inspiration) */}
      <div className="space-y-2 pt-2">
        {canPay && (
          <Link
            to={`/customer/checkout/${booking.id}`}
            className="w-full py-4 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-extrabold text-sm sm:text-base shadow-md shadow-blue-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Confirm Service & Pay</span>
            <span className="text-xs text-blue-100">({formatCurrency(grandTotal)})</span>
          </Link>
        )}

        {isCompleted && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="w-full py-3.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <Star className="w-4 h-4 fill-amber-300 stroke-amber-300" />
              <span>Rate & Review Technician</span>
            </button>

            <Link
              to={`/customer/claims?bookingId=${booking.id}`}
              className="w-full py-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>File 30-Day Warranty Claim</span>
            </Link>
          </div>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="w-full py-2.5 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          >
            Cancel Booking Request
          </button>
        )}
      </div>

      {/* CANCEL BOOKING MODAL */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Service Booking"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to cancel this booking? If a technician is already on the way, please confirm.
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please specify a cancellation reason (e.g., Problem solved, rescheduling)..."
            rows={3}
            className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={handleCancelBooking}
              className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* RATE & REVIEW MODAL */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Rate & Review Your Specialist"
      >
        <ReviewForm
          bookingId={booking.id}
          onSubmit={handleReviewSubmit}
          loading={submittingReview}
        />
      </Modal>
    </div>
  );
}
