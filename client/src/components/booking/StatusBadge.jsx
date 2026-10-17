import React from 'react';
import { getStatusColor, getStatusLabel } from '../../utils/formatters';

export default function StatusBadge({ status, size = 'md', className = '' }) {
  if (!status) return null;

  const colorConfig = getStatusColor(status);
  const label = getStatusLabel(status);

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${colorConfig.badge} ${colorConfig.border || 'border-transparent'} ${sizes[size] || sizes.md} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colorConfig.dot || 'bg-slate-400'}`} />
      <span>{label}</span>
    </span>
  );
}
