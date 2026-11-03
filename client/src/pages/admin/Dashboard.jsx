import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/booking/StatusBadge';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  Users,
  Calendar,
  DollarSign,
  Wrench,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  Activity,
  FolderTree,
  Clock,
  RotateCw,
  TrendingUp,
  XCircle,
  Check,
  Award,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await adminApi.getDashboard();
      const payload = res?.data || res;
      setData(payload);
      if (isRefresh) showToast.success('Telemetry and KPIs updated live');
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.message || 'Failed to fetch platform telemetry');
      showToast.error('Could not refresh dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <Spinner fullScreen label="Connecting to FixAround Telemetry Engine..." />;
  }

  // Extract core metrics with safe defaults
  const totalCustomers = data?.total_customers ?? data?.users?.total_customers ?? 0;
  const totalTechnicians = data?.total_technicians ?? data?.users?.total_technicians ?? 0;
  const totalServices = data?.total_services ?? 8;
  const totalBookings = data?.total_bookings ?? data?.bookings?.total_bookings ?? 0;
  const pendingBookings = data?.pending_bookings ?? 0;
  const acceptedBookings = data?.accepted_bookings ?? 0;
  const completedBookings = data?.completed_bookings ?? data?.bookings?.completed_bookings ?? 0;
  const cancelledBookings = data?.cancelled_bookings ?? data?.bookings?.cancelled_bookings ?? 0;
  const emergencyCount = data?.emergency_count ?? 0;
  const totalRevenue = data?.total_revenue ?? data?.financials?.total_revenue ?? 0;

  const recentBookings = Array.isArray(data?.recent_bookings) ? data.recent_bookings : [];
  const recentCustomers = Array.isArray(data?.recent_customers) ? data.recent_customers : [];
  const recentTechnicians = Array.isArray(data?.recent_technicians) ? data.recent_technicians : [];
  const popularCategories = Array.isArray(data?.popular_categories) ? data.popular_categories : [];
  const recentActivities = Array.isArray(data?.recent_activities) ? data.recent_activities : [];

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-12">
      {/* 1. TOP HEADER WITH REFRESH ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-fixblue-500 uppercase tracking-wider">
              FixAround Administration
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              Live Gateway Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-0.5">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time monitoring across user verifications, active dispatches, and escrow payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Dashboard"
          >
            <RotateCw className={`w-3.5 h-3.5 text-fixblue-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link to="/admin/emergency">
            <button
              type="button"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-900/25 flex items-center gap-2 hover:from-red-700 hover:to-rose-700 active:scale-95 transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-200" />
              <span>Emergency Radar ({emergencyCount})</span>
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. EIGHT DASHBOARD STATISTICS CARDS (Clickable to respective pages) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Key System Metrics
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">Database Live Sync</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: Total Customers */}
          <Link to="/admin/customers" className="group">
            <StatsCard
              label="Total Customers"
              value={totalCustomers}
              icon={Users}
              color="blue"
              subtitle="Registered clients"
            />
          </Link>

          {/* Card 2: Total Technicians */}
          <Link to="/admin/technicians" className="group">
            <StatsCard
              label="Total Technicians"
              value={totalTechnicians}
              icon={Wrench}
              color="teal"
              subtitle="Service specialists"
            />
          </Link>

          {/* Card 3: Total Services */}
          <Link to="/admin/categories" className="group">
            <StatsCard
              label="Active Categories"
              value={totalServices}
              icon={FolderTree}
              color="purple"
              subtitle="Service categories"
            />
          </Link>

          {/* Card 4: Total Bookings */}
          <Link to="/admin/bookings" className="group">
            <StatsCard
              label="Total Bookings"
              value={totalBookings}
              icon={Calendar}
              color="indigo"
              subtitle="Platform requests"
            />
          </Link>

          {/* Card 5: Pending Bookings */}
          <Link to="/admin/bookings?status=REQUESTED" className="group">
            <StatsCard
              label="Pending Dispatch"
              value={pendingBookings}
              icon={Clock}
              color="amber"
              subtitle="Awaiting response"
            />
          </Link>

          {/* Card 6: Accepted Bookings */}
          <Link to="/admin/bookings?status=ACCEPTED" className="group">
            <StatsCard
              label="Accepted Bookings"
              value={acceptedBookings}
              icon={CheckCircle}
              color="blue"
              subtitle="Confirmed by technician"
            />
          </Link>

          {/* Card 7: Completed Bookings */}
          <Link to="/admin/bookings?status=COMPLETED" className="group">
            <StatsCard
              label="Completed Jobs"
              value={completedBookings}
              icon={ShieldCheck}
              color="green"
              subtitle="Delivered & verified"
            />
          </Link>

          {/* Card 8: Cancelled Bookings */}
          <Link to="/admin/bookings?status=CANCELLED" className="group">
            <StatsCard
              label="Cancelled Bookings"
              value={cancelledBookings}
              icon={XCircle}
              color="red"
              subtitle="Declined or revoked"
            />
          </Link>
        </div>
      </div>

      {/* 3. BOOKING ACTIVITY BREAKDOWN & POPULAR CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Booking Activity Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Booking Activity Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of {totalBookings} platform service requests by lifecycle status.
              </p>
            </div>
            <span className="text-sm font-extrabold text-fixblue-600">
              {formatCurrency(totalRevenue)} GMV
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {/* Completed */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Completed Services
                </span>
                <span className="text-slate-900">
                  {completedBookings} ({totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Pending & Assigned */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Pending & Dispatching
                </span>
                <span className="text-slate-900">
                  {pendingBookings} ({totalBookings > 0 ? Math.round((pendingBookings / totalBookings) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (pendingBookings / totalBookings) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Accepted & Underway */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3498F6]" />
                  Accepted & In Progress
                </span>
                <span className="text-slate-900">
                  {acceptedBookings} ({totalBookings > 0 ? Math.round((acceptedBookings / totalBookings) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#3498F6] h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (acceptedBookings / totalBookings) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cancelled */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Cancelled
                </span>
                <span className="text-slate-900">
                  {cancelledBookings} ({totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Popular Service Categories (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Popular Service Categories
            </h3>
            <Link to="/admin/categories" className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600">
              All Categories
            </Link>
          </div>

          {popularCategories.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No categories recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {popularCategories.map((cat, idx) => (
                <div
                  key={cat.id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{cat.name}</h4>
                      <span className="text-[10px] text-slate-400">{cat.booking_count || 0} bookings</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(cat.total_spent || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. RECENT BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#172033]">
              Live Service Booking Feed
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time dispatch telemetry and lifecycle status.
            </p>
          </div>

          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600 flex items-center gap-1"
          >
            <span>All Bookings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No service requests currently recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-6">Booking ID</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Specialist</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Total</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                      #{b.booking_number || `BK-${b.id}`}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      {b.customer_first_name
                        ? `${b.customer_first_name} ${b.customer_last_name || ''}`.trim()
                        : 'Customer'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {b.technician_first_name
                        ? `${b.technician_first_name} ${b.technician_last_name || ''}`.trim()
                        : <span className="text-amber-500 font-semibold italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {b.category_name || b.title}
                    </td>
                    <td className="py-3.5 px-6 font-extrabold text-slate-900">
                      {formatCurrency(b.final_total || b.estimated_total || 450)}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/customer/bookings/${b.id}`}
                        className="text-xs font-bold text-fixblue-500 hover:text-fixblue-700"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. RECENTLY REGISTERED CUSTOMERS & TECHNICIANS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recently Registered Customers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-fixblue-500" />
              <h3 className="text-base font-bold text-slate-900">
                Recently Registered Customers
              </h3>
            </div>
            <Link to="/admin/customers" className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600">
              Manage Users
            </Link>
          </div>

          {recentCustomers.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No customers registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCustomers.map((cust) => (
                <div key={cust.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">
                      {cust.first_name} {cust.last_name || ''}
                    </p>
                    <p className="text-[11px] text-slate-400">{cust.email}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDateTime(cust.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Registered Technicians */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-500" />
              <h3 className="text-base font-bold text-slate-900">
                Recently Registered Specialists
              </h3>
            </div>
            <Link to="/admin/technicians" className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600">
              Verification Queue
            </Link>
          </div>

          {recentTechnicians.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No technicians registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTechnicians.map((tech) => (
                <div key={tech.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">
                      {tech.first_name} {tech.last_name || ''}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {tech.service_city || 'City pending'} &bull; {tech.email}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      tech.verification_status === 'approved'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {tech.verification_status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. RECENT PLATFORM AUDIT ACTIVITIES */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">
              Recent Administrative & System Audit Trail
            </h3>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600">
            Full Audit Logs
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No audit logs recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    {act.action}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(act.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium truncate">
                  Entity: {act.entity_type} #{act.entity_id}
                </p>
                <p className="text-[10px] text-slate-400">
                  By {act.first_name || act.actor_role || 'System'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
