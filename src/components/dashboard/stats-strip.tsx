import React from 'react';

interface StatItemProps {
  label: string;
  value: string | number;
  trend: string;
  isPositive?: boolean;
}

function StatItem({ label, value, trend, isPositive }: StatItemProps) {
  return (
    <div className="bg-base-100 p-6 flex flex-col gap-1 h-full">
      <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight text-base-content">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className={`text-[12px] font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
          {trend}
        </span>
      </div>
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
    <div className="w-full bg-base-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] border-b border-base-300">
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
