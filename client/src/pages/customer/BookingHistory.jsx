import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../services/api';
import BookingCard from '../../components/booking/BookingCard';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import { Calendar, Plus, Filter } from 'lucide-react';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 8,
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const res = await bookingsApi.getMyBookings(params);
      const list = res?.data?.bookings || res?.data || [];
      const pagination = res?.pagination || {};

      setBookings(Array.isArray(list) ? list : []);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || list.length);
    } catch (err) {
      console.error('Failed to load booking history:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Client side search filter over fetched results
  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      b.title?.toLowerCase().includes(term) ||
      b.service_name?.toLowerCase().includes(term) ||
      b.technician_name?.toLowerCase().includes(term) ||
      b.booking_number?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            History & Orders
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            My Bookings History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track past and ongoing repairs, invoices, and warranties.
          </p>
        </div>

        <Link to="/customer/book">
          <Button variant="primary" size="md" icon={Plus}>
            New Booking
          </Button>
        </Link>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Active', value: 'IN_PROGRESS' },
            { label: 'Requested', value: 'REQUESTED' },
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Cancelled', value: 'CANCELLED' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === tab.value
                  ? 'bg-fixblue-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search booking number or pro..."
          />
        </div>
      </div>

      {/* Bookings Grid */}
      {loading ? (
        <Spinner size="lg" label="Loading bookings..." className="py-16" />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description={
            statusFilter !== 'ALL'
              ? `You don't have any ${statusFilter.toLowerCase()} bookings.`
              : "You haven't scheduled any repair services yet."
          }
          actionLabel="Book a Repair Service"
          onAction={() => window.location.assign('/customer/book')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBookings.map((b) => (
            <BookingCard key={b.id} booking={b} role="customer" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
