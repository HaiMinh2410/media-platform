'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMetric(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + "K";
  return n.toLocaleString();
}

export const ContentBar = ({ label, pct, colorClass }: { label: string; pct: number; colorClass: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-12 text-base-content/70 text-sm shrink-0">{label}</div>
    <div className="flex-1 h-2.5 bg-base-300 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className={cn("h-full rounded-full bg-linear-to-r", colorClass)}
      />
    </div>
    <div className="w-11 text-base-content text-sm text-right font-mono font-semibold">{pct}%</div>
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-base-300/50 rounded-lg", className)} />
);

export function StatBlock({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="mb-6">
      <div className="text-4xl font-extrabold text-base-content tracking-tighter mb-1 font-mono">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">{label}</div>
    </div>
  );
}

