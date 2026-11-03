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
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
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
    <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Header: Icon + Verified Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-fixblue-50 text-fixblue-500 flex items-center justify-center group-hover:bg-fixblue-500 group-hover:text-white transition-all shadow-2xs">
            <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110" />
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-fixblue-600 border border-blue-100">
            <CheckCircle2 className="w-3 h-3 text-fixblue-500" />
            Verified
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-base sm:text-lg font-bold text-[#172033] group-hover:text-fixblue-600 transition-colors">
          {category.name}
        </h3>

        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
          {category.description ||
            'Certified specialists available for doorstep diagnostic inspection and fast repair.'}
        </p>
      </div>

      {/* Pricing & CTA */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Starting From
          </span>
          <span className="text-base sm:text-lg font-extrabold text-[#172033]">
            {formatCurrency(category.min_price || 299)}
          </span>
        </div>

        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(category)}
            className="w-10 h-10 rounded-full bg-[#F4F7FB] group-hover:bg-fixblue-500 text-slate-700 group-hover:text-white flex items-center justify-center shadow-2xs transition-all"
            title="Book Category"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <Link
            to={detailUrl}
            className="w-10 h-10 rounded-full bg-[#F4F7FB] group-hover:bg-fixblue-500 text-slate-700 group-hover:text-white flex items-center justify-center shadow-2xs transition-all"
            title="View Details"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
