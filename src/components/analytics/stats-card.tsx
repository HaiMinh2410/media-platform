'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { Icon } from '@/components/ui/icon';

interface StatsCardProps { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  trend: string;
  isPositive?: boolean;
  delta?: number;
  isActive?: boolean;
  onClick?: () => void;
  activeColor?: string;
  sparklineData?: number[];
}

export function SkeletonStatsCard() {
  return (
    <div className="stats-card animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent shimmer" />
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-white/5 rounded-lg"></div>
        <div className="w-12 h-6 bg-white/5 rounded-full"></div>
      </div>
      <div className="w-24 h-4 bg-white/5 rounded mt-2 mb-3"></div>
      <div className="w-32 h-8 bg-white/5 rounded"></div>
    </div>
  );
}

export function StatsCard({ 
  label, 
  value, 
  icon, 
  trend, 
  isPositive, 
  delta,
  isActive,
  onClick,
  activeColor = '#3b82f6',
  sparklineData = []
}: StatsCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`stats-card cursor-pointer transition-all duration-300 select-none group ${
        isActive 
          ? 'stats-card-active border-opacity-50 ring-1 ring-opacity-20 shadow-lg scale-[1.02]' 
          : 'hover:bg-white/[0.04] active:scale-95'
      }`}
      style={isActive ? { 
        borderColor: `${activeColor}40`, 
        boxShadow: `0 0 20px ${activeColor}10`,
        '--active-glow': `${activeColor}20` 
      } as React.CSSProperties : {}}
    >
      {isActive && (
        <div 
          className="absolute inset-0 bg-gradient-to-br opacity-[0.03] pointer-events-none" 
          style={{ background: `linear-gradient(135deg, ${activeColor}, transparent)` }}
        />
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner group-hover:border-white/20 transition-colors">
          {icon}
        </div>
        <div className="w-16 h-8 opacity-20 group-hover:opacity-60 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData.map((v, i) => ({ v, i }))}>
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Area 
                type="monotone" 
                dataKey="v" 
                stroke={activeColor} 
                strokeWidth={1.5} 
                fill={activeColor}
                fillOpacity={0.1}
                dot={false} 
                isAnimationActive={false} 
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="stats-label">{label}</div>
      <div className="flex items-end justify-between gap-2 mt-1">
        <div className="flex flex-col">
          <div className="stats-value">
            {value}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
              isPositive ? 'text-emerald-400 bg-emerald-400/10' : 
              trend === '—' ? 'text-white/40 bg-white/5' : 'text-red-400 bg-red-400/10'
            }`}>
              {trend !== '—' && (isPositive ? '▲' : '▼')} {trend.replace('+', '').replace('-', '')}
            </span>
            {delta !== undefined && delta !== 0 && (
              <span className={`text-[10px] font-bold opacity-40`}>
                {delta > 0 ? '+' : ''}{delta.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
