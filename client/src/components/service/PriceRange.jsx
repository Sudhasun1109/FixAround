import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Info, ShieldCheck } from 'lucide-react';

export default function PriceRange({
  minPrice = 0,
  maxPrice = 0,
  inspectionCharge = 0,
  showInspection = true,
  className = '',
}) {
  return (
    <div
      className={`p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Standard Price Range
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-fixteal-700 bg-fixteal-50 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          Transparent Pricing
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-fixblue-900">
          {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
        </span>
      </div>

      {showInspection && (
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
          <span>Inspection & Visiting Charge:</span>
          <span className="font-bold text-slate-800">
            {Number(inspectionCharge) > 0
              ? formatCurrency(inspectionCharge)
              : 'FREE'}
          </span>
        </div>
      )}

      <p className="text-[11px] text-slate-400 flex items-start gap-1 leading-normal">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
        <span>
          Final cost depends on actual inspection, required parts, and labor scope. The technician submits a detailed estimate before beginning work.
        </span>
      </p>
    </div>
  );
}
