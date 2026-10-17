import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingsApi, estimatesApi } from '../../services/api';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import { ArrowLeft, FileText, Send, ShieldCheck, Calculator } from 'lucide-react';

export default function EstimateSubmission() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Line items
  const [laborCharge, setLaborCharge] = useState('350');
  const [materialCharge, setMaterialCharge] = useState('0');
  const [inspectionCharge, setInspectionCharge] = useState('99');
  const [additionalCharge, setAdditionalCharge] = useState('0');
  const [breakdownNotes, setBreakdownNotes] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await bookingsApi.getById(bookingId);
        const data = res?.data?.booking || res?.data || res;
        setBooking(data);
      } catch (err) {
        showToast.error(err.message || 'Booking not found');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Compute total
  const numLabor = parseFloat(laborCharge) || 0;
  const numMaterial = parseFloat(materialCharge) || 0;
  const numInspection = parseFloat(inspectionCharge) || 0;
  const numAdditional = parseFloat(additionalCharge) || 0;
  const totalEstimate = numLabor + numMaterial + numInspection + numAdditional;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalEstimate <= 0) {
      showToast.error('Total estimate must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      await estimatesApi.create({
        booking_id: parseInt(bookingId, 10),
        technician_id: booking?.technician_id,
        labor_charge: numLabor,
        material_charge: numMaterial,
        inspection_charge: numInspection,
        additional_charge: numAdditional,
        total_estimate: totalEstimate,
        breakdown_notes: breakdownNotes.trim(),
      });

      showToast.success('Estimate submitted! Awaiting customer approval.');
      navigate(`/technician/active-job/${bookingId}`);
    } catch (err) {
      showToast.error(err.message || 'Failed to submit estimate');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading job details..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      <Link
        to={`/technician/active-job/${bookingId}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Active Job</span>
      </Link>

      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Pricing Quote
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Submit Work Estimate #{booking?.booking_number || bookingId}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Itemize charges accurately for client authorization before commencing repairs.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Labor Charges (₹)"
              type="number"
              min="0"
              step="10"
              required
              value={laborCharge}
              onChange={(e) => setLaborCharge(e.target.value)}
              helperText="Estimated cost of physical repair labor."
            />

            <Input
              label="Materials & Spare Parts (₹)"
              type="number"
              min="0"
              step="10"
              value={materialCharge}
              onChange={(e) => setMaterialCharge(e.target.value)}
              helperText="Cost of genuine spare parts required."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Visiting / Inspection Fee (₹)"
              type="number"
              min="0"
              step="10"
              value={inspectionCharge}
              onChange={(e) => setInspectionCharge(e.target.value)}
              helperText="Standard inspection and transit fee."
            />

            <Input
              label="Additional Charges / Consumables (₹)"
              type="number"
              min="0"
              step="10"
              value={additionalCharge}
              onChange={(e) => setAdditionalCharge(e.target.value)}
              helperText="Tapes, adhesives, or specialized tool usage."
            />
          </div>

          <Textarea
            label="Itemized Breakdown & Technician Notes"
            rows={3}
            placeholder="Explain specifically what parts need replacement, model numbers, and warranties provided on parts..."
            value={breakdownNotes}
            onChange={(e) => setBreakdownNotes(e.target.value)}
          />

          {/* Auto-calculated Total Highlight Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-fixteal-50 text-fixteal-600">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Total Customer Estimate
                </span>
                <span className="text-2xl font-extrabold text-fixblue-900">
                  {formatCurrency(totalEstimate)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              loading={submitting}
              icon={Send}
            >
              Send Quote to Customer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
