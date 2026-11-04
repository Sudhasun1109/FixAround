import React, { useState, useEffect } from 'react';
import { techniciansApi } from '../../services/api';
import {
  Wallet as WalletIcon,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FileText,
  CreditCard,
  Banknote,
  HelpCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TechnicianWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [loading, setLoading] = useState(true);

  // Settle Commission Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settling, setSettling] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, txRes] = await Promise.all([
        techniciansApi.getWallet(),
        techniciansApi.getWalletTransactions({ page: pagination.page, limit: pagination.limit })
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data || []);
      if (txRes.pagination) {
        setPagination(txRes.pagination);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
      toast.error('Could not load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [pagination.page]);

  const handleSettle = async (e) => {
    e.preventDefault();
    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }

    try {
      setSettling(true);
      await techniciansApi.settleCashCommission(amt);
      toast.success(`Successfully settled ₹${amt.toFixed(2)} in outstanding commission!`);
      setShowSettleModal(false);
      setSettleAmount('');
      fetchWalletData();
    } catch (err) {
      toast.error(err.message || 'Failed to settle commission');
    } finally {
      setSettling(false);
    }
  };

  const getTransactionTypeBadge = (type) => {
    switch (type) {
      case 'CASH_COLLECTED':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
            <Banknote className="w-3 h-3" /> Cash Job
          </span>
        );
      case 'ONLINE_PAYOUT':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
            <ArrowDownLeft className="w-3 h-3" /> Online Payout
          </span>
        );
      case 'COMMISSION_SETTLEMENT':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Commission Paid
          </span>
        );
      case 'WITHDRAWAL':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
            <ArrowUpRight className="w-3 h-3" /> Withdrawal
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <WalletIcon className="w-6 h-6 text-fixblue-700" />
            <span>Technician Earnings & Wallet</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track available balances, 15% platform commission deductions, cash collections, and immutable ledger transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchWalletData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {wallet && wallet.outstanding_commission > 0 && (
            <button
              type="button"
              onClick={() => {
                setSettleAmount(wallet.outstanding_commission.toFixed(2));
                setShowSettleModal(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Settle Outstanding (₹{wallet.outstanding_commission.toFixed(2)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {wallet && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Available Balance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Balance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <WalletIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{Number(wallet.available_balance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Ready for weekly withdrawal</p>
          </div>

          {/* Outstanding Commission Liability */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Commission</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-700">
              ₹{Number(wallet.outstanding_commission || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">15% fee from collected cash jobs</p>
          </div>

          {/* Net Balance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Standing</span>
              <div className="w-8 h-8 rounded-lg bg-fixblue-50 text-fixblue-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-extrabold ${wallet.net_balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              ₹{Number(wallet.net_balance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Available minus liability</p>
          </div>

          {/* Total Online Earnings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cash Collected</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{Number(wallet.total_cash_collected || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Cash received in person</p>
          </div>
        </div>
      )}

      {/* 15% Commission Platform Rule Explanation Box */}
      <div className="bg-gradient-to-r from-fixblue-50 to-slate-50 p-5 rounded-2xl border border-fixblue-200/80 shadow-xs flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-fixblue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <h4 className="font-bold text-slate-900 text-sm">How the 15% Platform Commission Works:</h4>
          <p>
            • <strong>Cash Payments (Scenario A):</strong> When you collect ₹1,000 cash from the customer, 15% (₹150) is charged as outstanding commission liability.
          </p>
          <p>
            • <strong>Online Payments (Scenario B):</strong> When a customer pays ₹2,000 online, the 15% commission (₹300) plus any prior cash liability (₹150) is automatically deducted (Total: ₹450). The remaining ₹1,550 is credited directly to your wallet, clearing your cash commission liability to ₹0.
          </p>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-fixblue-700" />
            <h3 className="text-base font-bold text-slate-900">Transaction History Ledger</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total {pagination.total || transactions.length} Record(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-3 border-fixblue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading ledger records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No wallet transactions recorded yet. Completed bookings will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date / Ref</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Gross Amount</th>
                  <th className="py-3.5 px-4">Commission (15%)</th>
                  <th className="py-3.5 px-4">Prior Liability</th>
                  <th className="py-3.5 px-4">Deducted</th>
                  <th className="py-3.5 px-4">Net Payout</th>
                  <th className="py-3.5 px-4">Liability Remaining</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                      <div className="text-slate-400">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {tx.booking_number && (
                        <span className="inline-block mt-0.5 text-[10px] text-fixblue-700 font-bold">
                          #{tx.booking_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getTransactionTypeBadge(tx.transaction_type)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{tx.gross_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      ₹{tx.commission_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      ₹{tx.previous_outstanding.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">
                      -₹{tx.commission_deducted.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      +₹{tx.net_amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">
                      ₹{tx.new_outstanding.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{tx.new_available_balance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={tx.description}>
                      {tx.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SETTLE COMMISSION MODAL */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <span>Settle Commission</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettle} className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                Directly clear outstanding commission liability from your cash jobs via simulated payment.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-300 pl-8 pr-3 py-2.5 focus:border-fixblue-500 focus:outline-hidden font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {settling ? 'Processing...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
