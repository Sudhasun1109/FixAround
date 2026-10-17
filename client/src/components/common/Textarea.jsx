import React, { forwardRef, useState } from 'react';

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    maxLength,
    rows = 4,
    className = '',
    containerClassName = '',
    id,
    disabled = false,
    required = false,
    onChange,
    value,
    defaultValue,
    ...props
  },
  ref
) {
  const textareaId = id || props.name || Math.random().toString(36).substring(7);
  const [charCount, setCharCount] = useState(
    (value || defaultValue || '').toString().length
  );

  const handleChange = (e) => {
    setCharCount(e.target.value.length);
    if (onChange) onChange(e);
  };

  return (
    <div className={`w-full ${containerClassName}`}>
      <div className="flex justify-between items-center mb-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-[11px] text-slate-400">
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={`
          block w-full rounded-lg border text-sm p-3 transition-colors
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${
            error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 text-slate-900 focus:border-fixteal-500 focus:ring-fixteal-500 bg-white'
          }
          ${className}
        `}
        {...props}
      />

      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
