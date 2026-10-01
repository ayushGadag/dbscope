import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'outline' | 'flat' | 'glass';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-[#e2e7e2] rounded-2xl shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)]',
    subtle: 'bg-white border border-[#e2e7e2]/80 rounded-2xl shadow-2xs',
    outline: 'bg-transparent border border-[#e2e7e2] rounded-2xl',
    flat: 'bg-transparent border-none',
    glass: 'bg-white/85 backdrop-blur-md border border-white/40 rounded-2xl shadow-md',
  };

  const hoverStyles = hoverEffect 
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-4px_rgba(18,33,25,0.08)]' 
    : '';

  return (
    <div
      className={`overflow-hidden ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-sm font-semibold text-slate-900 flex items-center gap-2 tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-500 mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`px-5 py-3 bg-gray-50/60 border-t border-gray-100 text-xs text-slate-500 ${className}`} {...props}>
    {children}
  </div>
);

