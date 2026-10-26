import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/booking/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Send,
  User,
  Wrench,
} from 'lucide-react';

export default function PaymentReports() {
  const [activeTab, setActiveTab] = useState('settlements'); // 'settlements' | 'payments'

  // Payments State
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentTotalCount, setPaymentTotalCount] = useState(0);

  // Settlements State
  const [settlements, setSettlements] = useState([]);
  const [settlementsSummary, setSettlementsSummary] = useState({});
  const [loadingSettlements, setLoadingSettlements] = useState(true);
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('');
  const [settlementPage, setSettlementPage] = useState(1);
  const [settlementTotalPages, setSettlementTotalPages] = useState(1);
  const [settlementTotalCount, setSettlementTotalCount] = useState(0);

  // Settle Modal State
  const [settlingItem, setSettlingItem] = useState(null);
  const [settleNotes, setSettleNotes] = useState('');
  const [submittingSettle, setSubmittingSettle] = useState(false);

  // Fetch Payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const params = {
        page: paymentPage,
        limit: 10,
        status: paymentStatusFilter || undefined,
        method: methodFilter || undefined,
      };

      const res = await adminApi.getPayments(params);
      const list = res?.data?.payments || res?.data || [];
      const pagination = res?.pagination || {};

      setPayments(Array.isArray(list) ? list : []);
      setPaymentTotalPages(pagination.totalPages || 1);
      setPaymentTotalCount(pagination.total || list.length);
    } catch (err) {
      console.error('Failed to load payments report:', err);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentPage, paymentStatusFilter, methodFilter]);

  // Fetch Settlements
  const fetchSettlements = useCallback(async () => {
    try {
      setLoadingSettlements(true);
      const params = {
        page: settlementPage,
        limit: 10,
        status: settlementStatusFilter || undefined,
      };

      const res = await adminApi.getSettlements(params);
      const data = res?.data || {};
      const list = data.settlements || [];
      const summary = data.summary || {};

      setSettlements(Array.isArray(list) ? list : []);
      setSettlementsSummary(summary);
      setSettlementTotalCount(data.total || list.length);
      setSettlementTotalPages(Math.ceil((data.total || list.length) / 10) || 1);
    } catch (err) {
      console.error('Failed to load settlements:', err);
      setSettlements([]);
    } finally {
      setLoadingSettlements(false);
    }
  }, [settlementPage, settlementStatusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Handle Settle Action
  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!settlingItem) return;

    try {
      setSubmittingSettle(true);
      await adminApi.settlePayout(settlingItem.id, {
        notes: settleNotes.trim() || `Verified & settled by Administrator`,
      });

      showToast.success(`Payout of ₹${settlingItem.net_amount} settled & released to technician!`);
      setSettlingItem(null);
      setSettleNotes('');
      fetchSettlements();
      fetchPayments();
    } catch (err) {
      showToast.error(err.message || 'Failed to settle payout');
    } finally {
      setSubmittingSettle(false);
    }
  };

  const totalCollected = payments
    .filter((p) => p.status === 'SUCCESS' || p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const platformCommission = settlementsSummary?.total_commission || (totalCollected * 0.15);
  const pendingPayouts = settlementsSummary?.total_pending || 0;
  const settledPayouts = settlementsSummary?.total_settled || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Finance & Audit
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Finance, Revenue & Technician Settlements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customer payment receipts and administrative verification to release technician payouts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={() => {
            fetchSettlements();
            fetchPayments();
          }}
        >
          Refresh Data
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Platform Revenue (15%)"
          value={formatCurrency(platformCommission)}
          icon={TrendingUp}
          color="blue"
          subtitle="FixAround commission retained"
        />

        <StatsCard
          label="Pending Admin Verification"
          value={formatCurrency(pendingPayouts)}
          icon={Clock}
          color="amber"
          subtitle="Held until Admin clicks Settle"
        />

        <StatsCard
          label="Settled & Transferred"
          value={formatCurrency(settledPayouts)}
          icon={CheckCircle2}
          color="green"
          subtitle="Released to technician balances"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`py-3 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'settlements'
              ? 'border-fixblue-800 text-fixblue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Technician Payout Settlements (Verify & Settle)</span>
          {Number(pendingPayouts) > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
              Action Required
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-fixblue-800 text-fixblue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-fixblue-800" />
          <span>Customer Payment Transactions (Inflow)</span>
        </button>
      </div>

      {/* TAB 1: TECHNICIAN SETTLEMENTS */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filter Status:</span>
              <select
                value={settlementStatusFilter}
                onChange={(e) => {
                  setSettlementStatusFilter(e.target.value);
                  setSettlementPage(1);
                }}
                className="text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
              >
                <option value="">All Settlements</option>
                <option value="PENDING">PENDING (Needs Admin Settle)</option>
                <option value="SETTLED">SETTLED (Paid to Tech)</option>
              </select>
            </div>

            <p className="text-xs text-slate-500">
              Payments are held securely in platform account until Admin verifies and releases to the technician.
            </p>
          </div>

          {/* Settlements Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loadingSettlements ? (
              <Spinner size="lg" label="Loading settlement ledger..." className="py-16" />
            ) : settlements.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No technician settlements match filter"
                description="When customers pay for completed bookings, payout settlement entries will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Booking</th>
                      <th className="py-3.5 px-4">Technician</th>
                      <th className="py-3.5 px-4 text-right">Gross Paid</th>
                      <th className="py-3.5 px-4 text-right">Platform Fee (15%)</th>
                      <th className="py-3.5 px-4 text-right">Net Technician Payout</th>
                      <th className="py-3.5 px-4 text-center">Settlement Status</th>
                      <th className="py-3.5 px-4 text-center">Admin Verification & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {settlements.map((s) => {
                      const isPending = s.settlement_status === 'PENDING';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-fixblue-900 block">
                              #{s.booking_number || `BK-${s.booking_id}`}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {s.booking_title || 'Service Repair'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">
                              {s.technician_name || `${s.technician_first_name || ''} ${s.technician_last_name || ''}`.trim() || 'Technician'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {s.technician_phone || s.technician_email}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-slate-600">
                            {formatCurrency(s.gross_amount)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-rose-600">
                            -{formatCurrency(s.commission_amount)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 text-sm">
                            {formatCurrency(s.net_amount)}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                                <Clock className="w-3 h-3" />
                                HELD (PENDING)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                SETTLED
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isPending ? (
                              <button
                                onClick={() => setSettlingItem(s)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify & Settle</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 block font-medium">
                                Released on {s.settled_at ? formatDateTime(s.settled_at) : 'Completed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingSettlements && settlementTotalPages > 1 && (
              <Pagination
                currentPage={settlementPage}
                totalPages={settlementTotalPages}
                totalItems={settlementTotalCount}
                onPageChange={setSettlementPage}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER PAYMENTS INFLOW */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPaymentPage(1);
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
                setPaymentPage(1);
              }}
              className="text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-fixteal-500"
            >
              <option value="">All Payment Methods</option>
              <option value="WALLET">FixAround Wallet</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="UPI">UPI / QR</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="CASH">Cash on Delivery</option>
              <option value="SANDBOX">Sandbox Mode</option>
            </select>
          </div>

          {/* Payment Records Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loadingPayments ? (
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
                      <th className="py-3.5 px-4">Transaction #</th>
                      <th className="py-3.5 px-4">Booking</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-fixblue-900">
                          #{p.payment_number || `PAY-${p.id}`}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          #{p.booking_number || p.booking_id}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {p.customer_name || 'Customer'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {p.payment_method || 'DIGITAL'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-extrabold text-fixblue-900 text-sm">
                          {formatCurrency(p.amount)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={p.status} size="xs" />
                        </td>

                        <td className="py-3.5 px-4 text-right text-slate-400">
                          {formatDateTime(p.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingPayments && paymentTotalPages > 1 && (
              <Pagination
                currentPage={paymentPage}
                totalPages={paymentTotalPages}
                totalItems={paymentTotalCount}
                onPageChange={setPaymentPage}
              />
            )}
          </div>
        </div>
      )}

      {/* Settle Payout Confirmation Modal */}
      <Modal
        isOpen={Boolean(settlingItem)}
        onClose={() => setSettlingItem(null)}
        title="Admin Payout Verification & Settlement"
        size="md"
      >
        {settlingItem && (
          <form onSubmit={handleConfirmSettle} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Service Booking:</span>
                <span className="font-mono font-bold text-slate-900">
                  #{settlingItem.booking_number || `BK-${settlingItem.booking_id}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Technician:</span>
                <span className="font-bold text-slate-900">{settlingItem.technician_name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Customer Gross Payment:</span>
                <span className="font-bold text-slate-900">{formatCurrency(settlingItem.gross_amount)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Platform Commission (15%):</span>
                <span className="font-bold text-rose-600">-{formatCurrency(settlingItem.commission_amount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-extrabold text-emerald-700">
                <span>Net Transfer to Technician:</span>
                <span className="text-base">{formatCurrency(settlingItem.net_amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Verification & Approval Notes (Optional)
              </label>
              <textarea
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
                placeholder="e.g. Service quality verified with client. Payout approved."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-fixteal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSettlingItem(null)}
                disabled={submittingSettle}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submittingSettle}
                icon={CheckCircle2}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Confirm & Release Payout
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
