import React from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { Lead, LeadStage } from './types';
import { cn } from '@shared/lib/utils';

interface LeadCardProps {
  lead: Lead;
  stages: LeadStage[];
  onChangeStage: (leadId: string, newStageId: string) => void;
  onDeleteLead: (leadId: string) => void;
  isBulkEditing?: boolean;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
}

// Icon Messenger chính thức cực kỳ đẹp mắt
const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className="text-[#0084FF] shrink-0">
    <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.913 1.448 5.501 3.7 7.208V22l3.39-1.859c.92.256 1.895.395 2.91.395 5.523 0 10-4.146 10-9.243S17.523 2 12 2zm1.26 12.15l-2.48-2.65-4.83 2.65 5.3-5.63 2.53 2.7 4.73-2.7-5.25 5.63z" />
  </svg>
);

export function LeadCard({ 
  lead, 
  stages, 
  onChangeStage, 
  onDeleteLead,
  isBulkEditing = false,
  isSelected = false,
  onSelect = () => {},
}: LeadCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 208; // tương đương w-52
      let leftPos = rect.left - menuWidth - 4; // hiển thị về bên trái
      
      // Nếu không đủ chỗ bên trái màn hình, cho hiển thị về bên phải
      if (leftPos < 10) {
        leftPos = rect.right + 4;
      }
      
      setCoords({
        top: rect.top,
        left: leftPos
      });
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    } else {
      updateCoords();
      setIsDropdownOpen(true);
    }
  };

  React.useEffect(() => {
    if (!isDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        (buttonRef.current && buttonRef.current.contains(e.target as Node)) ||
        (menuRef.current && menuRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setIsDropdownOpen(false);
    };

    const handleScrollOrResize = () => {
      setIsDropdownOpen(false);
    };

    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isDropdownOpen]);

  // Xử lý kéo thả HTML5
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", lead.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      <div 
        draggable={!isBulkEditing}
        onDragStart={isBulkEditing ? undefined : handleDragStart}
        onClick={isBulkEditing ? () => onSelect(!isSelected) : undefined}
        className={cn(
          "bg-base-100 rounded-xl p-3 border flex items-center justify-between transition-all duration-300 shadow-3xs group select-none h-16.5",
          isBulkEditing 
            ? "cursor-pointer hover:border-sky-300 dark:hover:border-sky-850 hover:bg-base-200/25" 
            : "cursor-grab active:cursor-grabbing hover:shadow-xs hover:border-sky-300 dark:hover:border-sky-850 active:scale-[0.98] border-base-200 dark:border-base-800",
          isSelected && isBulkEditing && "border-sky-400 bg-sky-50/10 dark:bg-sky-950/5 shadow-xs"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Checkbox chọn hàng loạt bên trái avatar */}
          {isBulkEditing && (
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              onClick={(e) => e.stopPropagation()} // Tránh kích hoạt thêm onClick ở thẻ cha
              className="checkbox checkbox-primary rounded-sm checkbox-xs border-base-300 shrink-0 cursor-pointer"
            />
          )}

          {/* Avatar có đè Messenger icon ở góc dưới bên phải */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-base-300 bg-linear-to-tr from-sky-100 to-indigo-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              {lead.avatar ? (
                <img src={lead.avatar} alt={lead.name} className="w-full h-full object-cover" />
              ) : (
                <span>{lead.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {/* Huy hiệu Messenger */}
            {lead.platform === 'messenger' && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-base-200 rounded-full p-0.5 shadow-2xs border border-base-200 dark:border-base-800 flex items-center justify-center">
                <MessengerIcon />
              </div>
            )}
          </div>
  
          {/* Thông tin khách hàng */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="text-xs md:text-sm font-bold text-base-content leading-tight truncate">
              {lead.name}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Badge nguồn */}
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded text-[9px] font-semibold">
                {lead.source}
              </span>
              <span className="text-[9px] text-base-content/40 font-medium">
                {lead.date}
              </span>
            </div>
          </div>
        </div>
  
        {/* Nút Ba chấm hiển thị dropdown option (ẩn đi khi Bulk Edit) */}
        {!isBulkEditing && (
          <div className="relative shrink-0 ml-1">
            <button 
              ref={buttonRef}
              onClick={toggleDropdown}
              className={cn(
                "btn btn-xs btn-ghost btn-square rounded-lg text-base-content/40 hover:text-base-content/80 hover:bg-base-200 cursor-pointer flex items-center justify-center",
                isDropdownOpen && "bg-base-200 text-base-content/80"
              )}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Render Dropdown bằng React Portal để tránh lỗi Overflow Clipping và z-index từ Kanban Column */}
      {mounted && isDropdownOpen && coords && createPortal(
        <ul 
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999,
          }}
          className="menu p-1.5 shadow-md bg-base-100 rounded-xl w-52 border border-base-200 dark:border-base-800 animate-in fade-in slide-in-from-top-1 duration-100"
        >
          <li className="menu-title text-[9px] font-bold uppercase text-base-content/40 tracking-wider">Chuyển sang</li>
          
          {stages
            .filter((stage) => stage.id !== lead.stage)
            .map((stage) => (
              <li key={stage.id}>
                <button 
                  onClick={() => {
                    onChangeStage(lead.id, stage.id);
                    setIsDropdownOpen(false);
                  }}
                  className="text-xs py-1.5 cursor-pointer rounded-lg flex items-center gap-1.5"
                >
                  <span className="text-[10px]">{stage.icon}</span>
                  {stage.label}
                </button>
              </li>
            ))}
          
          {/* Đường ngăn cách */}
          <div className="h-[1px] bg-base-200 dark:bg-base-800 my-1 mx-2" />
          
          <li>
            <button 
              onClick={() => {
                setIsDeleteModalOpen(true);
                setIsDropdownOpen(false);
              }}
              className="text-xs py-1.5 text-error hover:bg-error/10 hover:text-error rounded-lg flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              🗑️ Xóa khách hàng tiềm năng
            </button>
          </li>
        </ul>,
        document.body
      )}

      {/* Popup xác nhận xóa khách hàng tiềm năng (Modal dạng Overlay tuyệt đẹp) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="bg-base-100 rounded-2xl p-6 max-w-[300px] w-full mx-4 shadow-xl border border-base-200 dark:border-base-800 animate-in fade-in zoom-in-95 duration-200 relative text-left">
            {/* Nút đóng góc phải */}
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/70 cursor-pointer font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="text-sm font-bold text-base-content mb-2 font-brand">
              Xóa khách hàng tiềm năng này?
            </h3>
            
            <p className="text-2xs leading-relaxed text-base-content/60 mb-6 font-medium">
              Khách hàng tiềm năng này sẽ bị xóa khỏi Trung tâm khách hàng tiềm năng. Hành động này không thể hoàn tác.
            </p>
            
            <div className="flex justify-end gap-2.5">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-base-300 dark:border-base-750 text-base-content/75 hover:bg-base-200 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 h-9"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  onDeleteLead(lead.id);
                  setIsDeleteModalOpen(false);
                }}
                className="px-4 py-1.5 bg-[#0064d2] hover:bg-[#0052ad] text-white rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 h-9 border-0"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
