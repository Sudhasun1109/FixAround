import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { claimsApi, bookingsApi } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import StatusBadge from '../../components/booking/StatusBadge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { ShieldCheck, Plus, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export default function WarrantyClaims() {
  const [searchParams] = useSearchParams();
  const preselectedBookingId = searchParams.get('bookingId');

  const [claims, setClaims] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Claim Form
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaimsAndBookings = useCallback(async () => {
    try {
      setLoading(true);
      const [claimRes, bookRes] = await Promise.all([
        claimsApi.getMyClaims(),
        bookingsApi.getMyBookings({ status: 'COMPLETED' }),
      ]);

      const claimList = claimRes?.data?.claims || claimRes?.data || [];
      const bookList = bookRes?.data?.bookings || bookRes?.data || [];

      setClaims(Array.isArray(claimList) ? claimList : []);
      setCompletedBookings(Array.isArray(bookList) ? bookList : []);
    } catch (err) {
      console.error('Failed to load claims data:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaimsAndBookings();
  }, [fetchClaimsAndBookings]);

  useEffect(() => {
    if (preselectedBookingId && completedBookings.length > 0) {
      const match = completedBookings.find((b) => String(b.id) === String(preselectedBookingId));
      if (match) {
        setSelectedBookingId(String(match.id));
        setShowNewClaimModal(true);
      }
    }
  }, [preselectedBookingId, completedBookings]);

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      showToast.error('Please choose a completed booking for warranty service');
      return;
    }
    if (!issueDescription.trim()) {
      showToast.error('Please describe what issue reoccurred');
      return;
    }

    try {
      setSubmitting(true);
      const chosenBooking = completedBookings.find((b) => String(b.id) === String(selectedBookingId));

      await claimsApi.create({
        booking_id: parseInt(selectedBookingId, 10),
        technician_id: chosenBooking?.technician_id,
        issue_description: issueDescription.trim(),
        evidence_notes: evidenceNotes.trim(),
      });

      showToast.success('Warranty claim submitted! Our dispute team will inspect within 24 hours.');
      setShowNewClaimModal(false);
      setSelectedBookingId('');
      setIssueDescription('');
      setEvidenceNotes('');
      fetchClaimsAndBookings();
    } catch (err) {
      showToast.error(err.message || 'Failed to submit warranty claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Coverage & Claims
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            FixAround Warranty Claims
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Re-service coverage guarantee if a repaired problem reoccurs within the warranty window.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setShowNewClaimModal(true)}
          disabled={completedBookings.length === 0}
        >
          File New Claim
        </Button>
      </div>

      {loading ? (
        <Spinner size="lg" label="Loading warranty claims..." className="py-16" />
      ) : claims.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No warranty claims filed"
          description={
            completedBookings.length > 0
              ? 'All your past repairs are currently in good order. If any repaired component fails, file a claim here.'
              : 'You do not have any completed bookings yet to file warranty claims for.'
          }
          actionLabel={completedBookings.length > 0 ? 'File a Claim' : null}
          onAction={() => setShowNewClaimModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-fixteal-600" />
                  <span className="text-xs font-bold text-fixblue-900 font-mono">
                    #{claim.claim_number || `CLM-${claim.id}`}
                  </span>
                  <span className="text-xs text-slate-400">
                    &bull; Booking #{claim.booking_number || claim.booking_id}
                  </span>
                </div>

                <StatusBadge status={claim.status || 'OPEN'} size="sm" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Issue Description
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {claim.issue_description}
                </p>
              </div>

              {claim.evidence_notes && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                  <span className="font-bold text-slate-700 block mb-0.5">Evidence / Details:</span>
                  <p>{claim.evidence_notes}</p>
                </div>
              )}

              {claim.resolution_notes && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <span className="font-bold block">
                    Resolution: {claim.resolution_type || 'Resolved'}
                  </span>
                  <p className="leading-relaxed">{claim.resolution_notes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Filed on {formatDateTime(claim.created_at)}</span>
                {claim.technician_name && (
                  <span>Assigned Tech: <strong>{claim.technician_name}</strong></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Claim Modal */}
      <Modal
        isOpen={showNewClaimModal}
        onClose={() => setShowNewClaimModal(false)}
        title="File Warranty Claim"
        size="md"
      >
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <Select
            label="Select Completed Booking"
            required
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            options={completedBookings.map((b) => ({
              value: b.id,
              label: `#${b.booking_number || b.id} - ${b.service_name || b.title} (${formatDate(b.completed_at || b.created_at)})`,
            }))}
            placeholder="Select eligible completed job"
          />

          <Textarea
            label="Describe the Recurring Problem"
            required
            placeholder="Explain why the repair has failed or what defect has reoccurred..."
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            rows={4}
          />

          <Textarea
            label="Additional Evidence / Notes (Optional)"
            placeholder="Any specific symptoms, error codes, or leaking spots observed..."
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
            rows={2}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowNewClaimModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              loading={submitting}
              icon={ShieldCheck}
            >
              Submit Warranty Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
