import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'banner';
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  icon,
  action,
  onDismiss,
  children,
  className = '',
  ...props
}) => {
  const configs = {
    banner: {
      container: 'bg-[#f4f5f6] border-gray-200 text-slate-800',
      iconComponent: Info,
      iconColor: 'text-slate-700',
    },
    info: {
      container: 'bg-sky-50/70 border-sky-200 text-sky-900',
      iconComponent: Info,
      iconColor: 'text-sky-600',
    },
    success: {
      container: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      iconComponent: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      container: 'bg-amber-50/70 border-amber-200 text-amber-900',
      iconComponent: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    danger: {
      container: 'bg-red-50/70 border-red-200 text-red-900',
      iconComponent: AlertCircle,
      iconColor: 'text-red-600',
    },
  };

  const current = configs[variant] || configs.info;
  const IconComponent = current.iconComponent;

  return (
    <div
      role="alert"
      className={`p-3 sm:px-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${current.container} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`shrink-0 ${current.iconColor}`}>
          {icon || <IconComponent className="w-4 h-4" />}
        </div>
        <div className="text-xs leading-normal">
          {title && <span className="font-semibold mr-1.5">{title}</span>}
          <span className="text-slate-600">{children}</span>
        </div>
      </div>

      {(action || onDismiss) && (
        <div className="flex items-center gap-2 shrink-0">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
};
