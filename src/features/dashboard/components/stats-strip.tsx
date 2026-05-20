import React from 'react';

interface StatItemProps {
  label: string;
  value: string | number;
  trend: string;
  isPositive?: boolean;
}

function StatItem({ label, value, trend, isPositive }: StatItemProps) {
  return (
    <div className="px-[22px] py-[18px] flex flex-col gap-1 h-full border-r border-base-content/5 last:border-r-0 sm:even:border-r-0 lg:even:border-r lg:last:border-r-0">
      <span className="text-[9px] font-bold text-base-content/40 uppercase tracking-[0.1em] font-mono">
        {label}
      </span>
      <span className="text-[26px] font-black tracking-tighter text-base-content font-mono">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span className={`text-[11px] font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
        {trend}
      </span>
    </div>
  );
}

interface StatsStripProps {
  stats: {
    connected: { value: number; trend: string; isPositive: boolean };
    messages: { value: number; trend: string; isPositive: boolean };
    conversations: { value: number; trend: string; isPositive: boolean };
    webhooks: { value: number; trend: string; isPositive: boolean };
  };
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="w-full bg-base-100/40 backdrop-blur-sm border-b border-base-content/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatItem 
        label="Connected Accounts" 
        value={stats.connected.value} 
        trend={stats.connected.trend} 
        isPositive={stats.connected.isPositive}
      />
      <StatItem 
        label="Total Messages" 
        value={stats.messages.value} 
        trend={stats.messages.trend} 
        isPositive={stats.messages.isPositive}
      />
      <StatItem 
        label="Conversations" 
        value={stats.conversations.value} 
        trend={stats.conversations.trend} 
        isPositive={stats.conversations.isPositive}
      />
      <StatItem 
        label="Webhook Events" 
        value={stats.webhooks.value} 
        trend={stats.webhooks.trend} 
        isPositive={stats.webhooks.isPositive}
      />
    </div>
  );
}
