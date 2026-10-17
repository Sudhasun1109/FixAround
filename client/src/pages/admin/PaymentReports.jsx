import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/booking/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function PaymentReports() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
      };

      const res = await adminApi.getPayments(params);
      const list = res?.data?.payments || res?.data || [];
      const pagination = res?.pagination || {};

      setPayments(Array.isArray(list) ? list : []);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || list.length);
    } catch (err) {
      console.error('Failed to load payments report:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalCollected = payments
    .filter((p) => p.status === 'SUCCESS' || p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const platformCommission = totalCollected * 0.15;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Finance & Audit
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Payment Transactions & Revenue Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction ledger of customer payments, gateway charges, and platform commission.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchPayments}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Total Collected Volume"
          value={formatCurrency(totalCollected)}
          icon={CreditCard}
          color="green"
          subtitle="Processed through gateway"
        />

        <StatsCard
          label="Platform Revenue Share (15%)"
          value={formatCurrency(platformCommission)}
          icon={TrendingUp}
          color="blue"
          subtitle="FixAround revenue margin"
        />

        <StatsCard
          label="Technician Payout Pool"
          value={formatCurrency(totalCollected * 0.85)}
          icon={DollarSign}
          color="teal"
          subtitle="85% allocated for technicians"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="PENDING">PENDING</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
        >
          <option value="">All Payment Methods</option>
          <option value="SANDBOX">SANDBOX (Simulation)</option>
          <option value="UPI">UPI / QR</option>
          <option value="CARD">Credit / Debit Card</option>
          <option value="CASH">Cash on Delivery</option>
          <option value="ONLINE">Net Banking</option>
        </select>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Auditing payment transactions..." className="py-16" />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment records match filters"
            description="Adjust filters to inspect other transactions."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction #</th>
                  <th className="py-3 px-4">Booking</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-fixblue-900">
                      #{p.payment_number || `PAY-${p.id}`}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      #{p.booking_number || p.booking_id}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.customer_name || 'Customer'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {p.payment_method || 'DIGITAL'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-extrabold text-fixblue-900 text-sm">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={p.status} size="xs" />
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400">
                      {formatDateTime(p.created_at)}
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
    </div>
  );
}
