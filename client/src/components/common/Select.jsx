import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    helperText,
    placeholder = 'Select an option',
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    required = false,
    children,
    ...props
  },
  ref
) {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-2xs">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            block w-full rounded-lg border text-sm appearance-none
            py-2.5 pl-3.5 pr-10 transition-colors
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                : 'border-slate-300 text-slate-900 focus:border-fixteal-500 focus:ring-fixteal-500 bg-white'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => {
                if (typeof opt === 'object' && opt !== null) {
                  return (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label || opt.value}
                    </option>
                  );
                }
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              })
            : children}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
