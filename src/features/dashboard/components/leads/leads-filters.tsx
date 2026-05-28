import React from 'react';
import { Kanban, LayoutGrid, SlidersHorizontal, Calendar, ChevronDown, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface LeadsFiltersProps {
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
}

export function LeadsFilters({ viewMode, onViewModeChange }: LeadsFiltersProps) {
  return (
    <div className="flex flex-col gap-3.5 w-full bg-base-100 p-4 border border-base-content/5 rounded-2xl shadow-3xs">
      {/* Hàng 1: Switcher + Nút Ẩn bộ lọc */}
      <div className="flex justify-between items-center w-full">
        {/* Switcher */}
        <div className="flex gap-1.5 bg-base-200/30 p-1 rounded-xl border border-base-content/5">
          <button 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer h-7",
              viewMode === 'kanban' 
                ? "bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0c4a6e]/40 dark:text-[#0ea5e9] border border-[#bae6fd]/50 shadow-3xs" 
                : "text-base-content/60 hover:text-base-content/80 hover:bg-base-200/50"
            )}
            onClick={() => onViewModeChange('kanban')}
          >
            <Kanban size={13} className="shrink-0" />
            Chế độ xem theo quy trình
          </button>
          <button 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer h-7",
              viewMode === 'table' 
                ? "bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0c4a6e]/40 dark:text-[#0ea5e9] border border-[#bae6fd]/50 shadow-3xs" 
                : "text-base-content/60 hover:text-base-content/80 hover:bg-base-200/50"
            )}
            onClick={() => onViewModeChange('table')}
          >
            <LayoutGrid size={13} className="shrink-0" />
            Chế độ xem bảng
          </button>
        </div>

        {/* Nút Ẩn bộ lọc */}
        <button className="btn btn-sm bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 text-xs font-semibold px-3 h-8 rounded-lg shadow-3xs flex items-center gap-1.5">
          <SlidersHorizontal size={13} />
          Ẩn bộ lọc
        </button>
      </div>

      {/* Hàng 2: Các nút chức năng & Lọc dropdown */}
      <div className="flex flex-wrap gap-2.5 items-center w-full">
        {/* Nút Thêm giai đoạn tùy chỉnh */}
        <button className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center shadow-3xs">
          Thêm giai đoạn tùy chỉnh
        </button>

        {/* Nút Chỉnh sửa hàng loạt */}
        <button className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center shadow-3xs">
          Chỉnh sửa hàng loạt
        </button>

        {/* Thanh ngăn dọc */}
        <div className="h-4 w-[1px] bg-base-300 mx-0.5" />

        {/* Nút Thêm bộ lọc */}
        <button className="px-2.5 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 shadow-3xs">
          <Plus size={13} />
          Thêm bộ lọc
        </button>

        {/* Dropdown Chiến dịch */}
        <div className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 cursor-pointer shadow-3xs">
          <span>Chiến dịch</span>
          <ChevronDown size={12} className="opacity-60" />
        </div>

        {/* Dropdown Mẫu */}
        <div className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 cursor-pointer shadow-3xs">
          <span>Mẫu</span>
          <ChevronDown size={12} className="opacity-60" />
        </div>

        {/* Dropdown Chọn ngày */}
        <div className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 cursor-pointer shadow-3xs">
          <Calendar size={13} className="opacity-70" />
          <span>Chọn ngày</span>
          <ChevronDown size={12} className="opacity-60" />
        </div>

        {/* Dropdown Trạng thái */}
        <div className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 cursor-pointer shadow-3xs">
          <span>Trạng thái</span>
          <ChevronDown size={12} className="opacity-60" />
        </div>

        {/* Dropdown Nguồn */}
        <div className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 cursor-pointer shadow-3xs">
          <span>Nguồn</span>
          <ChevronDown size={12} className="opacity-60" />
        </div>

        {/* Dropdown Chỉ định cho */}
        <div className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 cursor-pointer shadow-3xs">
          <span>Chỉ định cho</span>
          <ChevronDown size={12} className="opacity-60" />
        </div>

        {/* Dropdown Nhãn */}
        <div className="px-3 py-1 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/75 rounded-lg text-xs font-semibold transition-all h-8 flex items-center gap-1.5 cursor-pointer shadow-3xs">
          <span>Nhãn</span>
          <ChevronDown size={12} className="opacity-60" />
        </div>

        {/* Nút Ba chấm (chỉ hiển thị ở Kanban view như trong hình) */}
        {viewMode === 'kanban' && (
          <button className="w-8 h-8 bg-base-100 hover:bg-base-200 border border-base-300 text-base-content/70 rounded-lg flex items-center justify-center transition-all shadow-3xs ml-auto">
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
