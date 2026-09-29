import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'cream' | 'accent' | 'filter';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-1 disabled:opacity-45 disabled:pointer-events-none rounded-full select-none cursor-pointer active:scale-[0.98]';

    const variantStyles = {
      primary:
        'bg-[#1c4e35] hover:bg-[#143d2a] text-white font-medium shadow-xs border border-[#1c4e35]',
      accent:
        'bg-[#10b981] hover:bg-[#059669] text-white font-medium shadow-xs border border-[#10b981]',
      cream:
        'bg-[#fcb034] hover:bg-[#f39c12] text-slate-900 font-semibold shadow-xs border border-[#fcb034]',
      secondary:
        'bg-white hover:bg-[#f4f7f4] text-[#122119] border border-[#e2e7e2] shadow-xs',
      outline:
        'bg-transparent text-[#1c4e35] hover:bg-[#e8ede8] border border-[#1c4e35]',
      ghost:
        'bg-transparent text-[#3d5045] hover:text-[#122119] hover:bg-[#e8ede8] border border-transparent',
      danger:
        'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs',
      filter:
        'bg-white hover:bg-[#f4f7f4] text-[#122119] border border-[#e2e7e2] shadow-xs font-normal',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-xs px-3.5 py-2 gap-2 h-9',
      lg: 'text-sm px-4.5 py-2.5 gap-2.5 h-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

