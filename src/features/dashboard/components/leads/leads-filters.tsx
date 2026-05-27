import React from 'react';
import { Columns, Table as TableIcon, Filter, Calendar } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface LeadsFiltersProps {
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
}

export function LeadsFilters({ viewMode, onViewModeChange }: LeadsFiltersProps) {
  return (
    <div className="flex flex-wrap justify-between items-center p-3 bg-base-100 border border-base-content/5 rounded-2xl shadow-xs gap-4 w-full">
      {/* Switcher */}
      <div className="flex gap-1 bg-base-200/50 p-1 rounded-xl border border-base-content/5">
        <button 
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer",
            viewMode === 'kanban' 
              ? "bg-primary text-primary-content shadow-xs" 
              : "text-base-content/60 hover:text-base-content/80"
          )}
          onClick={() => onViewModeChange('kanban')}
        >
          <Columns size={14} />
          Quy trình (Kanban)
        </button>
        <button 
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer",
            viewMode === 'table' 
              ? "bg-primary text-primary-content shadow-xs" 
              : "text-base-content/60 hover:text-base-content/80"
          )}
          onClick={() => onViewModeChange('table')}
        >
          <TableIcon size={14} />
          Bảng chi tiết
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn btn-xs btn-soft border border-base-content/5 text-base-content/70 hover:bg-base-200 rounded-lg transition-all">
          <Filter size={12} />
          Bộ lọc nâng cao
        </button>
        
        <select className="select select-xs select-bordered bg-base-200/40 border-base-content/5 text-base-content/80 font-bold rounded-lg h-7 focus:border-primary/30">
          <option>Chiến dịch</option>
        </select>
        
        <select className="select select-xs select-bordered bg-base-200/40 border-base-content/5 text-base-content/80 font-bold rounded-lg h-7 focus:border-primary/30">
          <option>Mẫu thu thập</option>
        </select>
        
        <button className="btn btn-xs btn-soft border border-base-content/5 text-base-content/70 hover:bg-base-200 rounded-lg transition-all">
          <Calendar size={12} />
          Chọn ngày
        </button>
        
        <select className="select select-xs select-bordered bg-base-200/40 border-base-content/5 text-base-content/80 font-bold rounded-lg h-7 focus:border-primary/30">
          <option>Trạng thái</option>
        </select>
      </div>
    </div>
  );
}
