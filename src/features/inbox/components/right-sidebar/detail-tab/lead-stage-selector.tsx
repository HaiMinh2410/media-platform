import { cn } from "@shared/lib";
import { PortalTooltip, RangeSelector } from "@shared/ui";

import React, { useRef, useState, useEffect } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const leadStages = [
  { id: 'new', label: 'Tiếp nhận', description: 'Khách hàng tiềm năng mới hoặc mới đây đã tương tác với Trang của bạn.', badge: 'blue' },
  { id: 'qualified', label: 'Đủ tiêu chuẩn', description: 'Khách hàng tiềm năng thực sự quan tâm đến sản phẩm hoặc dịch vụ của bạn.', badge: 'green' },
  { id: 'converted', label: 'Đã chuyển đổi', description: 'Khách hàng tiềm năng đã thỏa thuận hoặc giao dịch với doanh nghiệp của bạn.', badge: 'purple' },
  { id: 'lost', label: 'Bị mất đi', description: 'Khách hàng tiềm năng không quan tâm nhưng có thể đáng để thu hút lại trong tương lai.', badge: 'gray' },
  { id: 'unqualified', label: 'Không đủ tiêu chuẩn', description: 'Khách hàng tiềm năng không phù hợp với doanh nghiệp của bạn.', badge: 'red' },
];

const badgeColorMap: Record<string, string> = {
  blue: 'badge-info badge-soft',
  green: 'badge-success badge-soft',
  purple: 'badge-primary badge-soft',
  gray: 'badge-warning badge-soft',
  red: 'badge-error badge-soft',
};

interface LeadStageSelectorProps {
  priority: string | null;
  onUpdatePriority: (priority: string) => void;
}

export function LeadStageSelector({ priority, onUpdatePriority }: LeadStageSelectorProps) {
  const getInitialStatus = (p: string | null) => {
    if (!p) return 'none';
    if (leadStages.some(s => s.id === p)) return p;
    return 'none';
  };

  const [leadStatus, setLeadStatus] = useState(getInitialStatus(priority));
  const [isLead, setIsLead] = useState(priority !== null && leadStages.some(s => s.id === priority));
  const [isLeadStatusOpen, setIsLeadStatusOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const tooltipAnchorRef = useRef<HTMLDivElement>(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLeadStatusOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownPosition(spaceBelow < 320 ? 'top' : 'bottom');
    }
  }, [isLeadStatusOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsLead(priority !== null && leadStages.some(s => s.id === priority));
    setLeadStatus(getInitialStatus(priority));
  }, [priority]);

  const handleUpdateLeadStatus = async (status: string) => {
    setLeadStatus(status);
    onUpdatePriority(status);
    
    switch (status) {
      case 'new': toast.success('Đã chuyển sang giai đoạn Tiếp nhận'); break;
      case 'qualified': toast.success('Khách hàng đã đủ tiêu chuẩn'); break;
      case 'converted': toast.success('Tuyệt vời! Đã chốt đơn thành công'); break;
      case 'lost': toast.info('Đã đánh dấu khách hàng bị mất đi'); break;
      case 'unqualified': toast.error('Khách hàng không đủ tiêu chuẩn'); break;
      default: toast.success('Đã cập nhật giai đoạn khách hàng');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-base-content/50">Hoạt động</h3>
        <div className="flex items-center gap-2">
          {isLead && (
            <span 
              className="text-xs text-primary cursor-pointer hover:underline" 
              onClick={() => {
                setIsLead(false);
                handleUpdateLeadStatus('none');
                toast.info('Đã bỏ đánh dấu khách hàng tiềm năng');
              }}
            >
              Bỏ đánh dấu
            </span>
          )}
          <span className="badge badge-xs p-2 py-2.5 badge-ghost rounded-sm border-base-content/10 text-base-content/60">Khuyên dùng</span>
        </div>
      </div>
      
      <h3 className="text-sm font-semibold text-base-content/70 flex items-center gap-2 mt-1 font-brand">
        Giai đoạn khách hàng tiềm năng 
        <div
          ref={tooltipAnchorRef}
          onMouseEnter={() => setIsTooltipOpen(true)}
          onMouseLeave={() => setIsTooltipOpen(false)}
          className="cursor-help text-base-content/40 hover:text-base-content/70 transition-colors flex items-center"
        >
          <Info size={14} />
        </div>
        <PortalTooltip
          active={isMounted && isTooltipOpen}
          anchorRef={tooltipAnchorRef}
          showArrow
          position="top"
          align="left"
          className="w-72 text-xs font-normal leading-relaxed text-base-content"
        >
          <div className="space-y-1 p-0.5">
            <p className="font-bold text-base-content">Giai đoạn tiềm năng</p>
            <p className="text-base-content/60">
              Giúp phân loại và theo dõi tiến trình của khách hàng trong phễu bán hàng (ví dụ: Tiếp nhận, Đủ tiêu chuẩn, Đã chuyển đổi...).
            </p>
          </div>
        </PortalTooltip>
      </h3>

      <div className="relative w-full mt-1">
        {!isLead ? (
          <div 
            className="flex items-center justify-center w-full p-2.5 bg-base-200 border border-base-content/10 rounded-lg text-sm text-base-content/70 cursor-pointer transition-all hover:bg-base-300 hover:border-primary"
            onClick={() => {
              setIsLead(true);
              handleUpdateLeadStatus('new');
              toast.success('Đã đánh dấu là khách hàng tiềm năng');
            }}
          >
            <span>Đánh dấu là khách hàng tiềm năng</span>
          </div>
        ) : (
          <RangeSelector
            ref={triggerRef}
            isOpen={isLeadStatusOpen}
            onOpenChange={setIsLeadStatusOpen}
            position={dropdownPosition}
            className="w-full"
            menuMinWidth="w-full min-w-full"
            dropdownClassName="bg-base-100 rounded-xl shadow-2xl border border-base-content/10 overflow-hidden flex flex-col p-1.5 gap-0.5 w-full left-0 right-0"
            customTrigger={
              <div 
                className="flex items-center justify-between w-full p-2.5 bg-base-200 border border-base-content/10 rounded-lg text-sm text-base-content cursor-pointer transition-all hover:bg-base-300 hover:border-primary"
              >
                <span>{
                  leadStages.find(s => s.id === leadStatus)?.label || 'Chọn giai đoạn'
                }</span>
                <ChevronDown size={16} className={cn(isLeadStatusOpen && "rotate-180 transition-transform")} />
              </div>
            }
          >
            <div className="flex-1 overflow-y-auto p-2 max-h-[320px] scrollbar-thin scrollbar-thumb-base-content/10 flex flex-col gap-0.5">
              {leadStages.map((stage) => (
                <div 
                  key={stage.id} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-base-content/5",
                    leadStatus === stage.id && "bg-primary/10"
                  )}
                  onClick={() => {
                    handleUpdateLeadStatus(stage.id);
                    setIsLeadStatusOpen(false);
                  }}
                >
                  <div className="pt-0.5">
                    <div className={cn(
                      "w-4.5 h-4.5 rounded-full border-2 border-base-content/10 flex items-center justify-center transition-all",
                      leadStatus === stage.id && "border-primary"
                    )}>
                      {leadStatus === stage.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="font-bold text-sm text-base-content truncate">{stage.label}</span>
                      <span className={cn(
                        "badge badge-xs font-semibold shrink-0",
                        badgeColorMap[stage.badge] || "badge-neutral"
                      )}>
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/40 leading-normal break-words whitespace-normal">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-base-200 border-t rounded-lg border-base-content/10 text-xs text-base-content/50">
              <span>Bạn có thể tạo giai đoạn tùy chỉnh trong <a href="#" className="text-primary hover:underline">Leads Center</a>.</span>
            </div>
          </RangeSelector>
        )}
      </div>
    </div>
  );
}
