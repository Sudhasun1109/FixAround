import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsApi, paymentsApi, invoicesApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
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
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const bRes = await bookingsApi.getById(id);
        const bData = bRes?.data?.booking || bRes?.data || bRes;
        setBooking(bData);

        // Try load invoice
        try {
          const invRes = await invoicesApi.getByBooking(id);
          const invData = invRes?.data?.invoice || invRes?.data || invRes;
          setInvoice(invData);
        } catch {
          // If invoice not generated yet, calculate from booking final_total
        }
      } catch (err) {
        showToast.error(err.message || 'Failed to load checkout details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const totalAmount =
    invoice?.total_amount ||
    booking?.final_total ||
    booking?.estimated_total ||
    500;

  const handlePayNow = async () => {
    try {
      setProcessing(true);

      // 1. Razorpay Gateway Flow (RAZORPAY, UPI, CARD)
      if (paymentMethod === 'RAZORPAY' || paymentMethod === 'UPI' || paymentMethod === 'CARD') {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          showToast.error('Razorpay SDK could not be loaded. Please check your internet connection.');
          setProcessing(false);
          return;
        }

        const res = await paymentsApi.createRazorpayOrder({
          booking_id: booking.id,
          amount: totalAmount,
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

      // 2. Instant Sandbox Test Mode
      if (paymentMethod === 'SANDBOX') {
        const initRes = await paymentsApi.initiate({
          booking_id: booking.id,
          amount: totalAmount,
          payment_method: 'SANDBOX',
        });

        const paymentData = initRes?.data?.payment || initRes?.data || initRes;

        const verifyRes = await paymentsApi.simulateSandbox({
          booking_id: booking.id,
          payment_id: paymentData.id,
          amount: totalAmount,
          status: 'SUCCESS',
        });

        setPaymentResult(verifyRes?.data || verifyRes);
        setPaymentSuccess(true);
        showToast.success('Instant test payment completed successfully!');
        return;
      }

      // 3. Cash on Delivery
      await paymentsApi.initiate({
        booking_id: booking.id,
        amount: totalAmount,
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
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Payment Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900">
            {formatCurrency(totalAmount)} Paid Successfully
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your transaction is complete. The FixAround warranty protection is now active for this repair.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2 max-w-sm mx-auto shadow-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Booking Ref:</span>
            <span className="font-bold text-slate-800">#{booking?.booking_number || booking?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Payment Mode:</span>
            <span className="font-bold text-slate-800">{paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Warranty Coverage:</span>
            <span className="font-bold text-emerald-600">Active</span>
          </div>
        </div>

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
          to={`/customer/bookings/${booking.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Booking</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-2">
          Secure Payment Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your invoice amount and choose a payment method.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-fixblue-900 uppercase tracking-wider">
            Select Payment Method
          </h2>

          <div className="space-y-3">
            {/* Razorpay Gateway Option */}
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
                    Razorpay Gateway (UPI, Cards, NetBanking, Wallets)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pay securely using Google Pay, PhonePe, Paytm, BHIM, Cards or NetBanking
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Official Gateway
              </span>
            </label>

            {/* Sandbox Option */}
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fixteal-100 text-fixteal-800">
                1-Click Demo
              </span>
            </label>

            {/* Cash */}
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
              <Banknote className="w-5 h-5 text-slate-400" />
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              loading={processing}
              onClick={handlePayNow}
              icon={Lock}
            >
              Authorize & Pay {formatCurrency(totalAmount)}
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
                  {booking.service_name || 'Repair Service'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
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
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-fixblue-900">Total Payable:</span>
              <span className="text-xl font-extrabold text-fixblue-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-fixteal-600" />
              <span>FixAround Escrow Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-teal-700">
              Funds are held safely until you confirm complete job satisfaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
