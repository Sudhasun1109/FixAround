import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon = null,
    iconPosition = 'left',
    type = 'text',
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={`
            block w-full rounded-lg border text-sm transition-colors
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${Icon && iconPosition === 'left' ? 'pl-10' : 'pl-3.5'}
            ${Icon && iconPosition === 'right' ? 'pr-10' : 'pr-3.5'}
            py-2.5
            ${
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                : 'border-slate-300 text-slate-900 focus:border-fixteal-500 focus:ring-fixteal-500 bg-white'
            }
            ${className}
          `}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
