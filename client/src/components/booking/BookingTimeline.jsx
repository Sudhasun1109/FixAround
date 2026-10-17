import React from 'react';
import { BOOKING_STATUSES, TIMELINE_STEPS } from '../../utils/constants';
import { formatDateTime, getStatusLabel } from '../../utils/formatters';
import { Check, Clock, AlertCircle, XCircle } from 'lucide-react';

export default function BookingTimeline({ currentStatus, history = [] }) {
  const isCancelled = currentStatus === BOOKING_STATUSES.CANCELLED;
  const isRejected = currentStatus === BOOKING_STATUSES.REJECTED;
  const isDisputed = currentStatus === BOOKING_STATUSES.DISPUTED;
  const isNoTech = currentStatus === BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE;

  const currentStepIndex = TIMELINE_STEPS.indexOf(currentStatus);

  // Map history events to timestamp lookup
  const timestampMap = {};
  if (Array.isArray(history)) {
    history.forEach((h) => {
      const statusKey = h.to_status || h.status;
      if (statusKey && !timestampMap[statusKey]) {
        timestampMap[statusKey] = h.created_at || h.timestamp;
      }
    });
  }

  return (
    <div className="py-4">
      {/* Abnormal termination banner if applicable */}
      {(isCancelled || isRejected || isDisputed || isNoTech) && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-rose-800">
              Booking is {getStatusLabel(currentStatus)}
            </h4>
            <p className="text-xs text-rose-600">
              This request was halted in state: {currentStatus}. Contact support if you need further help.
            </p>
          </div>
        </div>
      )}

      {/* Responsive timeline: vertical on mobile, horizontal on md+ */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Background connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

        {TIMELINE_STEPS.map((step, index) => {
          const isDone = currentStepIndex > index || currentStatus === BOOKING_STATUSES.COMPLETED;
          const isCurrent = currentStepIndex === index;
          const isPending = currentStepIndex < index && !isDone;
          const timestamp = timestampMap[step];

          return (
            <div
              key={step}
              className="flex flex-col items-center text-center relative z-10 max-w-[110px]"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-fixteal-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-fixblue-800 text-white ring-4 ring-fixblue-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>

              <span
                className={`mt-2 text-xs font-bold leading-tight ${
                  isCurrent
                    ? 'text-fixblue-900'
                    : isDone
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {getStatusLabel(step)}
              </span>

              {timestamp ? (
                <span className="mt-1 text-[10px] text-slate-400">
                  {formatDateTime(timestamp)}
                </span>
              ) : isCurrent ? (
                <span className="mt-1 text-[10px] font-semibold text-fixteal-600">
                  In progress
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Vertical timeline for mobile */}
      <div className="md:hidden space-y-6 relative pl-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {TIMELINE_STEPS.map((step, index) => {
          const isDone = currentStepIndex > index || currentStatus === BOOKING_STATUSES.COMPLETED;
          const isCurrent = currentStepIndex === index;
          const timestamp = timestampMap[step];

          return (
            <div key={step} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-fixteal-600 text-white'
                    : isCurrent
                    ? 'bg-fixblue-800 text-white ring-3 ring-fixblue-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="text-[10px] font-bold">{index + 1}</span>
                )}
              </div>

              <div>
                <h5
                  className={`text-xs font-bold ${
                    isCurrent
                      ? 'text-fixblue-900'
                      : isDone
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {getStatusLabel(step)}
                </h5>
                {timestamp && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDateTime(timestamp)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
