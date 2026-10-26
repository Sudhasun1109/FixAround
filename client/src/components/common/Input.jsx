import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
    showPasswordToggle = true,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  const isPasswordField = type === 'password';
  const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

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

      <div className="relative rounded-xl shadow-xs">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          className={`
            block w-full rounded-xl border text-sm transition-all duration-150
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${Icon && iconPosition === 'left' ? 'pl-10' : 'pl-3.5'}
            ${isPasswordField && showPasswordToggle ? 'pr-11' : (Icon && iconPosition === 'right' ? 'pr-10' : 'pr-3.5')}
            py-2.5
            ${
              error
                ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                : 'border-slate-200 text-slate-900 hover:border-slate-300 focus:border-fixteal-500 focus:ring-fixteal-500/20 bg-white'
            }
            ${className}
          `}
          {...props}
        />

        {isPasswordField && showPasswordToggle ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-fixteal-500 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-fixteal-600" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        ) : (
          Icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )
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
