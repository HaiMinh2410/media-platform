import React from 'react';
import { MoreHorizontal, Users } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Lead, LeadStage } from './types';
import { LeadCard } from './lead-card';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
}

export function KanbanColumn({ stage, leads }: KanbanColumnProps) {
  const badgeColorMap = {
    info: 'badge-info bg-info/10 text-info',
    success: 'badge-success bg-success/10 text-success',
    primary: 'badge-primary bg-primary/10 text-primary'
  } as const;

  return (
    <div 
      className="min-w-[325px] max-w-[325px] bg-base-100/40 backdrop-blur-xs border border-base-content/5 rounded-2xl p-4 flex flex-col gap-4 h-full max-h-[calc(100vh-320px)] overflow-y-auto hide-scrollbar shadow-xs shrink-0"
    >
      {/* Column Header */}
      <div className="flex justify-between items-center py-1 px-0.5 sticky top-0 bg-base-100/0 backdrop-blur-md z-10 border-b border-base-content/5 pb-2.5">
        <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-base-content font-brand">
          <span className="text-xs">{stage.icon}</span>
          <span>{stage.label}</span>
          <span className={cn("badge badge-sm font-mono font-black border-0 rounded-md", badgeColorMap[stage.color as 'info' | 'success' | 'primary'])}>
            {leads.length}
          </span>
        </div>
        <button className="btn btn-xs btn-ghost btn-square rounded-lg hover:bg-base-200">
          <MoreHorizontal size={14} className="opacity-60" />
        </button>
      </div>

      {/* Lead Cards List */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar pr-0.5">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-base-content/10 rounded-xl text-base-content/40 gap-3 bg-base-100/5 min-h-[220px]">
            <div className="w-12 h-12 rounded-full bg-base-200/50 flex items-center justify-center border border-base-content/5">
              <Users size={18} className="opacity-40" />
            </div>
            <div className="text-xs font-extrabold text-base-content/60 font-brand">Giai đoạn này trống</div>
            <p className="text-[11px] leading-relaxed max-w-[190px] text-base-content/45 font-medium">
              Kéo thả hoặc thêm khách hàng mới để theo dõi tiến trình.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
