import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsApi, paymentsApi, invoicesApi, customerApi, reviewsApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import StarRating from '../../components/review/StarRating';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Receipt,
  Banknote,
  Lock,
  Wallet,
  Gift,
  Sparkles,
  Star,
  Plus,
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

export default function PaymentCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [wallet, setWallet] = useState({ wallet_balance: 0, reward_points: 0, reward_points_value: 0 });
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Points redemption
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Topup Modal
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [topupLoading, setTopupLoading] = useState(false);

  // Review section state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, wRes] = await Promise.allSettled([
        bookingsApi.getById(id),
        customerApi.getWallet(),
      ]);

      if (bRes.status === 'fulfilled') {
        const bData = bRes.value?.data?.booking || bRes.value?.data || bRes.value;
        setBooking(bData);
      }

      if (wRes.status === 'fulfilled') {
        const wData = wRes.value?.data || {};
        const wb = Number(wData.wallet_balance || 0);
        const rp = Number(wData.reward_points || 0);
        setWallet({
          wallet_balance: wb,
          reward_points: rp,
          reward_points_value: Math.floor(rp / 5),
        });

        // Set default payment method: WALLET if balance is sufficient, otherwise RAZORPAY
        if (wb > 0) {
          setPaymentMethod('WALLET');
        } else {
          setPaymentMethod('RAZORPAY');
        }
      }

      // Try load invoice
      try {
        const invRes = await invoicesApi.getByBooking(id);
        const invData = invRes?.data?.invoice || invRes?.data || invRes;
        setInvoice(invData);
      } catch {
        // Fallback to booking totals
      }
    } catch (err) {
      showToast.error(err.message || 'Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const rawTotal =
    invoice?.total_amount ||
    booking?.final_total ||
    booking?.estimated_total ||
    500;

  const totalAmount = parseFloat(rawTotal);

  // 5 points = ₹1 calculation
  const maxPossiblePointsDiscount = Math.floor(wallet.reward_points / 5);
  const pointsDiscount = Math.min(maxPossiblePointsDiscount, totalAmount);
  const pointsToRedeem = pointsDiscount * 5;

  const payableAmount = redeemPoints
    ? Math.max(0, Math.round((totalAmount - pointsDiscount) * 100) / 100)
    : totalAmount;

  const hasSufficientWallet = wallet.wallet_balance >= payableAmount;

  // Handle Quick Wallet Topup
  const handleTopup = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 10) {
      showToast.error('Please enter a valid amount');
      return;
    }

    try {
      setTopupLoading(true);
      const res = await customerApi.topupWallet(amount);
      showToast.success(res?.message || `₹${amount} added to Wallet!`);
      setShowTopupModal(false);
      fetchDetails();
    } catch (err) {
      showToast.error(err.message || 'Failed to top-up wallet');
    } finally {
      setTopupLoading(false);
    }
  };

  // Submit Review after Payment
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) {
      showToast.error('Please select a star rating');
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewsApi.create({
        booking_id: booking.id,
        rating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim() || undefined,
      });

      setReviewSubmitted(true);
      showToast.success('Thank you! Your review has been submitted.');
    } catch (err) {
      showToast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setProcessing(true);

      // 1. FixAround Wallet Payment
      if (paymentMethod === 'WALLET') {
        if (!hasSufficientWallet) {
          showToast.error('Insufficient wallet balance. Please add money or choose another payment method.');
          setProcessing(false);
          return;
        }

        const res = await paymentsApi.payWithWallet({
          booking_id: booking.id,
          points_redeemed: redeemPoints ? pointsToRedeem : 0,
        });

        setPaymentResult(res?.data || res);
        setPaymentSuccess(true);
        showToast.success('Payment completed successfully using FixAround Wallet!');
        return;
      }

      // 2. Razorpay Gateway Flow
      if (paymentMethod === 'RAZORPAY' || paymentMethod === 'UPI' || paymentMethod === 'CARD') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          showToast.error('Razorpay SDK could not be loaded. Please check your internet connection.');
          setProcessing(false);
          return;
        }

        const res = await paymentsApi.createRazorpayOrder({
          booking_id: booking.id,
          amount: payableAmount,
        });

        const orderData = res?.data || res;

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'FixAround Services',
          description: `Repair Service Payment - #${booking.booking_number || booking.id}`,
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              setProcessing(true);
              const verifyRes = await paymentsApi.verifyRazorpay({
                booking_id: booking.id,
                payment_id: orderData.paymentId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              setPaymentResult(verifyRes?.data || verifyRes);
              setPaymentSuccess(true);
              showToast.success('Razorpay payment verified successfully!');
            } catch (err) {
              console.error('Payment verification failed:', err);
              showToast.error(err.message || 'Payment verification failed');
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            name: orderData.customerName || booking.customer_name || '',
            email: orderData.customerEmail || booking.customer_email || '',
            contact: orderData.customerPhone || booking.customer_phone || '',
          },
          theme: {
            color: '#0d9488',
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              showToast.error('Payment window closed');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          console.error('Payment failed:', resp.error);
          showToast.error(resp.error?.description || 'Payment failed');
          setProcessing(false);
        });
        rzp.open();
        return;
      }

      // 3. Instant Sandbox Test Mode
      if (paymentMethod === 'SANDBOX') {
        const initRes = await paymentsApi.initiate({
          booking_id: booking.id,
          amount: payableAmount,
          payment_method: 'SANDBOX',
        });

        const paymentData = initRes?.data?.payment || initRes?.data || initRes;

        const verifyRes = await paymentsApi.simulateSandbox({
          booking_id: booking.id,
          payment_id: paymentData.id,
          amount: payableAmount,
          status: 'SUCCESS',
        });

        setPaymentResult(verifyRes?.data || verifyRes);
        setPaymentSuccess(true);
        showToast.success('Instant test payment completed successfully!');
        return;
      }

      // 4. Cash on Delivery
      await paymentsApi.initiate({
        booking_id: booking.id,
        amount: payableAmount,
        payment_method: 'CASH',
      });
      setPaymentResult({ method: 'CASH', status: 'SUCCESS' });
      setPaymentSuccess(true);
      showToast.success('Cash payment recorded with technician.');
    } catch (err) {
      console.error('Payment error:', err);
      showToast.error(err.message || 'Payment transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Preparing secure checkout..." />;
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
            Payment Complete & Work Finalized
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900">
            {formatCurrency(payableAmount)} Paid Successfully
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your transaction is complete. The work has been marked completed and your warranty is active.
          </p>
        </div>

        {/* 20 Reward Points Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 text-white">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-sm">+20 Reward Points Earned!</p>
              <p className="text-xs text-amber-100">
                Added to your FixAround account. Use them for discounts on your next repair (5 pts = ₹1).
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-extrabold shrink-0">
            +20 PTS
          </span>
        </div>

        {/* Transaction Summary Box */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2 shadow-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Booking Ref:</span>
            <span className="font-bold text-slate-800">#{booking?.booking_number || booking?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Payment Mode:</span>
            <span className="font-bold text-slate-800">{paymentMethod}</span>
          </div>
          {redeemPoints && pointsDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Points Discount Applied:</span>
              <span className="font-bold">-{formatCurrency(pointsDiscount)} ({pointsToRedeem} pts)</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Warranty Coverage:</span>
            <span className="font-bold text-emerald-600">Active</span>
          </div>
        </div>

        {/* Review Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div>
              <h3 className="text-base font-bold text-fixblue-900">
                Rate & Review Specialist
              </h3>
              <p className="text-xs text-slate-500">
                How was the service provided by {booking?.technician_name || 'your technician'}?
              </p>
            </div>
          </div>

          {reviewSubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold text-emerald-800 text-xs">Review Submitted Successfully!</p>
              <p className="text-[11px] text-emerald-600">Thank you for helping keep our community quality high.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Rating</label>
                <StarRating rating={rating} onRatingChange={setRating} interactive size="lg" />
              </div>

              <Input
                label="Review Title"
                placeholder="e.g. Excellent AC repair and very punctual!"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />

              <Textarea
                label="Detailed Feedback"
                rows={3}
                placeholder="Write your experience with the technician and repair quality..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" loading={submittingReview}>
                  Submit Rating & Review
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Action Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to={`/customer/invoices/${booking.id}`}>
            <Button variant="outline" size="md" icon={Receipt}>
              Download Tax Invoice
            </Button>
          </Link>

          <Link to={`/customer/bookings/${booking.id}`}>
            <Button variant="primary" size="md" icon={ArrowRight}>
              Return to Booking Details
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <Link
          to={`/customer/bookings/${booking?.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Booking</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-2">
          Secure Payment Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review repair invoice and choose your preferred settlement method.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider">
            Select Payment Method
          </h2>

          <div className="space-y-3">
            {/* FixAround Wallet Option */}
            <label
              className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'WALLET'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'WALLET'}
                  onChange={() => setPaymentMethod('WALLET')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      FixAround Wallet
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Balance: {formatCurrency(wallet.wallet_balance)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Instant 1-click checkout with your wallet funds & claim refunds
                  </span>

                  {!hasSufficientWallet && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-amber-700 font-semibold">
                        Insufficient balance (Needs {formatCurrency(payableAmount)})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTopupModal(true);
                        }}
                        className="text-[11px] font-bold text-fixteal-700 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        Topup Wallet
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
            </label>

            {/* Razorpay Gateway */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'RAZORPAY'
                  ? 'border-fixteal-500 bg-teal-50/50 ring-2 ring-fixteal-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="text-fixteal-600 focus:ring-fixteal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Razorpay Gateway (UPI, Cards, NetBanking)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pay securely using Google Pay, PhonePe, Paytm, BHIM, Cards or NetBanking
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                Official Gateway
              </span>
            </label>

            {/* Instant Sandbox Simulator */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'SANDBOX'
                  ? 'border-fixteal-500 bg-teal-50/50 ring-2 ring-fixteal-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'SANDBOX'}
                  onChange={() => setPaymentMethod('SANDBOX')}
                  className="text-fixteal-600 focus:ring-fixteal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Instant Sandbox Simulator (Test Mode)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Instantly simulate gateway verification without real money
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fixteal-100 text-fixteal-800 shrink-0">
                1-Click Demo
              </span>
            </label>

            {/* Cash on Delivery */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'CASH'
                  ? 'border-fixteal-500 bg-teal-50/50 ring-2 ring-fixteal-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  className="text-fixteal-600 focus:ring-fixteal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Cash on Delivery / Direct to Technician
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pay physical cash directly to technician upon completion
                  </span>
                </div>
              </div>
              <Banknote className="w-5 h-5 text-slate-400 shrink-0" />
            </label>
          </div>

          {/* Reward Points Redemption Checkbox */}
          {wallet.reward_points >= 5 && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="redeem-points"
                checked={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.checked)}
                className="mt-1 text-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor="redeem-points" className="cursor-pointer text-xs space-y-0.5">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  Redeem {pointsToRedeem} Reward Points for a {formatCurrency(pointsDiscount)} discount!
                </span>
                <span className="text-[11px] text-amber-700 block">
                  Rule: 5 points = ₹1. You have {wallet.reward_points} total points available.
                </span>
              </label>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="button"
              variant={paymentMethod === 'WALLET' ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
              loading={processing}
              onClick={handlePayNow}
              icon={Lock}
            >
              {paymentMethod === 'WALLET'
                ? `Pay ${formatCurrency(payableAmount)} from Wallet`
                : `Authorize & Pay ${formatCurrency(payableAmount)}`}
            </Button>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Service Category:</span>
                <span className="font-semibold text-slate-800">
                  {booking?.service_name || 'Repair Service'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(totalAmount * 0.8475)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST / Platform Fee (18%):</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(totalAmount * 0.1525)}
                </span>
              </div>

              {redeemPoints && pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 pt-1 border-t border-slate-100">
                  <span>Reward Points Discount:</span>
                  <span className="font-bold">-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-fixblue-900">Total Payable:</span>
              <span className="text-xl font-extrabold text-fixblue-900">
                {formatCurrency(payableAmount)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-fixteal-600" />
              <span>FixAround Escrow Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-teal-700">
              Funds are held safely until you confirm complete job satisfaction. Earn 20 reward points upon completion!
            </p>
          </div>
        </div>
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
            Top up your wallet to pay instantly for booking #{booking?.booking_number || id}.
          </p>

          <Input
            label="Amount to Add (₹)"
            type="number"
            min="10"
            max="50000"
            step="10"
            required
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
          />

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
