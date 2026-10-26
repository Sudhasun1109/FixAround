import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, techniciansApi } from '../../services/api';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import SkillBadges from '../../components/technician/SkillBadges';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  MapPin,
  Award,
  ExternalLink,
  AlertCircle,
  FileCheck,
  UserCheck,
  FolderOpen
} from 'lucide-react';

export default function TechnicianVerification() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected tech modal
  const [selectedTech, setSelectedTech] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [docReviewingId, setDocReviewingId] = useState(null);

  const fetchTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter,
        verification_status: statusFilter,
      };

      let list = [];
      let pagination = {};
      try {
        const res = await adminApi.getTechniciansForVerification(params);
        list = res?.data?.technicians || res?.data || [];
        pagination = res?.pagination || {};
      } catch {
        const resAll = await techniciansApi.getAll(params);
        list = resAll?.data?.technicians || resAll?.data || [];
        pagination = resAll?.pagination || {};
      }

      setTechnicians(Array.isArray(list) ? list : []);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || list.length);

      // Refresh currently open modal if active
      if (selectedTech) {
        const updatedSelected = list.find((t) => (t.id || t.user_id) === (selectedTech.id || selectedTech.user_id));
        if (updatedSelected) {
          setSelectedTech(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Failed to load technician verifications:', err);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, selectedTech]);

  useEffect(() => {
    fetchTechnicians();
  }, [page, statusFilter]);

  const handleVerify = async (techId, newStatus) => {
    try {
      setActingId(techId);
      await techniciansApi.verify(techId, { 
        status: newStatus,
        notes: reviewNotes.trim() || undefined
      });
      showToast.success(`Technician successfully marked as ${newStatus.toUpperCase()}`);
      setReviewNotes('');
      if (selectedTech) {
        setSelectedTech({ ...selectedTech, verification_status: newStatus });
      }
      fetchTechnicians();
    } catch (err) {
      showToast.error(err.message || 'Verification update failed');
    } finally {
      setActingId(null);
    }
  };

  const handleReviewDocument = async (docId, status) => {
    try {
      setDocReviewingId(docId);
      await adminApi.reviewDocument(docId, {
        status,
        notes: reviewNotes.trim() || undefined,
      });
      showToast.success(`Document marked as ${status}`);
      setReviewNotes('');
      fetchTechnicians();
    } catch (err) {
      showToast.error(err.message || 'Failed to update document status');
    } finally {
      setDocReviewingId(null);
    }
  };

  const pendingCount = technicians.filter(
    (t) => t.verification_status === 'pending' || (t.pending_documents_count && t.pending_documents_count > 0)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            KYC Approvals & Compliance
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Technician Verification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review uploaded government IDs, trade certificates, and authorize technician dispatch permissions.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          {[
            { label: 'Pending Queue', value: 'pending', count: statusFilter === 'pending' ? totalCount : null },
            { label: 'Approved Pros', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'All Technicians', value: 'all' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? 'bg-fixblue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Loading technician verifications..." className="py-16" />
        ) : technicians.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Verification queue is clear"
            description={`No technicians found matching '${statusFilter}' status.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">KYC Documents</th>
                  <th className="py-3 px-4">Service Area</th>
                  <th className="py-3 px-4">Experience & Skills</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {technicians.map((t) => {
                  const techId = t.id || t.user_id;
                  const fullName = t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Technician';
                  const docCount = t.documents ? t.documents.length : 0;
                  const pendingDocs = t.documents ? t.documents.filter(d => d.status === 'PENDING').length : (t.pending_documents_count || 0);

                  return (
                    <tr key={techId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-50 text-fixteal-800 font-bold flex items-center justify-center shrink-0 border border-teal-100">
                            {fullName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{fullName}</p>
                            <span className="text-[10px] text-slate-400 block">{t.email}</span>
                            {t.phone && <span className="text-[10px] text-slate-500 font-mono">{t.phone}</span>}
                          </div>
                        </div>
                      </td>

                      {/* KYC Documents Badge */}
                      <td className="py-3 px-4">
                        {pendingDocs > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {pendingDocs} Document{pendingDocs > 1 ? 's' : ''} Pending
                          </span>
                        ) : docCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                            {docCount} Document{docCount > 1 ? 's' : ''} Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            No documents submitted
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.service_city || 'Delhi'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block ml-5">{t.service_radius_km || 15} km coverage</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {t.experience_years ? `${t.experience_years} Years Experience` : 'Certified Pro'}
                          </span>
                          <SkillBadges skills={t.skills || t.categories || []} max={2} />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            t.verification_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : t.verification_status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {t.verification_status || 'PENDING'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Eye}
                            onClick={() => {
                              setSelectedTech(t);
                              setReviewNotes('');
                            }}
                          >
                            Review KYC
                          </Button>

                          {t.verification_status !== 'approved' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={CheckCircle}
                              loading={actingId === techId}
                              onClick={() => handleVerify(techId, 'approved')}
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Detail & KYC Review Modal */}
      <Modal
        isOpen={Boolean(selectedTech)}
        onClose={() => setSelectedTech(null)}
        title="Technician KYC Review & Compliance"
        size="lg"
      >
        {selectedTech && (
          <div className="space-y-6 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {/* Header info card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-fixblue-800 text-white font-extrabold text-lg flex items-center justify-center shrink-0">
                  {(selectedTech.full_name || selectedTech.first_name || 'T')[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedTech.full_name || `${selectedTech.first_name || ''} ${selectedTech.last_name || ''}`}
                  </h3>
                  <p className="text-slate-500">{selectedTech.email} &bull; {selectedTech.phone || 'No phone'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    City: {selectedTech.service_city || 'Delhi'} ({selectedTech.service_radius_km || 15} km) &bull; Experience: {selectedTech.experience_years || 0} years
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Account Status</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    selectedTech.verification_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : selectedTech.verification_status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {selectedTech.verification_status || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Submitted Documents Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-fixteal-600" />
                  Submitted KYC Documents ({selectedTech.documents?.length || 0})
                </h4>
              </div>

              {(!selectedTech.documents || selectedTech.documents.length === 0) ? (
                <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 text-center space-y-1">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="font-bold text-amber-900">No KYC Documents Uploaded</p>
                  <p className="text-[11px] text-amber-700">The technician has not yet submitted government ID or trade certification files.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTech.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-fixteal-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 text-fixblue-900 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{doc.document_name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 uppercase">
                              {doc.document_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Uploaded on {formatDate(doc.created_at)}
                            {doc.reviewed_at && ` &bull; Reviewed ${formatDate(doc.reviewed_at)}`}
                          </p>
                          {doc.notes && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1">
                              <strong>Notes:</strong> {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.status || 'PENDING'}
                        </span>

                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-fixblue-50 text-fixblue-800 hover:bg-fixblue-100 font-bold transition-colors"
                          >
                            <span>Open Document</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {doc.status !== 'APPROVED' && (
                          <button
                            type="button"
                            disabled={docReviewingId === doc.id}
                            onClick={() => handleReviewDocument(doc.id, 'APPROVED')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-bold transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}

                        {doc.status !== 'REJECTED' && (
                          <button
                            type="button"
                            disabled={docReviewingId === doc.id}
                            onClick={() => handleReviewDocument(doc.id, 'REJECTED')}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold transition-colors disabled:opacity-50 border border-rose-200"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bio & Skills */}
            {selectedTech.bio && (
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Technician Bio
                </span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedTech.bio}
                </p>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Declared Competencies
              </span>
              <SkillBadges skills={selectedTech.skills || selectedTech.categories || []} size="md" />
            </div>

            {/* Decision Notes & Action Bar */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  Compliance & Verification Decision Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fixteal-500 text-xs"
                  placeholder="e.g. Government Aadhaar card verified. Valid trade certificate."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTech(null)}
                >
                  Cancel
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  loading={actingId === (selectedTech.id || selectedTech.user_id)}
                  onClick={() => handleVerify(selectedTech.id || selectedTech.user_id, 'rejected')}
                >
                  Reject Application
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  loading={actingId === (selectedTech.id || selectedTech.user_id)}
                  onClick={() => handleVerify(selectedTech.id || selectedTech.user_id, 'approved')}
                >
                  Grant Full Verification & Authorize
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
