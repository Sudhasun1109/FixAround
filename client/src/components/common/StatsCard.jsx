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
      bg: 'bg-fixblue-50 text-fixblue-800',
      border: 'border-fixblue-100',
    },
    teal: {
      bg: 'bg-teal-50 text-teal-700',
      border: 'border-teal-100',
    },
    green: {
      bg: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-700',
      border: 'border-amber-100',
    },
    red: {
      bg: 'bg-rose-50 text-rose-700',
      border: 'border-rose-100',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-700',
      border: 'border-purple-100',
    },
  };

  const currentTheme = colorStyles[color] || colorStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs transition-all
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${currentTheme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
      </div>

      {(trend !== undefined || subtitle) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trendDirection === 'up'
                  ? 'text-emerald-600'
                  : trendDirection === 'down'
                  ? 'text-rose-600'
                  : 'text-slate-500'
              }`}
            >
              {trendDirection === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trendDirection === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend}
            </span>
          )}
          <span className="text-slate-400">
            {trendLabel || subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
