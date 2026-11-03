import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({
  icon: Icon,
  value,
  label,
  trend,
  trendDirection = 'up',
  trendLabel = 'vs last month',
  color = 'blue',
  subtitle,
  onClick,
  className = '',
}) {
  const colorStyles = {
    blue: {
      bg: 'bg-fixblue-50 text-fixblue-500',
      border: 'border-blue-100',
    },
    teal: {
      bg: 'bg-teal-50 text-teal-600',
      border: 'border-teal-100',
    },
    green: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    red: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
  };

  const currentTheme = colorStyles[color] || colorStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-3xl p-5 border border-slate-100 shadow-soft transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-2xl ${currentTheme.bg}`}>
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
          {value}
        </span>
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center font-bold ${
              trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trendDirection === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend}
          </span>
          <span className="text-slate-400 font-medium">{trendLabel}</span>
        </div>
      )}

      {subtitle && (
        <p className="mt-2 text-xs font-medium text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}
