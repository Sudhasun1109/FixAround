import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import {
  Zap,
  Droplets,
  Snowflake,
  Settings,
  Bike,
  Car,
  Hammer,
  SprayCan,
  Paintbrush,
  KeyRound,
  Monitor,
  Wrench,
  Shield,
  ArrowRight,
} from 'lucide-react';

const ICON_MAP = {
  Zap,
  Droplets,
  Snowflake,
  Settings,
  Bike,
  Car,
  Hammer,
  SprayCan,
  Paintbrush,
  KeyRound,
  Monitor,
  Wrench,
};

export default function ServiceCard({ category, onSelect }) {
  if (!category) return null;

  const IconComponent = ICON_MAP[category.icon] || Wrench;
  const detailUrl = `/services/${category.slug || category.id}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-fixteal-400 transition-all flex flex-col justify-between group">
      <div>
        {/* Header: Icon + Warranty Tag */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-fixblue-50 text-fixblue-800 flex items-center justify-center group-hover:bg-fixteal-50 group-hover:text-fixteal-700 transition-colors shadow-2xs">
            <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110" />
          </div>

          {category.warranty_period_days > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Shield className="w-3 h-3" />
              {category.warranty_period_days}d Warranty
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-fixblue-900 group-hover:text-fixteal-700 transition-colors">
          {category.name}
        </h3>

        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {category.description || 'Professional local repairs with verified certified experts.'}
        </p>

        {/* Price & Inspection Fee */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-400">Indicative Price:</span>
            <span className="font-extrabold text-fixblue-900">
              {formatCurrency(category.min_price)} - {formatCurrency(category.max_price)}
            </span>
          </div>

          {Number(category.inspection_charge) > 0 ? (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Visiting / Inspection:</span>
              <span className="font-medium text-slate-600">
                {formatCurrency(category.inspection_charge)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
              <span>Visiting charge:</span>
              <span>FREE</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={detailUrl}
          className="text-xs font-bold text-slate-600 hover:text-fixblue-900 transition-colors"
        >
          View Details
        </Link>

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(category)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-fixblue-800 text-white hover:bg-fixblue-900 transition-colors shadow-2xs"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            to={`/customer/book?categoryId=${category.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-fixblue-800 text-white hover:bg-fixblue-900 transition-colors shadow-2xs"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
