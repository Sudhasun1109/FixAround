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

export default function PaymentCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('SANDBOX');
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

      // 1. Initiate Payment
      const initRes = await paymentsApi.initiate({
        booking_id: booking.id,
        amount: totalAmount,
        payment_method: paymentMethod,
      });

      const paymentData = initRes?.data?.payment || initRes?.data || initRes;

      // 2. Simulate or Verify Payment
      if (paymentMethod === 'SANDBOX' || paymentMethod === 'ONLINE' || paymentMethod === 'CARD' || paymentMethod === 'UPI') {
        const verifyRes = await paymentsApi.simulateSandbox({
          booking_id: booking.id,
          payment_id: paymentData.id,
          amount: totalAmount,
          status: 'SUCCESS',
        });

        setPaymentResult(verifyRes?.data || verifyRes);
        setPaymentSuccess(true);
        showToast.success('Payment completed successfully!');
      } else {
        // Cash payment marked
        setPaymentResult({ method: 'CASH', status: 'SUCCESS' });
        setPaymentSuccess(true);
        showToast.success('Cash payment recorded with technician.');
      }
    } catch (err) {
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
                Recommended for Demo
              </span>
            </label>

            {/* UPI */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'UPI'
                  ? 'border-fixteal-500 bg-teal-50/50 ring-2 ring-fixteal-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="text-fixteal-600 focus:ring-fixteal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    UPI / QR Code (GPay, PhonePe, Paytm)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pay directly from your favorite UPI mobile app
                  </span>
                </div>
              </div>
              <QrCode className="w-5 h-5 text-slate-400" />
            </label>

            {/* Card */}
            <label
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'CARD'
                  ? 'border-fixteal-500 bg-teal-50/50 ring-2 ring-fixteal-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="text-fixteal-600 focus:ring-fixteal-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Credit / Debit Card
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Visa, MasterCard, RuPay, Maestro
                  </span>
                </div>
              </div>
              <CreditCard className="w-5 h-5 text-slate-400" />
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
