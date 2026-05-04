import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const leadStages = [
  { id: 'new', label: 'Tiếp nhận', description: 'Khách hàng tiềm năng mới hoặc mới đây đã tương tác với Trang của bạn.', badge: 'blue' },
  { id: 'qualified', label: 'Đủ tiêu chuẩn', description: 'Khách hàng tiềm năng thực sự quan tâm đến sản phẩm hoặc dịch vụ của bạn.', badge: 'green' },
  { id: 'converted', label: 'Đã chuyển đổi', description: 'Khách hàng tiềm năng đã thỏa thuận hoặc giao dịch với doanh nghiệp của bạn.', badge: 'purple' },
  { id: 'lost', label: 'Bị mất đi', description: 'Khách hàng tiềm năng không quan tâm nhưng có thể đáng để thu hút lại trong tương lai.', badge: 'gray' },
  { id: 'unqualified', label: 'Không đủ tiêu chuẩn', description: 'Khách hàng tiềm năng không phù hợp với doanh nghiệp của bạn.', badge: 'red' },
];

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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const [isMounted, setIsMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(event.target as Node))
      ) {
        setIsLeadStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsLead(priority !== null && leadStages.some(s => s.id === priority));
    setLeadStatus(getInitialStatus(priority));
  }, [priority]);

  const toggleLeadStatus = () => {
    if (!isLeadStatusOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      setDropdownDirection(spaceBelow < 400 ? 'up' : 'down');
      setDropdownPos({
        top: rect.top,
        left: rect.left,
        width: rect.width
      });
    }
    setIsLeadStatusOpen(!isLeadStatusOpen);
  };

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
        <h3 className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider">Hoạt động</h3>
        <div className="flex items-center gap-2">
          {isLead && (
            <span 
              className="text-xs text-accent-primary cursor-pointer hover:underline" 
              onClick={() => {
                setIsLead(false);
                handleUpdateLeadStatus('none');
                toast.info('Đã bỏ đánh dấu khách hàng tiềm năng');
              }}
            >
              Bỏ đánh dấu
            </span>
          )}
          <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-background-secondary border border-foreground/10 text-foreground-tertiary">Khuyên dùng</span>
        </div>
      </div>
      
      <h3 className="text-13 font-semibold text-foreground-secondary flex items-center gap-1 mt-1">
        Giai đoạn khách hàng tiềm năng <Info size={14} className="text-foreground-tertiary" />
      </h3>

      <div className="relative w-full mt-1" ref={dropdownRef}>
        {!isLead ? (
          <div 
            className="flex items-center justify-center w-full p-2.5 bg-background-secondary border border-foreground/10 rounded-lg text-sm text-foreground-secondary cursor-pointer transition-all hover:bg-background-tertiary hover:border-accent-primary"
            onClick={() => {
              setIsLead(true);
              handleUpdateLeadStatus('new');
              toast.success('Đã đánh dấu là khách hàng tiềm năng');
            }}
          >
            <span>Đánh dấu là khách hàng tiềm năng</span>
          </div>
        ) : (
          <div 
            className="flex items-center justify-between w-full p-2.5 bg-background-secondary border border-foreground/10 rounded-lg text-sm text-foreground cursor-pointer transition-all hover:bg-background-tertiary hover:border-accent-primary"
            onClick={toggleLeadStatus}
          >
            <span>{
              leadStages.find(s => s.id === leadStatus)?.label || 'Chọn giai đoạn'
            }</span>
            <ChevronDown size={16} className={cn(isLeadStatusOpen && "rotate-180 transition-transform")} />
          </div>
        )}

        {isLeadStatusOpen && isMounted && createPortal(
          <div 
            ref={menuRef}
            className={cn(
              "fixed bg-base-200 border border-foreground/10 rounded-xl shadow-2xl z-[10000] overflow-hidden flex flex-col",
              dropdownDirection === 'up' && "mb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
            )}
            style={{
              top: dropdownDirection === 'down' ? dropdownPos.top + 42 : 'auto',
              bottom: dropdownDirection === 'up' ? window.innerHeight - dropdownPos.top + 2 : 'auto',
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownDirection === 'down' 
                ? window.innerHeight - dropdownPos.top - 60 
                : dropdownPos.top - 20
            }}
          >
            <div className="flex-1 overflow-y-auto p-2 max-h-[320px] scrollbar-thin scrollbar-thumb-foreground/10">
              {leadStages.map((stage) => (
                <div 
                  key={stage.id} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-foreground/5",
                    leadStatus === stage.id && "bg-accent-primary/10"
                  )}
                  onClick={() => {
                    handleUpdateLeadStatus(stage.id);
                    setIsLeadStatusOpen(false);
                  }}
                >
                  <div className="pt-0.5">
                    <div className={cn(
                      "w-4.5 h-4.5 rounded-full border-2 border-foreground/10 flex items-center justify-center transition-all",
                      leadStatus === stage.id && "border-accent-primary"
                    )}>
                      {leadStatus === stage.id && <div className="w-2.5 h-2.5 rounded-full bg-accent-primary" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-foreground">{stage.label}</span>
                      <span className={cn(
                        "text-3xs font-bold px-2 py-0.5 rounded-full",
                        stage.badge === 'blue' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                        stage.badge === 'green' && "bg-green-500/20 text-green-400 border border-green-500/30",
                        stage.badge === 'purple' && "bg-purple-500/20 text-purple-400 border border-purple-500/30",
                        stage.badge === 'gray' && "bg-slate-500/20 text-slate-400 border border-slate-500/30",
                        stage.badge === 'red' && "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}>
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-tertiary leading-normal">{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-background-tertiary border-t border-foreground/10 text-xs text-foreground-tertiary">
              <span>Bạn có thể tạo giai đoạn tùy chỉnh trong <a href="#" className="text-accent-primary hover:underline">Leads Center</a>.</span>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
