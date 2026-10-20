import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { estimatesApi } from '../../services/api';
import EstimateCard from '../../components/booking/EstimateCard';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { ArrowLeft, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export default function EstimateApproval() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirmation dialogs
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        setLoading(true);
        setError(null);
        let estData = null;
        try {
          const res = await estimatesApi.getById(id);
          estData = res?.data?.estimate || res?.data || res;
        } catch {
          const resBooking = await estimatesApi.getByBooking(id);
          estData = resBooking?.data?.estimate || resBooking?.data?.estimates || resBooking?.data || resBooking;
        }
        if (Array.isArray(estData)) {
          estData = estData[0] || null;
        }
        setEstimate(estData);
      } catch (err) {
        setError(err.message || 'Estimate not found');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await estimatesApi.approve(estimate.id);
      showToast.success('Estimate approved! The technician has been notified.');
      setConfirmApproveOpen(false);
      navigate(`/customer/bookings/${estimate.booking_id}`);
    } catch (err) {
      showToast.error(err.message || 'Failed to approve estimate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await estimatesApi.reject(estimate.id, rejectionReason || 'Customer rejected estimate.');
      showToast.success('Estimate rejected. The technician can revise or discuss the scope.');
      setConfirmRejectOpen(false);
      navigate(`/customer/bookings/${estimate.booking_id}`);
    } catch (err) {
      showToast.error(err.message || 'Failed to reject estimate');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading electronic estimate..." />;
  }

  if (error || !estimate) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Estimate Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Could not find this estimate.'}</p>
        <Link to="/customer/bookings">
          <Button variant="outline" icon={ArrowLeft}>
            Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <Link
          to={`/customer/bookings/${estimate.booking_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Booking Details</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-2">
          Review & Authorize Estimate
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review the technician's proposed labor, parts, and visiting fees before work commences.
        </p>
      </div>

      <EstimateCard
        estimate={estimate}
        isCustomer={true}
        onApprove={() => setConfirmApproveOpen(true)}
        onReject={() => setConfirmRejectOpen(true)}
      />

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        onConfirm={handleApprove}
        title="Authorize Work Estimate?"
        message="By approving, you authorize the technician to begin physical repairs as itemized. Payment will be released after completion."
        confirmText="Yes, Authorize Work"
        variant="info"
        loading={actionLoading}
      />

      {/* Reject Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={handleReject}
        title="Reject Proposed Estimate?"
        message="The technician will be notified that this quote was rejected and may submit a revised proposal or cancel."
        confirmText="Reject Estimate"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
