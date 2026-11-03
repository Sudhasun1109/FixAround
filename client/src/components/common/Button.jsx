import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  rounded = 'full', // 'full' | '2xl' | 'xl' | 'lg' | 'default'
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) {
  const roundedClass = {
    full: 'rounded-full',
    '3xl': 'rounded-3xl',
    '2xl': 'rounded-2xl',
    xl: 'rounded-xl',
    lg: 'rounded-lg',
    default: 'rounded-xl',
  }[rounded] || 'rounded-full';

  const baseStyles = `inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] ${roundedClass}`;

  const variants = {
    primary:
      'bg-fixblue-500 text-white hover:bg-fixblue-600 focus:ring-fixblue-400 shadow-sm shadow-blue-500/20 active:bg-fixblue-700',
    dark:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm',
    secondary:
      'bg-fixteal-600 text-white hover:bg-fixteal-700 focus:ring-fixteal-500 shadow-sm active:bg-fixteal-800',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm active:bg-rose-800',
    outline:
      'border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-fixblue-400 shadow-2xs',
    ghost:
      'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-300',
    emergency:
      'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 focus:ring-red-500 shadow-md shadow-rose-500/25',
    pill:
      'bg-fixblue-500 text-white hover:bg-fixblue-600 shadow-sm shadow-blue-500/25',
  };

  const sizes = {
    xs: 'text-[11px] px-3 py-1 gap-1',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
