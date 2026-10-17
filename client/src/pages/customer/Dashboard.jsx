import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { bookingsApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import BookingCard from '../../components/booking/BookingCard';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertTriangle,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await bookingsApi.getMyBookings({ limit: 10 });
        const list = res?.data?.bookings || res?.data || [];
        setBookings(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load customer bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const activeBookings = bookings.filter(
    (b) =>
      !['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status)
  );

  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  const pendingPayments = bookings.filter(
    (b) => b.status === 'COMPLETED' && (!b.payment_status || b.payment_status === 'PENDING')
  );

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Customer Dashboard
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Welcome back, {user?.first_name || 'Neighbor'}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active repair jobs, approve quotes, and view warranties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/customer/book">
            <Button variant="primary" size="md" icon={Plus}>
              New Booking
            </Button>
          </Link>
          <Link to="/customer/emergency">
            <Button variant="emergency" size="md" icon={AlertTriangle}>
              Emergency (30m)
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics / Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          label="Active Jobs"
          value={activeBookings.length}
          icon={Clock}
          color="blue"
          subtitle={activeBookings.length > 0 ? 'Currently in progress' : 'No active repairs'}
        />

        <StatsCard
          label="Completed Repairs"
          value={completedBookings.length}
          icon={CheckCircle2}
          color="green"
          subtitle="Backed by FixAround Warranty"
        />

        <StatsCard
          label="Action Required"
          value={pendingPayments.length}
          icon={CreditCard}
          color={pendingPayments.length > 0 ? 'amber' : 'teal'}
          subtitle={pendingPayments.length > 0 ? 'Pending payment checkout' : 'All accounts settled'}
        />
      </div>

      {/* Active & Recent Bookings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-fixblue-900">
            Recent Service Requests
          </h2>
          <Link
            to="/customer/bookings"
            className="text-xs font-bold text-fixteal-600 hover:text-fixteal-700 flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <Spinner size="lg" label="Loading bookings..." className="py-12" />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="You don't have any bookings yet"
            description="Book an electrician, plumber, AC specialist, or emergency repair in seconds."
            actionLabel="Schedule Your First Service"
            actionIcon={Plus}
            onAction={() => navigate('/customer/book')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {bookings.slice(0, 4).map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role="customer"
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Help / Warranty Strip */}
      <div className="bg-gradient-to-r from-fixblue-900 to-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-white/10 text-fixteal-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Have an issue with a recent repair?</h4>
            <p className="text-xs text-slate-300">
              Submit a 1-click warranty claim under your guaranteed service coverage.
            </p>
          </div>
        </div>

        <Link to="/customer/claims">
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 shrink-0">
            File Warranty Claim
          </Button>
        </Link>
      </div>
    </div>
  );
}
