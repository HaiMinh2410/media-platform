'use client';

import React, { useState } from 'react';
import { Users, Plus, ChevronDown, Download, Bell, Settings, CheckCircle2 } from 'lucide-react';
import { LeadsStats } from './leads/leads-stats';
import { LeadsFilters } from './leads/leads-filters';
import { KanbanColumn } from './leads/kanban-column';
import { LeadsTable } from './leads/leads-table';
import { LEAD_STAGES, MOCK_LEADS } from './leads/constants';

export function LeadsCenterTab() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  return (
    <div className="flex flex-col gap-5 h-full text-base-content w-full animate-fade-in relative">
      {/* Aurora glow effect */}
      <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

      {/* Header của Leads */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-base-content font-brand">
            Trung tâm khách hàng tiềm năng
          </h2>
        </div>
        <div className="flex gap-2 items-center flex-wrap shrink-0">
          {/* Nút Đối tượng */}
          <button className="btn btn-sm bg-base-100 hover:bg-base-200 border border-base-300 font-semibold text-base-content/80 rounded-lg transition-all flex items-center gap-1.5 px-3 h-8 shadow-2xs">
            <Users size={14} className="opacity-70" />
            Đối tượng
            <ChevronDown size={12} className="opacity-60" />
          </button>
          
          {/* Nút Tải xuống (Xuất file) */}
          <button className="btn btn-sm btn-square bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/80 rounded-lg transition-all h-8 w-8 shadow-2xs">
            <Download size={14} />
          </button>

          {/* Nút Thông báo */}
          <button className="btn btn-sm btn-square bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/80 rounded-lg transition-all h-8 w-8 shadow-2xs">
            <Bell size={14} />
          </button>

          {/* Nút Cài đặt */}
          <button className="btn btn-sm btn-square bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/80 rounded-lg transition-all h-8 w-8 shadow-2xs">
            <Settings size={14} />
          </button>

          {/* Nút Thêm khách hàng tiềm năng */}
          <div className="join shadow-2xs">
            <button className="btn btn-sm bg-[#0064d2] hover:bg-[#0052ad] text-white font-semibold rounded-l-lg border-0 h-8 flex items-center gap-1 px-3">
              <Plus size={14} />
              Thêm khách hàng tiềm năng
            </button>
            <button className="btn btn-sm bg-[#0064d2] hover:bg-[#0052ad] text-white rounded-r-lg border-0 border-l border-white/10 h-8 w-6 px-0 flex items-center justify-center">
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Avatar cá nhân với logo Facebook ở góc dưới */}
          <div className="relative shrink-0 ml-1">
            <img 
              src="https://i.pravatar.cc/150?u=myavatar" 
              alt="My Avatar" 
              className="w-8 h-8 rounded-full object-cover border border-base-300"
            />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-base-100 rounded-full p-0.5 shadow-2xs flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="text-[#1877F2]">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar (Bento Cards) */}
      <LeadsStats />

      {/* Alert/Notification Bar ở chế độ xem bảng */}
      {viewMode === 'table' && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-3xs animate-slide-in">
          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>3 khách hàng tiềm năng mới</span>
        </div>
      )}

      {/* Switcher & Filters */}
      <LeadsFilters viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 hide-scrollbar w-full items-stretch min-h-[500px]">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = MOCK_LEADS.filter(l => l.stage === stage.id);
            return (
              <KanbanColumn key={stage.id} stage={stage} leads={stageLeads} />
            );
          })}
          
          {/* Cột 4: Thêm giai đoạn tùy chỉnh */}
          <div className="min-w-[300px] max-w-[300px] bg-base-100/40 backdrop-blur-xs border border-base-content/5 rounded-2xl p-4 flex flex-col justify-center items-center h-full min-h-[480px] shadow-xs shrink-0 text-center">
            {/* Hình minh họa các block */}
            <div className="relative w-28 h-28 mb-4 flex items-center justify-center bg-sky-50 dark:bg-sky-950/10 rounded-2xl border border-sky-100 dark:border-sky-900/20">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Khung block 1 */}
                <rect x="12" y="10" width="40" height="12" rx="4" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
                <circle cx="18" cy="16" r="2" fill="#38BDF8" />
                <rect x="24" y="14" width="16" height="4" rx="1" fill="#38BDF8" opacity="0.5" />
                
                {/* Khung block 2 */}
                <rect x="12" y="26" width="40" height="12" rx="4" fill="#0064D2" fillOpacity="0.08" stroke="#0064D2" strokeWidth="1.5" />
                <circle cx="18" cy="32" r="2" fill="#0064D2" />
                <rect x="24" y="30" width="16" height="4" rx="1" fill="#0064D2" opacity="0.5" />
                
                {/* Khung block 3 */}
                <rect x="12" y="42" width="40" height="12" rx="4" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.5" />
                <circle cx="18" cy="48" r="2" fill="#38BDF8" />
                <rect x="24" y="46" width="16" height="4" rx="1" fill="#38BDF8" opacity="0.5" />

                {/* Trỏ chuột click */}
                <path d="M46 36 L52 48 L48 50 L42 42 L38 46 L38 34 L46 36 Z" fill="#374151" stroke="#FFFFFF" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </div>
            
            <h3 className="text-sm font-bold text-base-content/80 mb-2 font-brand">Thêm giai đoạn tùy chỉnh</h3>
            <p className="text-2xs leading-relaxed max-w-[220px] text-base-content/50 mb-5 font-medium">
              Bạn có thể tạo giai đoạn tùy chỉnh để theo dõi kết quả quan trọng trước khi chuyển đổi.
            </p>
            <button className="btn btn-sm bg-[#0064D2] hover:bg-[#0052AD] text-white font-semibold rounded-lg shadow-2xs px-4 border-0">
              Thêm giai đoạn tùy chỉnh
            </button>
          </div>
        </div>
      ) : (
        /* Detailed Table View */
        <LeadsTable leads={MOCK_LEADS} stages={LEAD_STAGES} />
      )}
    </div>
  );
}
