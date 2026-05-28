import React from 'react';
import { MoreHorizontal, Info } from 'lucide-react';
import { Lead, LeadStage } from './types';
import { LeadCard } from './lead-card';

interface KanbanColumnProps {
  stage: LeadStage;
  leads: Lead[];
}

export function KanbanColumn({ stage, leads }: KanbanColumnProps) {
  return (
    <div 
      className="min-w-[300px] max-w-[300px] bg-[#f8fafc] dark:bg-base-200/40 border border-base-200 dark:border-base-800 rounded-2xl p-4 flex flex-col gap-4 h-full min-h-[480px] shadow-3xs shrink-0"
    >
      {/* Column Header */}
      <div className="flex justify-between items-center pb-2 border-b border-base-200 dark:border-base-800">
        <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-base-content relative">
          <span>{stage.label}</span>
          
          {/* Tooltip Info Icon */}
          <div className="relative group/tooltip flex items-center justify-center">
            <Info size={13} className="text-base-content/40 cursor-pointer hover:text-base-content/75 transition-colors shrink-0" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-white dark:bg-base-100 text-base-content/85 text-[10px] leading-relaxed rounded-xl border border-base-200 dark:border-base-800 shadow-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-300 z-50 text-center font-semibold">
              {/* Mũi tên chĩa xuống */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-base-100 border-b border-r border-base-200 dark:border-base-800 rotate-45" />
              Không thể đổi tên, xóa và di chuyển các giai đoạn mặc định
            </div>
          </div>

          {/* Badge số lượng dạng tròn xám nhẹ */}
          <span className="ml-1 w-5 h-5 rounded-full bg-base-200 dark:bg-base-800 text-[10px] font-bold text-base-content/70 flex items-center justify-center font-mono">
            {leads.length}
          </span>
        </div>
        
        {/* Nút ba chấm */}
        <button className="btn btn-xs btn-ghost btn-square rounded-lg text-base-content/50 hover:text-base-content/80 hover:bg-base-200">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Lead Cards List */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar pr-0.5">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))
        ) : (
          /* Trạng thái rỗng cho Đủ tiêu chuẩn / Đã chuyển đổi */
          <div className="flex-1 flex flex-col items-center justify-center p-5 text-center text-base-content/40 gap-4 mt-8">
            
            {/* SVG minh họa Đủ tiêu chuẩn */}
            {stage.id === 'qualified' && (
              <div className="relative w-20 h-20 flex items-center justify-center bg-sky-50/50 dark:bg-sky-950/10 rounded-2xl border border-sky-100/30">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Block 1 */}
                  <rect x="12" y="10" width="40" height="10" rx="3" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.2" />
                  <circle cx="18" cy="15" r="1.5" fill="#38BDF8" />
                  
                  {/* Block 2 (Highlight) */}
                  <rect x="8" y="26" width="48" height="14" rx="4" fill="#0064D2" fillOpacity="0.08" stroke="#0064D2" strokeWidth="1.5" />
                  <circle cx="14" cy="33" r="2" fill="#0064D2" />
                  
                  {/* Block 3 */}
                  <rect x="12" y="46" width="40" height="10" rx="3" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.2" />
                  <circle cx="18" cy="51" r="1.5" fill="#38BDF8" />
                </svg>
              </div>
            )}

            {/* SVG minh họa Đã chuyển đổi */}
            {stage.id === 'converted' && (
              <div className="relative w-20 h-20 flex items-center justify-center bg-sky-50/50 dark:bg-sky-950/10 rounded-2xl border border-sky-100/30">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Block 1 */}
                  <rect x="12" y="10" width="40" height="10" rx="3" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.2" />
                  <circle cx="18" cy="15" r="1.5" fill="#38BDF8" />
                  
                  {/* Block 2 (Highlight + Check) */}
                  <rect x="8" y="26" width="48" height="14" rx="4" fill="#0064D2" fillOpacity="0.08" stroke="#0064D2" strokeWidth="1.5" />
                  <circle cx="14" cy="33" r="2" fill="#0064D2" />
                  <circle cx="48" cy="33" r="6" fill="#38BDF8" />
                  <path d="M46 33 L47.5 34.5 L50 31.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Block 3 */}
                  <rect x="12" y="46" width="40" height="10" rx="3" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="1.2" />
                  <circle cx="18" cy="51" r="1.5" fill="#38BDF8" />
                </svg>
              </div>
            )}

            <div className="text-xs font-bold text-base-content/75 font-brand leading-snug">
              {stage.id === 'qualified' && "Không có khách hàng tiềm năng Đủ tiêu chuẩn nào"}
              {stage.id === 'converted' && "Không có khách hàng tiềm năng Đã chuyển đổi nào"}
            </div>

            <p className="text-[10px] leading-relaxed max-w-[200px] text-base-content/45 font-medium -mt-2">
              {stage.id === 'qualified' && "Chuyển khách hàng tiềm năng sang giai đoạn này nếu họ thực sự quan tâm đến sản phẩm hoặc dịch vụ."}
              {stage.id === 'converted' && "Chuyển khách hàng tiềm năng sang giai đoạn này nếu đã thỏa thuận hoặc giao dịch với họ."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
