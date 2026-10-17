import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { invoicesApi, bookingsApi } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/booking/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import { Printer, ArrowLeft, Download, ShieldCheck, Wrench } from 'lucide-react';

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        let invData = null;
        try {
          const res = await invoicesApi.getById(id);
          invData = res?.data?.invoice || res?.data || res;
        } catch {
          const resB = await invoicesApi.getByBooking(id);
          invData = resB?.data?.invoice || resB?.data || resB;
        }

        setInvoice(invData);

        // Fetch booking info for extra details if available
        if (invData?.booking_id) {
          try {
            const bRes = await bookingsApi.getById(invData.booking_id);
            setBooking(bRes?.data?.booking || bRes?.data || bRes);
          } catch {
            // Optional
          }
        }
      } catch (err) {
        showToast.error(err.message || 'Invoice not found');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Spinner fullScreen label="Loading tax invoice..." />;
  }

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Invoice Unavailable</h2>
        <p className="text-xs text-slate-500">
          The requested tax invoice could not be located or has not yet been finalized.
        </p>
        <Link to="/customer/bookings">
          <Button variant="outline" icon={ArrowLeft}>
            Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = Number(invoice.subtotal) || Number(invoice.total_amount) * 0.8475 || 0;
  const taxAmount = Number(invoice.tax_amount) || Number(invoice.total_amount) * 0.1525 || 0;
  const total = Number(invoice.total_amount) || 0;

  // Parse line items if present or construct defaults
  let items = [];
  try {
    if (typeof invoice.line_items === 'string') {
      items = JSON.parse(invoice.line_items);
    } else if (Array.isArray(invoice.line_items)) {
      items = invoice.line_items;
    }
  } catch {
    items = [];
  }

  if (items.length === 0) {
    items = [
      { description: 'Professional Labor Charges', amount: subtotal * 0.7 },
      { description: 'Replacement Materials & Components', amount: subtotal * 0.2 },
      { description: 'Visiting & Inspection Fee', amount: subtotal * 0.1 },
    ];
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Top action header (hidden on print) */}
      <div className="no-print flex items-center justify-between">
        <Link
          to={`/customer/bookings/${invoice.booking_id || id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Booking</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        {/* Invoice Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-fixblue-800 text-white flex items-center justify-center font-bold text-xl shadow-md">
              <Wrench className="w-6 h-6 text-fixteal-400" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-fixblue-900">
                Fix<span className="text-fixteal-600">Around</span>
              </span>
              <span className="block text-[10px] text-slate-400">
                FixAround Technologies Pvt. Ltd. &bull; GSTIN: 07AAAAA0000A1Z5
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              TAX INVOICE
            </span>
            <span className="text-lg font-mono font-extrabold text-slate-800">
              #{invoice.invoice_number || `INV-${invoice.id}`}
            </span>
            <div className="mt-1">
              <StatusBadge status={invoice.status || 'PAID'} size="sm" />
            </div>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div>
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1">
              Billed To:
            </h4>
            <p className="font-bold text-slate-900 text-sm">
              {invoice.customer_name || booking?.customer_name || 'Customer'}
            </p>
            <p className="text-slate-500 mt-0.5">
              {booking?.customer_address || 'Delhi NCR, India'}
            </p>
            <p className="text-slate-500">Phone: {booking?.customer_phone || '-'}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1">
              Service Specialist:
            </h4>
            <p className="font-bold text-slate-900 text-sm">
              {invoice.technician_name || booking?.technician_name || 'Certified Technician'}
            </p>
            <p className="text-slate-500 mt-0.5">
              Service: {booking?.service_name || 'Home Repair'}
            </p>
            <p className="text-slate-500">Verified ID #TECH-{booking?.technician_id || 'PRO'}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1">
              Invoice Dates:
            </h4>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Issued Date:</span>
                <span className="font-semibold text-slate-800">{formatDate(invoice.issued_at || invoice.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking ID:</span>
                <span className="font-mono text-slate-800">#{booking?.booking_number || invoice.booking_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">{booking?.payment_method || 'DIGITAL'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-medium">{item.description}</td>
                  <td className="py-3 text-right font-semibold">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 text-slate-600">
                <td className="pt-3 font-medium">Subtotal</td>
                <td className="pt-3 text-right font-semibold">{formatCurrency(subtotal)}</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-1.5 font-medium">CGST + SGST (18%)</td>
                <td className="py-1.5 text-right font-semibold">{formatCurrency(taxAmount)}</td>
              </tr>
              <tr className="border-t-2 border-slate-900 text-slate-900 font-extrabold text-base">
                <td className="pt-3">Grand Total</td>
                <td className="pt-3 text-right text-fixblue-900 text-lg">
                  {formatCurrency(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Warranty Certificate Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-fixteal-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-800 block">
              Official FixAround Service Warranty Attached
            </span>
            <p className="mt-0.5 leading-relaxed text-slate-500">
              This invoice serves as your valid warranty certificate. In case of any recurring defect within your service period, quote your Invoice #{invoice.invoice_number || invoice.id} for complimentary re-inspection and service.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <p>Thank you for choosing FixAround &bull; For support call 1800-FIX-AROUND or email support@fixaround.com</p>
        </div>
      </div>
    </div>
  );
}
