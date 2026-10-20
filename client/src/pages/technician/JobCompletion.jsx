import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsApi, estimatesApi } from '../../services/api';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import { CheckCircle2, ArrowLeft, ShieldCheck, DollarSign } from 'lucide-react';

export default function JobCompletion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [finalAmount, setFinalAmount] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    const fetchBookingAndEstimate = async () => {
      try {
        setLoading(true);
        const res = await bookingsApi.getById(id);
        const data = res?.data?.booking || res?.data || res;
        setBooking(data);

        // Pre-fill amount from estimate or booking total
        const defaultTotal = data.final_total || data.estimated_total || 500;
        setFinalAmount(String(defaultTotal));
      } catch (err) {
        showToast.error(err.message || 'Job not found');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndEstimate();
  }, [id]);

  const handleCompleteJob = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(finalAmount);
    if (!numAmount || numAmount <= 0) {
      showToast.error('Please specify a valid final billing amount');
      return;
    }

    try {
      setSubmitting(true);
      await bookingsApi.updateStatus(id, 'COMPLETED', completionNotes, { final_total: numAmount });
      showToast.success('Job marked as COMPLETED! Invoice generated for customer.');
      navigate(`/technician/earnings`);
    } catch (err) {
      showToast.error(err.message || 'Failed to complete job');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading completion details..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <Link
        to={`/technician/active-job/${id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Active Job</span>
      </Link>

      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-fixblue-900">
          Finalize & Complete Job #{booking?.booking_number || id}
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Confirm the final service fee and record repair summary for customer warranty records.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
        <form onSubmit={handleCompleteJob} className="space-y-6">
          <Input
            label="Final Total Billed to Customer (₹)"
            type="number"
            min="0"
            step="10"
            required
            value={finalAmount}
            onChange={(e) => setFinalAmount(e.target.value)}
            helperText="Matches approved estimate unless customer requested additional parts."
          />

          <Textarea
            label="Service Completion Notes & Work Summary"
            required
            rows={4}
            placeholder="Describe repairs finished, tests performed (e.g. pressure check, voltage test), and tips for the customer..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
          />

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
            <span className="font-bold block">Earnings Settlement</span>
            <p className="text-teal-700 leading-relaxed text-[11px]">
              Platform commission (15%) is auto-deducted and the remaining 85% net payout is queued in your earnings ledger for weekly settlement.
            </p>
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="lg"
            fullWidth
            loading={submitting}
            icon={CheckCircle2}
            className="py-3.5 text-base"
          >
            Mark Job Officially Completed
          </Button>
        </form>
      </div>
    </div>
  );
}
