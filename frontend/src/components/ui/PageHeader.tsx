import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
  className = '',
  icon,
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200/80 mb-6 ${className}`}>
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-slate-900 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-600 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          {icon && <div className="text-slate-700">{icon}</div>}
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge && <div className="mt-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-xs text-slate-500 max-w-3xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
