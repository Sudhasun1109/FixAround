import React from 'react';

export default function Skeleton({
  variant = 'block',
  lines = 3,
  cols = 4,
  rows = 3,
  className = '',
}) {
  const base = 'skeleton-shimmer rounded-md';

  if (variant === 'text') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${base} h-3.5 ${
              i === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`${base} rounded-full w-12 h-12 shrink-0 ${className}`} />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`${base} w-10 h-10 rounded-full shrink-0`} />
          <div className="space-y-2 flex-1">
            <div className={`${base} h-4 w-3/4`} />
            <div className={`${base} h-3 w-1/2`} />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <div className={`${base} h-3.5 w-full`} />
          <div className={`${base} h-3.5 w-5/6`} />
        </div>
        <div className="pt-2 flex justify-between items-center border-t border-slate-100">
          <div className={`${base} h-5 w-20`} />
          <div className={`${base} h-8 w-24 rounded-lg`} />
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`divide-y divide-slate-100 ${className}`}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 py-3.5 px-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className={`${base} h-4 flex-1 ${
                  cIdx === 0 ? 'w-1/3' : 'w-full'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return <div className={`${base} ${className}`} />;
}
