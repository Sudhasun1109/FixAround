import React from 'react';
import { BOOKING_STATUSES } from '../../utils/constants';
import { getStatusLabel } from '../../utils/formatters';
import { Check, Clock, XCircle, Navigation, Wrench, CheckCircle2, FileText } from 'lucide-react';

export default function BookingTimeline({ currentStatus, history = [] }) {
  const isCancelled = currentStatus === BOOKING_STATUSES.CANCELLED;
  const isRejected = currentStatus === BOOKING_STATUSES.REJECTED;
  const isDisputed = currentStatus === BOOKING_STATUSES.DISPUTED;
  const isNoTech = currentStatus === BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE;

  // The 4 main customer-facing milestone steps (Screen 3 Inspiration)
  const steps = [
    {
      id: 'REQUESTED',
      label: 'Booking',
      sublabel: 'Requested',
      icon: Check,
      matchingStatuses: ['REQUESTED', 'ASSIGNED', 'ACCEPTED'],
    },
    {
      id: 'ON_THE_WAY',
      label: 'One the way',
      sublabel: 'En Route',
      icon: Navigation,
      matchingStatuses: ['ON_THE_WAY', 'ARRIVED'],
    },
    {
      id: 'IN_PROGRESS',
      label: 'Working',
      sublabel: 'In Progress',
      icon: Wrench,
      matchingStatuses: ['IN_PROGRESS'],
    },
    {
      id: 'COMPLETED',
      label: 'Completed',
      sublabel: 'Finished',
      icon: CheckCircle2,
      matchingStatuses: ['COMPLETED'],
    },
  ];

  // Determine which milestone step is active
  const getStepStatus = (index) => {
    if (currentStatus === 'COMPLETED') return 'completed';

    if (['AWAITING_CUSTOMER_VERIFICATION', 'VERIFIED', 'PAYMENT_PENDING'].includes(currentStatus)) {
      if (index <= 2) return 'completed';
      if (index === 3) return 'active';
      return 'pending';
    }

    if (currentStatus === 'IN_PROGRESS' || currentStatus === 'AWAITING_APPROVAL') {
      if (index <= 1) return 'completed';
      if (index === 2) return 'active';
      return 'pending';
    }

    if (currentStatus === 'ON_THE_WAY' || currentStatus === 'ARRIVED') {
      if (index === 0) return 'completed';
      if (index === 1) return 'active';
      return 'pending';
    }

    if (['REQUESTED', 'ASSIGNED', 'ACCEPTED'].includes(currentStatus)) {
      if (index === 0) return 'active';
      return 'pending';
    }

    return 'pending';
  };

  return (
    <div className="py-2">
      {/* Abnormal termination banner if applicable */}
      {(isCancelled || isRejected || isDisputed || isNoTech) && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-rose-800">
              Booking is {getStatusLabel(currentStatus)}
            </h4>
            <p className="text-[11px] text-rose-600">
              This request was halted in state: {currentStatus}.
            </p>
          </div>
        </div>
      )}

      {/* Modern Horizontal Stepper (Screen 3 Inspiration) */}
      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Background Connecting Line */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 rounded-full z-0" />

        {/* Active Colored Progress Line */}
        <div
          className="absolute top-5 left-8 h-1 bg-fixblue-500 rounded-full z-0 transition-all duration-500"
          style={{
            width:
              currentStatus === 'COMPLETED'
                ? 'calc(100% - 4rem)'
                : ['AWAITING_CUSTOMER_VERIFICATION', 'VERIFIED', 'PAYMENT_PENDING'].includes(currentStatus)
                ? '85%'
                : currentStatus === 'IN_PROGRESS' || currentStatus === 'AWAITING_APPROVAL'
                ? '66%'
                : currentStatus === 'ON_THE_WAY' || currentStatus === 'ARRIVED'
                ? '33%'
                : '10%',
          }}
        />

        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Stepper Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status === 'completed'
                    ? 'bg-fixblue-500 text-white shadow-md shadow-blue-500/25'
                    : status === 'active'
                    ? 'bg-fixblue-500 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/35 scale-105'
                    : 'bg-white border-2 border-slate-200 text-slate-300'
                }`}
              >
                {status === 'completed' ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-2 text-[11px] sm:text-xs font-bold tracking-tight text-center ${
                  status === 'active'
                    ? 'text-fixblue-600 font-extrabold'
                    : status === 'completed'
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
