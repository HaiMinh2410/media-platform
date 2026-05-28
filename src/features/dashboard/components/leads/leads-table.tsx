import React from 'react';
import { ChevronRight, ChevronDown, ArrowDown, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Lead, LeadStage } from './types';
import { cn } from '@shared/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
  allLeads: Lead[]; // Tất cả leads (chưa lọc) để tính toán count cho các sub-tabs
  stages: LeadStage[];
  selectedLeadIds: string[];
  onSelectLead: (leadId: string, isChecked: boolean) => void;
  onSelectAllLeads: (isChecked: boolean) => void;
  onChangeStage: (leadId: string, newStageId: string) => void;
  currentSubTab: string;
  onSubTabChange: (tabId: string) => void;
}

// Icon Messenger chính thức cực kỳ đẹp mắt
const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className="text-[#0084FF] shrink-0">
    <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.913 1.448 5.501 3.7 7.208V22l3.39-1.859c.92.256 1.895.395 2.91.395 5.523 0 10-4.146 10-9.243S17.523 2 12 2zm1.26 12.15l-2.48-2.65-4.83 2.65 5.3-5.63 2.53 2.7 4.73-2.7-5.25 5.63z" />
  </svg>
);

export function LeadsTable({ 
  leads, 
  allLeads,
  stages, 
  selectedLeadIds, 
  onSelectLead, 
  onSelectAllLeads, 
  onChangeStage,
  currentSubTab,
  onSubTabChange
}: LeadsTableProps) {
  
  // Tính count động cho các sub-tabs
  const totalCount = allLeads.length;
  const newCount = allLeads.filter(l => l.stage === 'new').length;
  const qualifiedCount = allLeads.filter(l => l.stage === 'qualified').length;
  const convertedCount = allLeads.filter(l => l.stage === 'converted').length;

  const isAllSelected = leads.length > 0 && leads.every(l => selectedLeadIds.includes(l.id));

  return (
    <div className="flex flex-col gap-4 w-full bg-base-100 p-4 border border-base-content/5 rounded-2xl shadow-3xs animate-fade-in">
      
      {/* 1. Thanh tab phân loại (Sub-tabs / Filter Menu) */}
      <div className="flex items-center justify-between border-b border-base-200 dark:border-base-800 pb-2.5 text-xs font-semibold text-base-content/75 overflow-x-auto w-full">
        <div className="flex items-center gap-2 md:gap-3.5 shrink-0">
          
          {/* Tab: Tất cả */}
          <button 
            onClick={() => onSubTabChange('all')}
            className={cn(
              "py-1.5 px-3 rounded-lg shadow-3xs transition-all cursor-pointer font-bold",
              currentSubTab === 'all' 
                ? "bg-[#e0f2fe] text-[#0064d2] dark:bg-sky-950/30 dark:text-sky-400 font-bold" 
                : "hover:bg-base-200/50 text-base-content/70"
            )}
          >
            Tất cả ({totalCount})
          </button>
 
          {/* Vạch phân cách đứng */}
          <div className="h-4 w-[1px] bg-base-300 dark:bg-base-800" />
 
          {/* Tab: Tiếp nhận */}
          <button 
            onClick={() => onSubTabChange('new')}
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer font-bold",
              currentSubTab === 'new' 
                ? "bg-[#e0f2fe] text-[#0064d2] dark:bg-sky-950/30 dark:text-sky-400" 
                : "hover:bg-base-200/50 text-base-content/70"
            )}
          >
            <span>Tiếp nhận</span>
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
              currentSubTab === 'new' ? "bg-[#0064d2] text-white" : "bg-base-200 dark:bg-base-800"
            )}>
              {newCount}
            </span>
            <ChevronRight size={12} className="opacity-60 shrink-0" />
          </button>
 
          {/* Tab: Đủ tiêu chuẩn */}
          <button 
            onClick={() => onSubTabChange('qualified')}
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer font-bold",
              currentSubTab === 'qualified' 
                ? "bg-[#e0f2fe] text-[#0064d2] dark:bg-sky-950/30 dark:text-sky-400" 
                : "hover:bg-base-200/50 text-base-content/70"
            )}
          >
            <span>Đủ tiêu chuẩn</span>
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
              currentSubTab === 'qualified' ? "bg-[#0064d2] text-white" : "bg-base-200 dark:bg-base-800"
            )}>
              {qualifiedCount}
            </span>
            <ChevronRight size={12} className="opacity-60 shrink-0" />
          </button>
 
          {/* Tab: Đã chuyển đổi */}
          <button 
            onClick={() => onSubTabChange('converted')}
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition-all cursor-pointer font-bold",
              currentSubTab === 'converted' 
                ? "bg-[#e0f2fe] text-[#0064d2] dark:bg-sky-950/30 dark:text-sky-400" 
                : "hover:bg-base-200/50 text-base-content/70"
            )}
          >
            <span>Đã chuyển đổi</span>
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
              currentSubTab === 'converted' ? "bg-[#0064d2] text-white" : "bg-base-200 dark:bg-base-800"
            )}>
              {convertedCount}
            </span>
          </button>
        </div>
 
        {/* Nút Ba chấm góc phải */}
        <button className="w-8 h-8 hover:bg-base-200 rounded-lg flex items-center justify-center transition-all text-base-content/50 shrink-0 cursor-pointer">
          <MoreHorizontal size={14} />
        </button>
      </div>
 
      {/* 2. Cấu trúc Bảng dữ liệu chính (Data Table) */}
      <div className="overflow-x-auto w-full">
        <table className="table table-zebra w-full text-left border-separate border-spacing-y-0.5">
          <thead>
            <tr className="border-b border-base-200 dark:border-base-800 text-base-content/50 text-[11px] font-semibold uppercase tracking-wider bg-base-200/10">
              {/* Checkbox hàng loạt */}
              <th className="w-10 pl-3">
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={(e) => onSelectAllLeads(e.target.checked)}
                  className="checkbox checkbox-xs checkbox-primary rounded-sm cursor-pointer" 
                />
              </th>
              
              {/* Cột Ngày thêm */}
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors">
                <div className="flex items-center gap-1">
                  <span>Ngày thêm</span>
                  <ArrowDown size={12} className="text-[#0064d2]" />
                </div>
              </th>
 
              {/* Cột Tên */}
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors">
                <div className="flex items-center gap-1">
                  <span>Tên</span>
                  <ArrowUpDown size={11} className="opacity-50" />
                </div>
              </th>
 
              {/* Cột Giai đoạn */}
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors">
                <div className="flex items-center gap-1">
                  <span>Giai đoạn</span>
                  <ArrowUpDown size={11} className="opacity-50" />
                </div>
              </th>
 
              {/* Cột Nguồn */}
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors">
                <div className="flex items-center gap-1">
                  <span>Nguồn</span>
                  <ArrowUpDown size={11} className="opacity-50" />
                </div>
              </th>
 
              {/* Cột Chỉ định cho */}
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors">
                <div className="flex items-center gap-1">
                  <span>Chỉ định cho</span>
                  <ArrowUpDown size={11} className="opacity-50" />
                </div>
              </th>
 
              {/* Cột Kênh */}
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors">
                <div className="flex items-center gap-1">
                  <span>Kênh</span>
                  <ArrowUpDown size={11} className="opacity-50" />
                </div>
              </th>
 
              {/* Cột Trạng thái */}
              <th className="py-3 px-3 cursor-pointer hover:bg-base-200/30 transition-colors">
                <div className="flex items-center gap-1">
                  <span>Trạng thái</span>
                  <ArrowUpDown size={11} className="opacity-50" />
                </div>
              </th>
 
              {/* Cột Lời nhắc */}
              <th className="py-3 px-3 pr-3">
                <span>Lời nhắc</span>
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-base-200 dark:divide-base-800">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-base-200/30 transition-colors text-xs text-base-content/85">
                  {/* Checkbox */}
                  <td className="pl-3 py-2.5">
                    <input 
                      type="checkbox" 
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={(e) => onSelectLead(lead.id, e.target.checked)}
                      className="checkbox checkbox-xs checkbox-primary rounded-sm cursor-pointer" 
                    />
                  </td>
 
                  {/* Ngày thêm */}
                  <td className="py-2.5 px-3 font-medium text-base-content/70">
                    {lead.date}
                  </td>
 
                  {/* Tên & Avatar đè logo Messenger */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-base-300 bg-linear-to-tr from-sky-100 to-indigo-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                          {lead.avatar ? (
                            <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{lead.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        {/* Logo Messenger đè lên avatar */}
                        {lead.platform === 'messenger' && (
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-base-200 rounded-full p-0.5 shadow-2xs border border-base-100 dark:border-base-900 flex items-center justify-center">
                            <MessengerIcon />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-base-content hover:text-[#0064d2] cursor-pointer transition-colors text-xs">
                        {lead.name}
                      </span>
                    </div>
                  </td>
 
                  {/* Dropdown Giai đoạn */}
                  <td className="py-2.5 px-3">
                    <div className="dropdown dropdown-bottom">
                      <div 
                        tabIndex={0} 
                        role="button"
                        className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold cursor-pointer border border-base-200 dark:border-base-800 w-fit text-[11px] shadow-3xs"
                      >
                        <span>{stages.find(s => s.id === lead.stage)?.label || lead.stage}</span>
                        <ChevronDown size={11} className="opacity-60 shrink-0" />
                      </div>
                      <ul tabIndex={0} className="dropdown-content menu p-1.5 shadow-md bg-base-100 rounded-xl w-44 z-[100] border border-base-200 dark:border-base-800 mt-1">
                        <li className="menu-title text-[9px] font-bold uppercase text-base-content/40">Chuyển sang:</li>
                        {stages.map((stage) => (
                          <li key={stage.id}>
                            <button 
                              onClick={() => onChangeStage(lead.id, stage.id)} 
                              className="text-xs py-1.5 cursor-pointer"
                            >
                              {stage.icon} {stage.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
 
                  {/* Badge Nguồn */}
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded font-semibold text-[10px]">
                      {lead.source}
                    </span>
                  </td>
 
                  {/* Dropdown Chỉ định cho */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold cursor-pointer border border-base-200 dark:border-base-800 w-fit text-[11px] shadow-3xs">
                      <span>Chưa chỉ định</span>
                      <ChevronDown size={11} className="opacity-60 shrink-0" />
                    </div>
                  </td>
 
                  {/* Kênh */}
                  <td className="py-2.5 px-3 font-medium text-base-content/70">
                    {lead.platform === 'messenger' ? 'Messenger' : lead.platform}
                  </td>
 
                  {/* Trạng thái (Tự động thu thập) */}
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    Hoạt động
                  </td>
 
                  {/* Lời nhắc */}
                  <td className="py-2.5 px-3 pr-3 text-base-content/40 italic">
                    Không có
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-8 text-base-content/40 font-semibold">
                  Không tìm thấy khách hàng tiềm năng nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
