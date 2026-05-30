import { Icon, MessengerIcon, RangeSelector, ConfirmDialog } from "@shared/ui";
import { cn } from "@shared/lib";

import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Lead, LeadStage } from "./types";
import { useInboxStore } from "@features/inbox/store/inbox.store";

interface LeadCardProps {
  lead: Lead;
  stages: LeadStage[];
  onChangeStage: (leadId: string, newStageId: string) => void;
  onDeleteLead: (leadId: string) => void;
  isBulkEditing?: boolean;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  isAllClusters?: boolean;
}

export function LeadCard({
  lead,
  stages,
  onChangeStage,
  onDeleteLead,
  isBulkEditing = false,
  isSelected = false,
  onSelect = () => {},
  isAllClusters = false,
}: LeadCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const { accountGroups } = useInboxStore();
  const account = React.useMemo(() => {
    if (!lead.accountId) return null;
    for (const group of accountGroups) {
      const found = group.members.find((m) => m.id === lead.accountId);
      if (found) return found;
    }
    return null;
  }, [accountGroups, lead.accountId]);

  // Xử lý kéo thả HTML5
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation(); // Ngăn chặn sự kiện nổi bọt lên cột Kanban cha
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
          "bg-soft/30 rounded-md p-2 px-3 border flex items-center justify-between transition-all duration-300 group select-none h-16.5",
          isBulkEditing ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
          isSelected && isBulkEditing
            ? "border-info bg-info/5"
            : "border-base-content/5 hover:border-base-content/10 hover:bg-soft/60",
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
            <div className="size-9 rounded-full overflow-hidden border border-base-300 bg-linear-to-tr from-sky-100 to-indigo-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              {lead.avatar ? (
                <img
                  src={lead.avatar}
                  alt={lead.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{lead.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {/* Huy hiệu Nền tảng (Platform Badge) */}
            {lead.platform && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-base-200 rounded-full p-0.5 shadow-2xs border border-base-200 dark:border-base-800 flex items-center justify-center">
                {lead.platform === "messenger" ? (
                  <MessengerIcon />
                ) : lead.platform === "instagram" ? (
                  <Icon name="instagram-filled" size={10} className="text-instagram shrink-0" />
                ) : lead.platform === "facebook" ? (
                  <Icon name="facebook" size={10} className="text-facebook shrink-0" />
                ) : lead.platform === "tiktok" ? (
                  <Icon name="tiktok" size={10} className="text-base-content shrink-0" />
                ) : (
                  <Icon name={lead.platform as any} size={10} className="shrink-0" />
                )}
              </div>
            )}
          </div>

          {/* Thông tin khách hàng */}
          <div className="flex flex-col gap-0.75 min-w-0 flex-1 justify-center">
            <div className="text-xs md:text-sm font-bold text-base-content leading-tight truncate">
              {lead.name}
            </div>
            {isAllClusters && account && (
              <span className="text-xs text-base-content/40 truncate leading-none">
                via {account.name}
              </span>
            )}
          </div>
        </div>

        {/* Nút Ba chấm hiển thị dropdown option (ẩn đi khi Bulk Edit) */}
        {!isBulkEditing && (
          <RangeSelector
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            menuAlign="right"
            menuMinWidth="w-52"
            dropdownClassName="rounded-lg"
            customTrigger={
              <button
                className={cn(
                  "btn btn-xs btn-ghost btn-square rounded-lg text-base-content/40 hover:text-base-content/80 hover:bg-base-200 cursor-pointer flex items-center justify-center shrink-0 ml-1",
                  isDropdownOpen && "bg-base-200 text-base-content/80",
                )}
              >
                <EllipsisVertical size={16} />
              </button>
            }
          >
            <div className="flex flex-col gap-0.5 w-full">
              <span className="px-3 py-1.5 text-sm text-base-content/40">
                Chuyển sang
              </span>

              {stages
                .filter((stage) => stage.id !== lead.stage)
                .map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => {
                      onChangeStage(lead.id, stage.id);
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-base-content hover:bg-base-100 rounded-md cursor-pointer w-full"
                  >
                    <span className="truncate">{stage.label}</span>
                  </button>
                ))}

              {/* Đường ngăn cách */}
              <div className="h-px bg-base-content/10 my-1" />

              <button
                onClick={() => {
                  const modal = document.getElementById(`delete_modal_${lead.id}`) as HTMLDialogElement;
                  modal?.showModal();
                  setIsDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded-md cursor-pointer w-full"
              >
                Xóa khách hàng tiềm năng
              </button>
            </div>
          </RangeSelector>
        )}
      </div>

      {/* Dialog xác nhận xóa khách hàng tiềm năng */}
      <ConfirmDialog
        id={`delete_modal_${lead.id}`}
        title="Xóa khách hàng tiềm năng này?"
        description="Khách hàng tiềm năng này sẽ bị xóa khỏi Trung tâm khách hàng tiềm năng. Hành động này không thể hoàn tác."
        onConfirm={() => onDeleteLead(lead.id)}
      />
    </>
  );
}
