import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookingsApi, estimatesApi, reviewsApi } from '../../services/api';
import BookingTimeline from '../../components/booking/BookingTimeline';
import StatusBadge from '../../components/booking/StatusBadge';
import EstimateCard from '../../components/booking/EstimateCard';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
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
} from 'lucide-react';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const loadBookingData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getById(id);
      const data = res?.data?.booking || res?.data || res;
      setBooking(data);

      // Load timeline
      try {
        const timeRes = await bookingsApi.getTimeline(id);
        const timeList = timeRes?.data?.timeline || timeRes?.data || [];
        setTimeline(Array.isArray(timeList) ? timeList : []);
      } catch {
        // Timeline fallback
        setTimeline([]);
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
        console.error('Failed to load estimate:', err);
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
      console.error('Failed to load booking:', err);
      showToast.error(err.message || 'Could not load booking');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBookingData();
  }, [loadBookingData]);

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
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
        <Link to="/customer/bookings">
          <Button variant="outline" icon={ArrowLeft}>
            Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const isEmergency = Boolean(booking.is_emergency || booking.urgency === 'emergency');
  const canCancel = ['REQUESTED', 'ASSIGNED', 'ACCEPTED'].includes(booking.status);
  const isCompleted = booking.status === 'COMPLETED';
  const isPaid = (
    booking.payment_status === 'SUCCESS' ||
    booking.payment_status === 'PAID' ||
    invoice?.status === 'PAID'
  );
  const canPay = !isPaid && (
    isCompleted ||
    booking.status === 'IN_PROGRESS' ||
    estimate?.status === 'APPROVED' ||
    Boolean(booking.final_total || booking.estimated_total || estimate?.total_estimate)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/customer/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>

        <div className="flex items-center gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              icon={XCircle}
              onClick={() => setShowCancelModal(false)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Cancel Request
            </Button>
          )}

          {canPay && (
            <Link to={`/customer/checkout/${booking.id}`}>
              <Button variant="secondary" size="sm" icon={CreditCard}>
                Pay Now
              </Button>
            </Link>
          )}

          {isCompleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={Star}
                onClick={() => setShowReviewModal(true)}
              >
                Rate & Review
              </Button>
              <Link to={`/customer/claims?bookingId=${booking.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={ShieldCheck}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  File Warranty Claim
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                #{booking.booking_number || `BK-${booking.id}`}
              </span>
              {isEmergency && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  EMERGENCY
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-fixblue-900">
              {booking.service_name || booking.title || 'Local Repair Service'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Created on {formatDateTime(booking.created_at)}
            </p>
          </div>

          <StatusBadge status={booking.status} size="lg" />
        </div>

        {/* Timeline Visualization */}
        <div className="pt-2">
          <BookingTimeline
            currentStatus={booking.status}
            history={timeline}
          />
        </div>
      </div>

      {/* Estimate Approval Section if applicable */}
      {estimate && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-fixblue-900">
            Work Estimate & Price Breakdown
          </h2>
          <EstimateCard
            estimate={estimate}
            isCustomer={true}
            onApprove={handleApproveEstimate}
            onReject={() => setShowEstimateRejectModal(true)}
            loading={approvingEstimate}
          />
        </div>
      )}

      {/* Grid: Booking Information & Assigned Technician */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider">
            Job Details
          </h3>

          <div className="space-y-3 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700 block">Description:</span>
              <p className="mt-0.5 leading-relaxed text-slate-500 whitespace-pre-line">
                {booking.description || 'No specific notes recorded.'}
              </p>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
              <MapPin className="w-4 h-4 text-fixteal-600 shrink-0 mt-0.5" />
              <div className="w-full">
                <span className="font-semibold text-slate-700 block">Service Location:</span>
                <p className="text-slate-500 mt-0.5 mb-2">
                  {booking.customer_address || 'Address provided at booking time'}
                </p>
                <InteractiveMap
                  latitude={booking.customer_latitude}
                  longitude={booking.customer_longitude}
                  markerTitle="Service Address"
                  height="160px"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
              <Calendar className="w-4 h-4 text-fixblue-800 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Scheduled Time:</span>
                <p className="text-slate-500 mt-0.5">
                  {booking.scheduled_at ? formatDateTime(booking.scheduled_at) : 'Immediate Emergency Dispatch'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Technician Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider">
            Assigned Specialist
          </h3>

          {(() => {
            const techName =
              booking.technician_name ||
              (booking.technician_first_name
                ? `${booking.technician_first_name} ${booking.technician_last_name || ''}`.trim()
                : null);

            if (techName) {
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-fixblue-900 text-lg">
                      {techName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{techName}</h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fixteal-700 bg-fixteal-50 px-2 py-0.5 rounded-full mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified FixAround Pro
                      </span>
                    </div>
                  </div>

                  {booking.technician_phone && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                      <span className="text-slate-500">Contact Technician:</span>
                      <a
                        href={`tel:${booking.technician_phone}`}
                        className="font-bold text-fixblue-900 hover:underline"
                      >
                        {booking.technician_phone}
                      </a>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="py-6 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h4 className="text-xs font-bold text-slate-800">
                  Finding qualified specialist...
                </h4>
                <p className="text-[11px] text-slate-400">
                  The smart dispatcher is matching nearby technicians. You will receive an alert once accepted.
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Billing, Payment & Official Invoice Card */}
      {(isPaid || canPay || isCompleted || estimate) && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl ${
                isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-fixblue-800'
              }`}
            >
              {isPaid ? <CreditCard className="w-6 h-6" /> : <Receipt className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {isPaid ? 'Payment Confirmed' : 'Payment & Tax Invoice'}
                </h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPaid ? 'PAID' : 'PAYMENT DUE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPaid
                  ? 'Your payment was received. Download or print your official tax invoice anytime.'
                  : `Total Amount Due: ${formatCurrency(
                      booking.final_total || booking.estimated_total || estimate?.total_estimate || 0
                    )}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {canPay && (
              <Link to={`/customer/checkout/${booking.id}`} className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" icon={CreditCard} fullWidth>
                  Pay Now (
                  {formatCurrency(
                    booking.final_total || booking.estimated_total || estimate?.total_estimate || 0
                  )}
                  )
                </Button>
              </Link>
            )}

            <Link to={`/customer/invoices/${booking.id}`} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" icon={Receipt} fullWidth>
                View Tax Invoice
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Service Booking"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please let us know why you wish to cancel this request:
          </p>
          <textarea
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-fixteal-500"
            rows={3}
            placeholder="e.g. Issue resolved on my own, or plans changed."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelling}
              onClick={handleCancelBooking}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Estimate Modal */}
      <Modal
        isOpen={showEstimateRejectModal}
        onClose={() => setShowEstimateRejectModal(false)}
        title="Reject Work Estimate"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Explain why this estimate is not acceptable so the technician can revise it:
          </p>
          <textarea
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-fixteal-500"
            rows={3}
            placeholder="e.g. Material parts cost seems higher than market rate."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEstimateRejectModal(false)}
              disabled={rejectingEstimate}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rejectingEstimate}
              onClick={handleRejectEstimate}
            >
              Reject Estimate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review & Rate Technician"
        size="md"
      >
        <ReviewForm
          bookingId={booking.id}
          technicianId={booking.technician_id}
          onSubmit={handleReviewSubmit}
          loading={submittingReview}
          onCancel={() => setShowReviewModal(false)}
        />
      </Modal>
    </div>
  );
}
