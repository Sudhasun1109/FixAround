import React from 'react';

export default function Spinner({
  size = 'md',
  color = 'teal',
  fullScreen = false,
  label = 'Loading...',
  className = '',
}) {
  const sizes = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colors = {
    teal: 'border-fixteal-500 border-t-transparent',
    blue: 'border-fixblue-800 border-t-transparent',
    white: 'border-white border-t-transparent',
    slate: 'border-slate-400 border-t-transparent',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`rounded-full animate-spin ${sizes[size] || sizes.md} ${colors[color] || colors.teal}`}
        role="status"
        aria-label={label}
      />
      {label && size !== 'xs' && size !== 'sm' && (
        <p className="text-xs font-medium text-slate-500 animate-pulse">{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}
