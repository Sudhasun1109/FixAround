import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AvailabilityToggle({
  isOnline = false,
  isAvailable = false,
  onToggle,
  loading = false,
  disabled = false,
  className = '',
}) {
  return (
    <div
      className={`inline-flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs ${className}`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-800">
          {isOnline ? (isAvailable ? 'Ready for Jobs' : 'Online (Busy)') : 'Offline'}
        </span>
        <span className="text-[10px] text-slate-400">
          {isOnline ? 'Receiving emergency and direct requests' : 'Not receiving new bookings'}
        </span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isOnline}
        disabled={disabled || loading}
        onClick={() => onToggle && onToggle(!isOnline)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-fixteal-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOnline ? 'bg-fixteal-600' : 'bg-slate-300'}
        `}
      >
        <span className="sr-only">Toggle availability</span>
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center
            ${isOnline ? 'translate-x-5' : 'translate-x-0'}
          `}
        >
          {loading && (
            <Loader2 className="w-3 h-3 text-fixteal-600 animate-spin" />
          )}
        </span>
      </button>
    </div>
  );
}
