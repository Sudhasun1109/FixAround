import React from 'react';

export default function Card({
  title,
  subtitle,
  headerAction,
  footer,
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  onClick,
}) {
  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all
        ${hoverable || isClickable ? 'hover:shadow-md hover:border-slate-300' : ''}
        ${isClickable ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            {title && (
              <h3 className="text-base font-bold text-fixblue-900 leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0 ml-4">{headerAction}</div>}
        </div>
      )}

      <div className={paddings[padding] || paddings.md}>{children}</div>

      {footer && (
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
}
