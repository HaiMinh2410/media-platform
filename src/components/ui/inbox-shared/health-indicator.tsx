import React from 'react';
import { cn } from '@/lib/utils';

type HealthStatus = 'good' | 'average' | 'poor' | 'critical';

type HealthIndicatorProps = {
  status: HealthStatus;
  label?: string;
  className?: string;
};

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({ status, label, className }) => {
  const statusConfig = {
    good: { color: 'bg-success', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
    average: { color: 'bg-warning', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]' },
    poor: { color: 'bg-error', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]' },
    critical: { color: 'bg-error animate-pulse', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.7)]' },
  };

  const { color, glow } = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", color, glow)} />
      {label && <span className="text-[10px] uppercase font-mono tracking-widest text-fg-tertiary">{label}</span>}
    </div>
  );
};
