import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, mono = false, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 text-xs bg-white text-slate-900 border rounded-xl transition-all placeholder:text-gray-400 focus:outline-none focus:border-[#1c4e35] focus:ring-2 focus:ring-emerald-200/50 shadow-2xs disabled:opacity-50 disabled:bg-gray-50 ${
            mono ? 'font-mono text-xs' : 'font-sans'
          } ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
              : 'border-[#e2e7e2]'
          } ${className}`}
          {...props}
        />
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 leading-tight">{helperText}</p>
        )}
        {error && <p className="text-[11px] text-rose-600 leading-tight">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  mono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, mono = false, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2.5 text-xs bg-white text-slate-900 border rounded-lg transition-all placeholder:text-gray-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200/50 shadow-2xs disabled:opacity-50 disabled:bg-gray-50 ${
            mono ? 'font-mono text-xs' : 'font-sans'
          } ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
              : 'border-gray-200'
          } ${className}`}
          {...props}
        />
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 leading-tight">{helperText}</p>
        )}
        {error && <p className="text-[11px] text-rose-600 leading-tight">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, children, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-xs bg-white text-slate-900 border rounded-lg transition-all focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200/50 shadow-2xs disabled:opacity-50 disabled:bg-gray-50 cursor-pointer ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
              : 'border-gray-200'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {helperText && !error && (
          <p className="text-[11px] text-slate-500 leading-tight">{helperText}</p>
        )}
        {error && <p className="text-[11px] text-rose-600 leading-tight">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
