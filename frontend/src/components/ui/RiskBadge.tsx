import React from 'react';
import { ShieldAlert, Shield, ShieldCheck } from 'lucide-react';

export interface RiskBadgeProps {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'Critical' | 'High' | 'Medium' | 'Low';
  score?: number;
  showScore?: boolean;
  className?: string;
  size?: 'xs' | 'sm';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showScore = false,
  className = '',
  size = 'xs',
}) => {
  const normalized = level.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  const configs = {
    CRITICAL: {
      bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      dot: 'bg-rose-600',
      icon: ShieldAlert,
      label: 'Critical Risk',
    },
    HIGH: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/90',
      dot: 'bg-rose-500',
      icon: ShieldAlert,
      label: 'High Risk',
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200/90',
      dot: 'bg-amber-500',
      icon: Shield,
      label: 'Medium Risk',
    },
    LOW: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
      dot: 'bg-emerald-500',
      icon: ShieldCheck,
      label: 'Low Risk',
    },
  };

  const config = configs[normalized] || configs.MEDIUM;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-0.5 gap-1.5' : 'text-[11px] px-2 py-0.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tracking-normal select-none ${config.bg} ${sizeClasses} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono font-semibold ml-0.5 px-1 py-0.2 rounded bg-white/80 border border-current/20 text-[10px]">
          {score > 10 ? (score / 10).toFixed(1) : score.toFixed(1)}/10
        </span>
      )}
    </span>
  );
};
