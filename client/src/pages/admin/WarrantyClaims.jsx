import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, claimsApi } from '../../services/api';
import StatusBadge from '../../components/booking/StatusBadge';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function AdminWarrantyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Resolve Modal
  const [resolvingClaim, setResolvingClaim] = useState(null);
  const [resolutionType, setResolutionType] = useState('RE_SERVICE');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      let list = [];
      try {
        const res = await adminApi.getClaims(params);
        list = res?.data?.claims || res?.data || [];
      } catch {
        const resAll = await claimsApi.getAll(params);
        list = resAll?.data?.claims || resAll?.data || [];
      }

      setClaims(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load warranty claims:', err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      showToast.error('Please add resolution notes explaining the decision');
      return;
    }

    try {
      setResolving(true);
      await claimsApi.resolve(resolvingClaim.id, {
        resolution_type: resolutionType,
        resolution_notes: resolutionNotes.trim(),
        status: resolutionType === 'REJECTED' ? 'REJECTED' : 'RESOLVED',
      });

      showToast.success('Warranty claim resolved successfully.');
      setResolvingClaim(null);
      setResolutionNotes('');
      fetchClaims();
    } catch (err) {
      showToast.error(err.message || 'Failed to resolve claim');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Quality Assurance
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Warranty Claims & Dispute Moderation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer repair failure allegations, approve free re-services, or authorize refunds.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Open', value: 'OPEN' },
            { label: 'Under Review', value: 'UNDER_REVIEW' },
            { label: 'Resolved', value: 'RESOLVED' },
            { label: 'Rejected', value: 'REJECTED' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === tab.value
                  ? 'bg-fixblue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Loading warranty claims..." className="py-16" />
        ) : claims.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No warranty claims found"
            description="No customer dispute cases match the selected status."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <div key={claim.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-fixblue-900">
                      #{claim.claim_number || `CLM-${claim.id}`}
                    </span>
                    <span className="text-xs text-slate-400">
                      &bull; Booking #{claim.booking_number || claim.booking_id}
                    </span>
                  </div>

                  <StatusBadge status={claim.status || 'OPEN'} size="sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block">Customer Issue</span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {claim.issue_description}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block">Parties Involved</span>
                    <p className="text-slate-700">Client: <strong>{claim.customer_name || 'Customer'}</strong></p>
                    <p className="text-slate-700">Technician: <strong>{claim.technician_name || 'Specialist'}</strong></p>
                    <p className="text-slate-400 text-[11px]">Warranty Expires: {formatDate(claim.warranty_expires_at)}</p>
                  </div>
                </div>

                {claim.resolution_notes && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <span className="font-bold block">
                      Admin Decision: {claim.resolution_type || 'Resolved'}
                    </span>
                    <p className="leading-relaxed">{claim.resolution_notes}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Filed {formatDateTime(claim.created_at)}</span>

                  {claim.status === 'OPEN' || claim.status === 'UNDER_REVIEW' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={ShieldCheck}
                      onClick={() => {
                        setResolvingClaim(claim);
                        setResolutionType('RE_SERVICE');
                        setResolutionNotes('');
                      }}
                    >
                      Resolve Claim
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={Boolean(resolvingClaim)}
        onClose={() => setResolvingClaim(null)}
        title="Resolve Warranty Claim"
        size="md"
      >
        {resolvingClaim && (
          <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
            <p className="text-slate-500">
              Dispute Resolution for claim <strong>#{resolvingClaim.claim_number || resolvingClaim.id}</strong> (Booking #{resolvingClaim.booking_number || resolvingClaim.booking_id}).
            </p>

            <Select
              label="Resolution Action"
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value)}
              options={[
                { value: 'RE_SERVICE', label: 'Order Complimentary Re-Service (Free Inspection)' },
                { value: 'FULL_REFUND', label: 'Authorize Full Refund to Customer' },
                { value: 'PARTIAL_REFUND', label: 'Authorize Partial Refund (Materials only)' },
                { value: 'REJECTED', label: 'Reject Claim (Mishandling / Beyond Warranty Scope)' },
                { value: 'OTHER', label: 'Other Administrative Action' },
              ]}
            />

            <Textarea
              label="Resolution Notes & Instructions"
              required
              rows={4}
              placeholder="State the rationale for customer and technician records..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolvingClaim(null)}
                disabled={resolving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={resolving}
              >
                Execute Resolution
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
