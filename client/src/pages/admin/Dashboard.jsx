import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/booking/StatusBadge';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
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
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getDashboard();
        const data = res?.data || res;

        setStats({
          totalUsers: data.total_users ?? data.users?.total_users ?? 0,
          totalBookings: data.total_bookings ?? data.bookings?.total_bookings ?? 0,
          totalRevenue: data.total_revenue ?? data.financials?.total_revenue ?? 0,
          activeTechs: data.active_technicians ?? data.technicians?.available_technicians ?? 0,
          emergencyCount: data.emergency_count ?? data.bookings?.emergency_bookings ?? 0,
          openClaims: data.open_claims ?? data.claims?.open_claims ?? 0,
        });

        const bList = data.recent_bookings || data.bookings || [];
        setRecentBookings(Array.isArray(bList) ? bList.slice(0, 6) : []);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
        setStats({
          totalUsers: 0,
          totalBookings: 0,
          totalRevenue: 0,
          activeTechs: 0,
          emergencyCount: 0,
          openClaims: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return <Spinner fullScreen label="Loading system telemetry..." />;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            System Administration
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Platform Operations & Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring across user verifications, active dispatches, and revenue settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/emergency">
            <Button variant="emergency" size="sm" icon={AlertTriangle}>
              Live Emergency Radar ({stats?.emergencyCount || 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="blue"
          subtitle="Customers & Techs"
        />

        <StatsCard
          label="All-Time Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          color="teal"
          subtitle="Processed requests"
        />

        <StatsCard
          label="Total GMV Volume"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={DollarSign}
          color="green"
          subtitle="Gross service value"
        />

        <StatsCard
          label="Active Specialists"
          value={stats?.activeTechs || 0}
          icon={Wrench}
          color="purple"
          subtitle="Online & ready"
        />

        <StatsCard
          label="Emergency Calls"
          value={stats?.emergencyCount || 0}
          icon={AlertTriangle}
          color="red"
          subtitle="Active 30m dispatches"
        />
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/admin/technicians"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-fixteal-500 transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-teal-50 text-fixteal-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Technician KYC</h4>
            <span className="text-[11px] text-slate-400">Review approvals</span>
          </div>
        </Link>

        <Link
          to="/admin/categories"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-fixteal-500 transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-fixblue-50 text-fixblue-800">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Categories & Rates</h4>
            <span className="text-[11px] text-slate-400">Manage rate cards</span>
          </div>
        </Link>

        <Link
          to="/admin/claims"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-fixteal-500 transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Warranty Claims</h4>
            <span className="text-[11px] text-slate-400">Moderate disputes</span>
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-fixteal-500 transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Audit Logs</h4>
            <span className="text-[11px] text-slate-400">Security history</span>
          </div>
        </Link>
      </div>

      {/* Recent Platform Bookings */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-fixteal-600" />
            <h3 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider">
              Recent Platform Transactions
            </h3>
          </div>

          <Link
            to="/admin/bookings"
            className="text-xs font-bold text-fixteal-600 hover:underline flex items-center gap-1"
          >
            <span>Monitor All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No recent platform bookings recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-fixblue-900">
                      #{b.booking_number || `BK-${b.id}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {b.service_name || b.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{b.customer_name || 'Customer'}</td>
                    <td className="py-3 px-4 text-slate-600">{b.technician_name || 'Pending assignment'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-fixblue-900">
                      {formatCurrency(b.final_total || b.estimated_total || 0)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDateTime(b.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
