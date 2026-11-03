import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { bookingsApi, customerApi, techniciansApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import BookingCard from '../../components/booking/BookingCard';
import TechnicianCard from '../../components/technician/TechnicianCard';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
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
  Wallet,
  ArrowUpRight,
  Sparkles,
  Wrench,
  ChevronRight,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState({ wallet_balance: user?.wallet_balance || 0, transactions: [] });
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookRes, walletRes, techRes] = await Promise.allSettled([
          bookingsApi.getMyBookings({ limit: 10 }),
          customerApi.getWallet(),
          techniciansApi.getAll({ limit: 3 }),
        ]);

        if (bookRes.status === 'fulfilled') {
          const list = bookRes.value?.data?.bookings || bookRes.value?.data || [];
          setBookings(Array.isArray(list) ? list : []);
        }

        if (walletRes.status === 'fulfilled') {
          const wData = walletRes.value?.data || {};
          setWallet({
            wallet_balance: Number(wData.wallet_balance || 0),
            transactions: Array.isArray(wData.transactions) ? wData.transactions : [],
          });
        }

        if (techRes.status === 'fulfilled') {
          const tList = techRes.value?.data?.technicians || techRes.value?.data || [];
          setTechnicians(Array.isArray(tList) ? tList.slice(0, 3) : []);
        }
      } catch (err) {
        console.error('Failed to load customer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeBookings = bookings.filter(
    (b) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status)
  );

  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* 1. WELCOME & QUICK ACTIONS BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
        <div>
          <span className="text-xs font-bold text-fixblue-500 uppercase tracking-wider">
            Customer Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-0.5">
            Welcome back, {user?.first_name || 'Neighbor'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track active repair dispatches, approve quotes, and view warranties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/customer/book"
            className="px-5 py-2.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </Link>

          <Link
            to="/customer/emergency"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-900/25 flex items-center gap-1.5 active:scale-95 transition-all animate-pulse"
          >
            <AlertTriangle className="w-4 h-4 text-amber-200" />
            <span>Emergency (2-Min)</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS & WALLET ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Wallet Pill Card */}
        <Link
          to="/customer/wallet"
          className="bg-gradient-to-br from-fixblue-500 to-fixblue-600 hover:from-fixblue-600 hover:to-fixblue-700 text-white p-5 rounded-3xl shadow-card flex flex-col justify-between relative overflow-hidden group transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              FixAround Wallet
            </span>
            <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {formatCurrency(wallet.wallet_balance)}
            </div>
            <p className="text-[11px] text-blue-100 mt-1 flex items-center justify-between">
              <span>● Active Balance</span>
              <span className="underline underline-offset-2">Topup &rarr;</span>
            </p>
          </div>
        </Link>

        <StatsCard
          label="Active Repairs"
          value={activeBookings.length}
          icon={Clock}
          color="blue"
          subtitle={activeBookings.length > 0 ? 'Technician dispatched' : 'No active dispatches'}
        />

        <StatsCard
          label="Completed Services"
          value={completedBookings.length}
          icon={CheckCircle2}
          color="green"
          subtitle="Protected by warranty"
        />

        <StatsCard
          label="Total Bookings"
          value={bookings.length}
          icon={Calendar}
          color="purple"
          subtitle="All-time history"
        />
      </div>

      {/* 3. ACTIVE BOOKINGS ALERT / BANNER */}
      {activeBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Ongoing Repairs & Live Tracking ({activeBookings.length})
              </h2>
            </div>
            <Link
              to="/customer/bookings"
              className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl p-5 border border-blue-100 shadow-soft hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{b.booking_number || `BK-${b.id}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-fixblue-600 text-[10px] font-bold">
                      {b.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {b.service_name || b.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Technician: {b.technician_name || 'Assigned Specialist'} &bull; {b.customer_address}
                  </p>
                </div>

                <Link
                  to={`/customer/bookings/${b.id}`}
                  className="px-5 py-2.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Track Live Status</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TOP RATED TECHNICIANS */}
      {technicians.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Recommended Specialists
            </h2>
            <Link
              to="/customer/search"
              className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600"
            >
              Browse all &rarr;
            </Link>
          </div>

          <div className="space-y-3.5">
            {technicians.map((tech) => (
              <TechnicianCard
                key={tech.id}
                technician={tech}
                variant="horizontal"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
