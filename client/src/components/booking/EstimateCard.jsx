import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { CheckCircle2, XCircle, FileText, Wrench, Package, ShieldCheck } from 'lucide-react';

export default function EstimateCard({
  estimate,
  onApprove,
  onReject,
  isCustomer = true,
  loading = false,
}) {
  if (!estimate) return null;

  const isSubmitted = estimate.status === 'SUBMITTED';
  const isApproved = estimate.status === 'APPROVED';
  const isRejected = estimate.status === 'REJECTED';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-fixteal-600" />
          <h4 className="text-base font-bold text-fixblue-900">
            Work Estimate #{estimate.id}
          </h4>
          {estimate.revision_number > 1 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              Rev {estimate.revision_number}
            </span>
          )}
        </div>

        <div>
          {isApproved && (
            <Badge variant="success" dot>Approved</Badge>
          )}
          {isRejected && (
            <Badge variant="danger" dot>Rejected</Badge>
          )}
          {isSubmitted && (
            <Badge variant="warning" dot>Awaiting Your Approval</Badge>
          )}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Service Item</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-slate-400" />
                  <span>Labor Charges</span>
                </td>
                <td className="py-3 text-right font-semibold">
                  {formatCurrency(estimate.labor_charge || 0)}
                </td>
              </tr>

              <tr>
                <td className="py-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>Materials & Parts</span>
                </td>
                <td className="py-3 text-right font-semibold">
                  {formatCurrency(estimate.material_charge || 0)}
                </td>
              </tr>

              <tr>
                <td className="py-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Visiting & Inspection Fee</span>
                </td>
                <td className="py-3 text-right font-semibold">
                  {formatCurrency(estimate.inspection_charge || 0)}
                </td>
              </tr>

              {Number(estimate.additional_charge) > 0 && (
                <tr>
                  <td className="py-3 text-slate-600">Additional Charges / Taxes</td>
                  <td className="py-3 text-right font-semibold">
                    {formatCurrency(estimate.additional_charge)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 text-slate-900 font-extrabold text-base">
                <td className="pt-4 text-fixblue-900">Total Estimate</td>
                <td className="pt-4 text-right text-fixblue-900 text-lg">
                  {formatCurrency(estimate.total_estimate || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {estimate.breakdown_notes && (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <span className="font-bold block text-slate-700 mb-1">
              Technician's Notes:
            </span>
            <p className="leading-relaxed whitespace-pre-line">{estimate.breakdown_notes}</p>
          </div>
        )}

        {isRejected && estimate.rejection_reason && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <span className="font-bold block text-rose-800 mb-1">
              Rejection Reason:
            </span>
            <p className="leading-relaxed">{estimate.rejection_reason}</p>
          </div>
        )}

        {/* Customer Approval Actions */}
        {isCustomer && isSubmitted && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            {onReject && (
              <Button
                variant="outline"
                onClick={onReject}
                disabled={loading}
                icon={XCircle}
                className="w-full sm:w-auto text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Reject Estimate
              </Button>
            )}
            {onApprove && (
              <Button
                variant="secondary"
                onClick={onApprove}
                loading={loading}
                icon={CheckCircle2}
                className="w-full sm:w-auto"
              >
                Approve & Authorize Work
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
