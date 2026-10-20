import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, servicesApi, techniciansApi } from '../../services/api';
import StatusBadge from '../../components/booking/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  Calendar,
  Search,
  Eye,
  UserCheck,
  AlertTriangle,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export default function BookingMonitoring() {
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reassign Modal
  const [reassignBooking, setReassignBooking] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Detail Modal
  const [detailBooking, setDetailBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
        category_id: categoryFilter || undefined,
        search: search || undefined,
      };

      const res = await adminApi.getBookings(params);
      const list = res?.data?.bookings || res?.data || [];
      const pagination = res?.pagination || {};

      setBookings(Array.isArray(list) ? list : []);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || list.length);
    } catch (err) {
      console.error('Failed to load bookings for monitoring:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Load auxiliary data for filters and reassign
  useEffect(() => {
    const fetchAux = async () => {
      try {
        const [catRes, techRes] = await Promise.all([
          servicesApi.getAll({ is_active: 1 }),
          techniciansApi.getAll({ is_available: 1 }),
        ]);
        setCategories(catRes?.data?.categories || catRes?.data || []);
        setTechnicians(techRes?.data?.technicians || techRes?.data || []);
      } catch {
        // Optional
      }
    };
    fetchAux();
  }, []);

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      showToast.error('Please choose a replacement technician');
      return;
    }

    try {
      setReassigning(true);
      await adminApi.reassignBooking(reassignBooking.id, parseInt(selectedTechId, 10));
      showToast.success('Booking reassigned successfully.');
      setReassignBooking(null);
      setSelectedTechId('');
      fetchBookings();
    } catch (err) {
      showToast.error(err.message || 'Failed to reassign booking');
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Operations Center
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Booking Dispatch Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time state overview of every client request with manual technician intervention.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchBookings}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by booking #, client, or pro..."
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs font-semibold py-2.5 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="ON_THE_WAY">ON_THE_WAY</option>
            <option value="ARRIVED">ARRIVED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="DISPUTED">DISPUTED</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs font-semibold py-2.5 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Monitoring dispatches..." className="py-16" />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings match current filters"
            description="Clear search or change status to view other records."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-fixblue-900">
                          #{b.booking_number || `BK-${b.id}`}
                        </span>
                        {b.is_emergency ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 animate-pulse">
                            EMERGENCY
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {b.service_name || b.title}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {b.customer_name || 'Customer'}
                    </td>

                    <td className="py-3 px-4">
                      {b.technician_name ? (
                        <span className="text-slate-800 font-semibold">{b.technician_name}</span>
                      ) : (
                        <span className="text-amber-600 font-bold italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="xs" />
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-fixblue-900">
                      {formatCurrency(b.final_total || b.estimated_total || 0)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => setDetailBooking(b)}
                        >
                          View
                        </Button>

                        {!['COMPLETED', 'CANCELLED'].includes(b.status) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={UserCheck}
                            onClick={() => {
                              setReassignBooking(b);
                              setSelectedTechId('');
                            }}
                          >
                            Reassign
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Reassign Modal */}
      <Modal
        isOpen={Boolean(reassignBooking)}
        onClose={() => setReassignBooking(null)}
        title="Reassign Dispatch Technician"
        size="md"
      >
        {reassignBooking && (
          <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
            <p className="text-slate-500">
              Reassigning booking <strong>#{reassignBooking.booking_number || reassignBooking.id}</strong> to a different verified professional will immediately transfer the dispatch offer.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block">Service Address:</span>
              <span className="font-semibold text-slate-700">{reassignBooking.customer_address}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Replacement Specialist
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full text-xs font-semibold py-2.5 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
              >
                <option value="">Choose certified technician</option>
                {technicians.map((t) => (
                  <option key={t.user_id || t.id} value={t.user_id || t.id}>
                    {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`} ({t.service_city || 'Delhi'} &bull; {t.completed_jobs || 0} jobs)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReassignBooking(null)}
                disabled={reassigning}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={reassigning}
              >
                Confirm Reassignment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(detailBooking)}
        onClose={() => setDetailBooking(null)}
        title="Admin Dispatch Inspection"
        size="md"
      >
        {detailBooking && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="font-mono font-bold text-sm text-fixblue-900">
                #{detailBooking.booking_number || detailBooking.id}
              </span>
              <StatusBadge status={detailBooking.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-400 block uppercase tracking-wider">Customer</span>
                <p className="font-semibold text-slate-800">{detailBooking.customer_name}</p>
                <p>{detailBooking.customer_phone}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-400 block uppercase tracking-wider">Technician</span>
                <p className="font-semibold text-slate-800">{detailBooking.technician_name || 'None'}</p>
                <p>{detailBooking.technician_phone || '-'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-400 block uppercase tracking-wider mb-1">Problem Description</span>
              <p className="leading-relaxed whitespace-pre-line text-slate-700">
                {detailBooking.description || 'None recorded'}
              </p>
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <span>Created on {formatDateTime(detailBooking.created_at)}</span>
              <span className="font-bold text-fixblue-900 text-sm">
                Total: {formatCurrency(detailBooking.final_total || detailBooking.estimated_total || 0)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
