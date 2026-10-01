import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'indigo' | 'cyan' | 'lime';
  size?: 'xs' | 'sm';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'xs',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    neutral: 'bg-gray-100 text-gray-700 border-gray-200/80',
    primary: 'bg-blue-50 text-blue-700 border-blue-200/70',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/70',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/70',
    info: 'bg-sky-50 text-sky-700 border-sky-200/70',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/70',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/70',
    lime: 'bg-lime-50 text-lime-700 border-lime-200/70',
  };

  const dotColors = {
    neutral: 'bg-gray-400',
    primary: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
    lime: 'bg-lime-500',
  };

  const sizeStyles = {
    xs: 'text-[11px] px-2.5 py-0.5 font-medium gap-1.5 rounded-full',
    sm: 'text-xs px-3 py-1 font-medium gap-1.5 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center border whitespace-nowrap select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
