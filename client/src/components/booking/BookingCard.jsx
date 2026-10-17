import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Calendar, User, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function BookingCard({ booking, role = 'customer', onActionClick }) {
  if (!booking) return null;

  const detailPath =
    role === 'admin'
      ? `/admin/bookings/${booking.id}`
      : role === 'technician'
      ? `/technician/active-job/${booking.id}`
      : `/customer/bookings/${booking.id}`;

  const isEmergency = Boolean(booking.is_emergency || booking.urgency === 'emergency');
  const amountToDisplay = booking.final_total || booking.estimated_total;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
        isEmergency ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-fixblue-900 tracking-wider font-mono">
            #{booking.booking_number || `BK-${booking.id}`}
          </span>
          {isEmergency && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              EMERGENCY
            </span>
          )}
        </div>

        <StatusBadge status={booking.status} size="sm" />
      </div>

      <div className="py-3.5 space-y-2">
        <h4 className="text-base font-bold text-slate-800 line-clamp-1">
          {booking.service_name || booking.title || 'General Service Request'}
        </h4>

        {booking.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {booking.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {formatDateTime(booking.scheduled_at || booking.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {role === 'technician'
                ? booking.customer_name || 'Customer'
                : booking.technician_name || 'Technician assigning...'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            {booking.final_total ? 'Final Total' : 'Estimate'}
          </span>
          <span className="text-base font-extrabold text-fixblue-900">
            {amountToDisplay ? formatCurrency(amountToDisplay) : 'Quote pending'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onActionClick && (
            <button
              type="button"
              onClick={() => onActionClick(booking)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Action
            </button>
          )}

          <Link
            to={detailPath}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-fixteal-700 bg-fixteal-50 hover:bg-fixteal-100 rounded-lg transition-colors"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
