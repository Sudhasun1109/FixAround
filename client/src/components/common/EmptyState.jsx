import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = "There are no records to display right now.",
  actionLabel,
  onAction,
  actionIcon,
  actionVariant = 'secondary',
  className = '',
  children,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-2xl border border-dashed border-slate-200 ${className}`}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100 shadow-inner">
        <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          size="md"
          icon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
