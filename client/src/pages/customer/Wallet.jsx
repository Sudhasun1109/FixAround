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
  CreditCard,
  Lock,
} from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
  const [topupAmount, setTopupAmount] = useState('500');
  const [topupMethod, setTopupMethod] = useState('RAZORPAY'); // 'RAZORPAY' or 'INSTANT'
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
      showToast.error('Please enter a valid amount (minimum ₹10)');
      return;
    }

    try {
      setTopupLoading(true);

      // 1. Razorpay Official Gateway Flow
      if (topupMethod === 'RAZORPAY') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          showToast.error('Razorpay SDK could not be loaded. Please check your internet connection.');
          setTopupLoading(false);
          return;
        }

        const res = await customerApi.createWalletRazorpayOrder(amount);
        const orderData = res?.data || res;

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'FixAround Platform',
          description: `FixAround Wallet Top-up (₹${amount})`,
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              setTopupLoading(true);
              const verifyRes = await customerApi.verifyWalletRazorpay({
                amount,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              showToast.success(verifyRes?.message || `₹${amount.toFixed(2)} added to FixAround Wallet!`);
              setShowTopupModal(false);
              setTopupAmount('500');
              fetchWallet();
            } catch (err) {
              console.error('Wallet top-up verification failed:', err);
              showToast.error(err.message || 'Payment verification failed');
            } finally {
              setTopupLoading(false);
            }
          },
          prefill: {
            name: orderData.customerName || '',
            email: orderData.customerEmail || '',
            contact: orderData.customerPhone || ''
          },
          notes: {
            type: 'WALLET_TOPUP',
            amount: String(amount)
          },
          theme: {
            color: '#1e3a5f'
          },
          modal: {
            ondismiss: function () {
              setTopupLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          console.error('Razorpay Payment failed:', resp.error);
          showToast.error(resp.error?.description || 'Razorpay payment was not completed');
          setTopupLoading(false);
        });
        rzp.open();
        return;
      }

      // 2. Instant Demo / Test Mode Top-up
      const res = await customerApi.topupWallet(amount);
      showToast.success(res?.message || `₹${amount.toFixed(2)} added to FixAround Wallet!`);
      setShowTopupModal(false);
      setTopupAmount('500');
      fetchWallet();
    } catch (err) {
      showToast.error(err.message || 'Failed to add money to wallet');
    } finally {
      if (topupMethod !== 'RAZORPAY') {
        setTopupLoading(false);
      }
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
        <div className="p-6 rounded-3xl bg-linear-to-br from-fixblue-900 via-fixblue-800 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
            <WalletIcon className="w-36 h-36" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
              Available Wallet Balance
            </span>
            <span className="p-2 rounded-xl bg-white/10 text-teal-300 backdrop-blur-xs">
              <WalletIcon className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight mb-2">
            {formatCurrency(walletData.wallet_balance)}
          </div>
          <p className="text-xs text-slate-300">
            Ready to use at checkout for emergency bookings and scheduled jobs.
          </p>
        </div>

        {/* Claim Refunds */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-teal-800 to-emerald-900 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
            <ShieldCheck className="w-36 h-36" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              Warranty Refunds Received
            </span>
            <span className="p-2 rounded-xl bg-white/10 text-emerald-200 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight mb-2">
            {formatCurrency(totalRefunds)}
          </div>
          <p className="text-xs text-slate-200">
            Resolution payouts credited directly to wallet from warranty claims.
          </p>
        </div>

        {/* Reward Points */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
            <Gift className="w-36 h-36" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
              Reward Points Balance
            </span>
            <span className="p-2 rounded-xl bg-white/10 text-amber-100 backdrop-blur-xs">
              <Award className="w-5 h-5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black tracking-tight">
              {walletData.reward_points}
            </span>
            <span className="text-xs font-bold text-amber-100">
              pts ({formatCurrency(walletData.reward_points_value)})
            </span>
          </div>
          <p className="text-xs text-amber-100">
            Rule: <strong>5 points = ₹1</strong>. Earn +20 points on every completed repair!
          </p>
        </div>
      </div>

      {/* Tabs and Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Wallet Activity & Refunds History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live ledger of top-ups, booking payments, and dispute resolutions.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
            {[
              { id: 'ALL', label: 'All Activity' },
              { id: 'REFUNDS', label: 'Refunds' },
              { id: 'CREDITS', label: 'Credits' },
              { id: 'DEBITS', label: 'Payments' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.id
                    ? 'bg-white text-fixblue-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Table */}
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No wallet transactions found"
            description="Your wallet top-ups, service checkout payments, and refund credits will appear here."
            className="py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Reference</th>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'CREDIT';
                  const isRefund =
                    tx.description?.toLowerCase().includes('refund') ||
                    Boolean(tx.claim_id);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                            isRefund
                              ? 'bg-teal-100 text-teal-800'
                              : isCredit
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-slate-500" />
                          )}
                          <span>
                            {isRefund ? 'CLAIM REFUND' : tx.type}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-slate-800 font-semibold max-w-xs truncate">
                        {tx.description}
                      </td>

                      <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                        {tx.claim_number ? (
                          <span className="text-teal-700 font-bold">
                            {tx.claim_number}
                          </span>
                        ) : tx.booking_number ? (
                          <Link
                            to={`/customer/bookings/${tx.booking_id}`}
                            className="text-fixblue-800 font-bold hover:underline"
                          >
                            {tx.booking_number}
                          </Link>
                        ) : (
                          'Wallet Top-up'
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                        {formatDateTime(tx.created_at)}
                      </td>

                      <td
                        className={`py-3.5 px-5 text-right font-extrabold text-sm whitespace-nowrap ${
                          isCredit ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>

                      <td className="py-3.5 px-5 text-right text-slate-600 font-mono whitespace-nowrap">
                        {formatCurrency(tx.balance_after)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reward Points Earned History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Loyalty Points History ({walletData.points_history.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Automatic +20 Points on each completed job
          </span>
        </div>

        {walletData.points_history.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No reward point activities yet. Complete your first repair job to earn 20 points!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {walletData.points_history.map((pt) => (
              <div
                key={pt.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{pt.reason}</p>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(pt.created_at)}
                    {pt.booking_number && ` &bull; Ref: ${pt.booking_number}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-amber-600 text-sm">
                    +{pt.points} pts
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Bal: {pt.balance_after} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topup Modal with Razorpay */}
      <Modal
        isOpen={showTopupModal}
        onClose={() => {
          if (!topupLoading) setShowTopupModal(false);
        }}
        title="Add Money to FixAround Wallet"
        size="md"
      >
        <form onSubmit={handleTopup} className="space-y-5 text-xs">
          <p className="text-slate-500 leading-relaxed">
            Top up your wallet for instant 1-click checkout on all emergency repairs, scheduled bookings, and technician services.
          </p>

          <Input
            label="Amount to Add (₹)"
            type="number"
            min="10"
            max="100000"
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
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                    Number(topupAmount) === preset
                      ? 'border-fixteal-500 bg-teal-50 text-fixteal-800 ring-2 ring-fixteal-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  +₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
              Select Payment Method
            </span>

            {/* Razorpay Gateway (Primary) */}
            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                topupMethod === 'RAZORPAY'
                  ? 'border-fixteal-500 bg-teal-50/60 ring-2 ring-fixteal-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="wallet_topup_method"
                  checked={topupMethod === 'RAZORPAY'}
                  onChange={() => setTopupMethod('RAZORPAY')}
                  className="text-fixteal-600 focus:ring-fixteal-500"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      Razorpay Gateway
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      Recommended
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    UPI, Google Pay, PhonePe, Paytm, Debit/Credit Cards & NetBanking
                  </span>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-fixteal-600 shrink-0" />
            </label>

            {/* Instant Sandbox / Demo Topup */}
            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                topupMethod === 'INSTANT'
                  ? 'border-fixteal-500 bg-teal-50/60 ring-2 ring-fixteal-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="wallet_topup_method"
                  checked={topupMethod === 'INSTANT'}
                  onChange={() => setTopupMethod('INSTANT')}
                  className="text-fixteal-600 focus:ring-fixteal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Instant Sandbox Demo Add
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Instantly simulate wallet credit without external payment gateway
                  </span>
                </div>
              </div>
              <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>256-bit SSL Encrypted</span>
            </div>

            <div className="flex gap-2">
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
                icon={topupMethod === 'RAZORPAY' ? ShieldCheck : Plus}
              >
                Pay & Add ₹{topupAmount || '0'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
