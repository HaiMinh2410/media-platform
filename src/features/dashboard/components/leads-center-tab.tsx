'use client';

import React, { useState } from 'react';
import { Users, Plus, RefreshCw, ChevronDown } from 'lucide-react';
import { LeadsStats } from './leads/leads-stats';
import { LeadsFilters } from './leads/leads-filters';
import { KanbanColumn } from './leads/kanban-column';
import { LeadsTable } from './leads/leads-table';
import { LEAD_STAGES, MOCK_LEADS } from './leads/constants';

export function LeadsCenterTab() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  return (
    <div className="flex flex-col gap-6 h-full text-base-content w-full animate-fade-in relative">
      {/* Aurora glow effect */}
      <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      {/* Header của Leads */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-base-content font-brand">
            Quản lý phễu khách hàng
          </h2>
          <p className="text-xs text-base-content/60 font-semibold mt-1">
            Quản lý, phân loại và theo dõi tiến trình chuyển đổi khách hàng tiềm năng của bạn
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap shrink-0">
          <button className="btn btn-sm btn-soft border border-base-content/5 font-bold text-base-content/80 rounded-lg hover:bg-base-200 transition-all">
            <Users size={14} />
            Đối tượng
            <ChevronDown size={12} className="opacity-60" />
          </button>
          <button className="btn btn-sm btn-square btn-soft border border-base-content/5 text-base-content/80 rounded-lg hover:bg-base-200 transition-all active:scale-95">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-sm btn-primary font-bold shadow-xs rounded-lg flex items-center gap-1.5 active:scale-95 transition-all">
            <Plus size={14} />
            Thêm khách hàng tiềm năng
          </button>
        </div>
      </div>

      {/* Stats Bar (Bento Cards) */}
      <LeadsStats />

      {/* Switcher & Filters */}
      <LeadsFilters viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-5 overflow-x-auto pb-5 flex-1 hide-scrollbar w-full items-stretch">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = MOCK_LEADS.filter(l => l.stage === stage.id);
            return (
              <KanbanColumn key={stage.id} stage={stage} leads={stageLeads} />
            );
          })}
          
          {/* Add Stage Bento Card */}
          <div className="min-w-[325px] max-w-[325px] h-[350px] shrink-0">
            <div className="h-full flex flex-col items-center justify-center p-6 text-center border border-dashed border-base-content/10 rounded-2xl text-base-content/40 gap-3 bg-base-100/20 hover:bg-base-100/40 hover:border-primary/20 hover:-translate-y-1 hover:shadow-xs active:scale-98 transition-all duration-300 cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-base-200/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-base-content/5">
                <Plus size={20} className="opacity-40 group-hover:text-primary group-hover:opacity-100 transition-all" />
              </div>
              <div className="text-sm font-extrabold text-base-content/70 group-hover:text-primary transition-colors font-brand">Thêm giai đoạn mới</div>
              <p className="text-xs leading-relaxed max-w-[200px] text-base-content/40 font-medium">
                Tạo các bước tùy chỉnh để theo dõi hành trình chuyển đổi khách hàng tiềm năng.
              </p>
              <button className="btn btn-sm btn-primary mt-2 font-bold rounded-lg shadow-xs active:scale-95 transition-all">
                Khởi tạo ngay
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Table View */
        <LeadsTable leads={MOCK_LEADS} stages={LEAD_STAGES} />
      )}
    </div>
  );
}
