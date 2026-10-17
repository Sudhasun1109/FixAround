import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-fixblue-800 border-indigo-200',
    secondary: 'bg-teal-50 text-teal-800 border-teal-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    emergency: 'bg-red-100 text-red-900 border-red-300 font-bold',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    primary: 'bg-indigo-600',
    secondary: 'bg-teal-600',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    emergency: 'bg-red-600 animate-ping',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
