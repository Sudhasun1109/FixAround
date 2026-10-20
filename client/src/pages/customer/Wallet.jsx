import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { customerApi } from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  Wallet as WalletIcon,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ShieldCheck,
  Award,
  RefreshCw,
  Clock,
  CheckCircle2,
  Gift,
} from 'lucide-react';

export default function CustomerWallet() {
  const [walletData, setWalletData] = useState({
    wallet_balance: 0,
    reward_points: 0,
    reward_points_value: 0,
    points_ratio: '5 points = ₹1',
    transactions: [],
    points_history: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Topup Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerApi.getWallet();
      const data = res?.data || {};
      setWalletData({
        wallet_balance: Number(data.wallet_balance || 0),
        reward_points: Number(data.reward_points || 0),
        reward_points_value: Number(data.reward_points_value || 0),
        points_ratio: data.points_ratio || '5 points = ₹1',
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        points_history: Array.isArray(data.points_history) ? data.points_history : [],
      });
    } catch (err) {
      console.error('Failed to load wallet:', err);
      showToast.error(err.message || 'Failed to fetch wallet information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleTopup = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 10) {
      showToast.error('Please enter a valid amount (min ₹10)');
      return;
    }

    try {
      setTopupLoading(true);
      const res = await customerApi.topupWallet(amount);
      showToast.success(res?.message || `₹${amount.toFixed(2)} added to FixAround Wallet!`);
      setShowTopupModal(false);
      setTopupAmount('');
      fetchWallet();
    } catch (err) {
      showToast.error(err.message || 'Failed to add money to wallet');
    } finally {
      setTopupLoading(false);
    }
  };

  const filteredTransactions = walletData.transactions.filter((tx) => {
    if (filter === 'ALL') return true;
    if (filter === 'REFUNDS') {
      return (
        tx.description?.toLowerCase().includes('refund') ||
        Boolean(tx.claim_id)
      );
    }
    if (filter === 'CREDITS') return tx.type === 'CREDIT';
    if (filter === 'DEBITS') return tx.type === 'DEBIT';
    return true;
  });

  const totalRefunds = walletData.transactions
    .filter((tx) => tx.type === 'CREDIT' && (tx.description?.toLowerCase().includes('refund') || tx.claim_id))
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  if (loading) {
    return <Spinner fullScreen label="Loading FixAround Wallet..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-fixteal-500" />
            Customer Wallet & Rewards
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            FixAround Wallet & Claim Refunds
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store funds for instant 1-click booking checkouts, collect claim refunds, and earn loyalty reward points.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setShowTopupModal(true)}
          >
            Add Money to Wallet
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={fetchWallet}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
              <WalletIcon className="w-4 h-4 text-emerald-200" />
              Available Balance
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">
              Active
            </span>
          </div>
          <div className="mt-5">
            <div className="text-3xl font-extrabold tracking-tight">
              {formatCurrency(walletData.wallet_balance)}
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              Usable for any service booking or emergency repairs
            </p>
          </div>
        </div>

        {/* Reward Points */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-500" />
              Reward Points
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              5 pts = ₹1
            </span>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-fixblue-900">
                {walletData.reward_points}
              </span>
              <span className="text-xs font-bold text-slate-400">pts</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 ml-auto">
                Worth {formatCurrency(walletData.reward_points_value)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Earn 20 points for every completed service!
            </p>
          </div>
        </div>

        {/* Total Claim Refunds */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-fixteal-600" />
              Claim Refunds Credited
            </span>
            <span className="text-[11px] font-semibold text-fixteal-700 bg-fixteal-50 px-2 py-0.5 rounded-md border border-fixteal-200">
              Dispute Resolves
            </span>
          </div>
          <div className="mt-5">
            <div className="text-3xl font-extrabold text-fixblue-900">
              {formatCurrency(totalRefunds)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              100% of approved warranty claim refunds
            </p>
          </div>
        </div>
      </div>

      {/* Reward Points Explanation Card */}
      <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">How FixAround Reward Points Work</h4>
            <p className="text-amber-800 text-[11px] mt-0.5">
              For every completed work on FixAround, you earn <strong>20 reward points</strong> automatically. You can redeem these points at checkout for an instant discount (<strong>5 points = ₹1</strong>).
            </p>
          </div>
        </div>
        <Link to="/customer/book">
          <Button variant="secondary" size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
            Book Next Service
          </Button>
        </Link>
      </div>

      {/* Wallet Activity & Refunds List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-fixblue-900">
              Wallet Transactions & Claim Refunds
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live ledger of deposits, claim refunds, and service payments.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            {[
              { label: 'All Transactions', value: 'ALL' },
              { label: 'Refunds Only', value: 'REFUNDS' },
              { label: 'Credits (+)', value: 'CREDITS' },
              { label: 'Debits (-)', value: 'DEBITS' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filter === tab.value
                    ? 'bg-fixblue-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="No transactions found"
            description="Your wallet activity, top-ups, and warranty claim refunds will be listed here."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              const isRefund = tx.description?.toLowerCase().includes('refund') || Boolean(tx.claim_id);

              return (
                <div
                  key={tx.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors px-2 rounded-xl"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                        isRefund
                          ? 'bg-fixteal-50 text-fixteal-700 border border-fixteal-200'
                          : isCredit
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm">
                          {tx.description}
                        </p>
                        {isRefund && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fixteal-100 text-fixteal-800">
                            Claim Refund
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-slate-400 text-[11px]">
                        <span>{formatDateTime(tx.created_at)}</span>
                        {tx.booking_number && (
                          <span>Booking #{tx.booking_number}</span>
                        )}
                        {tx.claim_number && (
                          <span>Claim #{tx.claim_number}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <span
                      className={`font-extrabold text-base ${
                        isCredit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Closing Bal: {formatCurrency(tx.balance_after)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Topup Modal */}
      <Modal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        title="Add Money to FixAround Wallet"
        size="sm"
      >
        <form onSubmit={handleTopup} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Top up your wallet for instant, frictionless checkouts on emergency repairs and service dispatches.
          </p>

          <Input
            label="Amount to Add (₹)"
            type="number"
            min="10"
            max="50000"
            step="10"
            required
            placeholder="e.g. 500"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
          />

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Quick Select:</span>
            <div className="grid grid-cols-4 gap-2">
              {[200, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTopupAmount(String(preset))}
                  className="py-1.5 px-2 text-xs font-bold rounded-lg border border-slate-200 hover:border-fixteal-500 hover:bg-teal-50/50 text-slate-700 transition-colors"
                >
                  +₹{preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTopupModal(false)}
              disabled={topupLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={topupLoading}
            >
              Add ₹{topupAmount || '0'} to Wallet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
