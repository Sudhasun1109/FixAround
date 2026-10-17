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

  const fetchTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
      };
      if (statusFilter !== 'all') {
        params.verification_status = statusFilter;
      }

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
    } catch (err) {
      console.error('Failed to load technician verifications:', err);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const handleVerify = async (techId, newStatus) => {
    try {
      setActingId(techId);
      await techniciansApi.verify(techId, { status: newStatus });
      showToast.success(`Technician marked as ${newStatus.toUpperCase()}`);
      if (selectedTech && selectedTech.id === techId) {
        setSelectedTech({ ...selectedTech, verification_status: newStatus });
      }
      fetchTechnicians();
    } catch (err) {
      showToast.error(err.message || 'Verification update failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            KYC Approvals
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Technician Verification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review identity proofs, qualifications, and grant platform dispatch rights.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200">
          {[
            { label: 'Pending Queue', value: 'pending' },
            { label: 'Approved Pro', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'All', value: 'all' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
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

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Loading verifications..." className="py-16" />
        ) : technicians.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Verification queue is clear"
            description={`No technicians found under '${statusFilter}' status.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Skills</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {technicians.map((t) => {
                  const techId = t.id || t.user_id;
                  const fullName = t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Pro';

                  return (
                    <tr key={techId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-fixteal-800 font-bold flex items-center justify-center">
                            {fullName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{fullName}</p>
                            <span className="text-[10px] text-slate-400">{t.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-semibold">{t.service_city || 'Delhi'}</span>
                        <span className="text-[10px] text-slate-400 block">{t.service_radius_km || 10} km radius</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {t.experience_years ? `${t.experience_years} Years` : 'Certified'}
                      </td>

                      <td className="py-3 px-4">
                        <SkillBadges skills={t.skills || t.categories || []} max={2} />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.verification_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.verification_status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.verification_status || 'PENDING'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Eye}
                            onClick={() => setSelectedTech(t)}
                          >
                            Details
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

                          {t.verification_status !== 'rejected' && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={XCircle}
                              loading={actingId === techId}
                              onClick={() => handleVerify(techId, 'rejected')}
                              className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              Reject
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

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(selectedTech)}
        onClose={() => setSelectedTech(null)}
        title="Technician Compliance Profile"
        size="md"
      >
        {selectedTech && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedTech.full_name || `${selectedTech.first_name || ''} ${selectedTech.last_name || ''}`}
                </h3>
                <p className="text-slate-400">{selectedTech.email} &bull; {selectedTech.phone}</p>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  selectedTech.verification_status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedTech.verification_status || 'PENDING'}
              </span>
            </div>

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

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTech(null)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleVerify(selectedTech.id || selectedTech.user_id, 'rejected')}
              >
                Reject Application
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleVerify(selectedTech.id || selectedTech.user_id, 'approved')}
              >
                Grant Full Verification
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
