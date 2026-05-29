import React from "react";
import { MoreHorizontal, Info } from "lucide-react";
import { Lead, LeadStage } from "./types";
import { LeadCard } from "./lead-card";
import { cn } from "@shared/lib/utils";
import { StageIllustration } from "@shared/ui/stage-illustration";
import { PortalTooltip } from "@shared/ui/portal-tooltip";

interface KanbanColumnProps {
  stage?: LeadStage;
  leads?: Lead[];
  stages?: LeadStage[];
  onChangeStage?: (leadId: string, newStageId: string) => void;
  onDeleteLead?: (leadId: string) => void;
  isBulkEditing?: boolean;
  selectedLeadIds?: string[];
  onSelectLead?: (leadId: string, isChecked: boolean) => void;
  onSelectAllLeadsInStage?: (stageId: string, isSelectAll: boolean) => void;
  isAddStageColumn?: boolean;
  onAddStage?: (stageLabel?: string) => void;
  onUpdateStages?: (stages: LeadStage[]) => void;
  isAllClusters?: boolean;
}

export function KanbanColumn({
  stage,
  leads = [],
  stages = [],
  onChangeStage = () => {},
  onDeleteLead = () => {},
  isBulkEditing = false,
  selectedLeadIds = [],
  onSelectLead = () => {},
  onSelectAllLeadsInStage = () => {},
  isAddStageColumn = false,
  onAddStage = () => {},
  onUpdateStages = () => {},
  isAllClusters = false,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [stageName, setStageName] = React.useState("");

  if (isAddStageColumn) {
    if (isCreating) {
      const handleSave = () => {
        const trimmed = stageName.trim();
        if (trimmed) {
          onAddStage(trimmed);
        }
        setIsCreating(false);
        setStageName("");
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleSave();
        } else if (e.key === "Escape") {
          setIsCreating(false);
          setStageName("");
        }
      };

      return (
        <div className="w-80 bg-base-100 border border-base-content/5 rounded-lg p-4 flex flex-col gap-4 h-full shadow-sm shrink-0 transition-all duration-300">
          {/* Column Header với Input đặt tên */}
          <div className="flex justify-between items-center pb-2 border-b border-base-content/5 w-full">
            <div className="relative flex-1 flex items-center justify-between border border-primary/50 focus-within:border-primary rounded-md px-3 py-1.5 bg-base-100 shadow-3xs transition-colors">
              <input
                type="text"
                placeholder="Nhập tên giai đoạn"
                maxLength={50}
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                autoFocus
                className="text-sm text-base-content bg-transparent focus:outline-hidden flex-1 pr-10 w-full font-brand"
              />
              <span className="text-2xs text-base-content/40 absolute right-3 pointer-events-none font-mono">
                {stageName.length}/50
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-80 bg-base-100 border border-base-content/5 shadow-sm rounded-lg p-6 flex flex-col justify-center items-center h-full shrink-0 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        {/* Hình minh họa các block */}
        <div className="w-24 h-24 mb-6 flex items-center justify-center">
          <StageIllustration variant="add-stage" size={72} className="text-base-content/30" />
        </div>
        
        <h3 className="text-sm font-bold text-base-content mb-2 font-brand">Thêm giai đoạn tùy chỉnh</h3>
        <p className="text-xs leading-relaxed max-w-[220px] text-base-content/50 mb-6 font-medium">
          Bạn có thể tạo giai đoạn tùy chỉnh để theo dõi kết quả quan trọng trước khi chuyển đổi.
        </p>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn btn-primary rounded-md shadow-sm cursor-pointer transition-all active:scale-95 px-5"
        >
          Thêm giai đoạn tùy chỉnh
        </button>
      </div>
    );
  }

  if (!stage) {
    return null;
  }

  const DEFAULT_STAGE_IDS = ["new", "qualified", "converted", "unqualified", "lost"];
  const isDefaultStage = DEFAULT_STAGE_IDS.includes(stage.id);

  const [isTooltipActive, setIsTooltipActive] = React.useState(false);
  const infoIconRef = React.useRef<HTMLDivElement>(null);

  const [isEditingHeader, setIsEditingHeader] = React.useState(false);
  const [headerName, setHeaderName] = React.useState(stage.label);

  React.useEffect(() => {
    if (stage) {
      setHeaderName(stage.label);
    }
  }, [stage?.label]);

  const handleEditStageName = () => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setHeaderName(stage.label);
    setIsEditingHeader(true);
  };

  const handleDeleteStage = () => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa giai đoạn "${stage.label}"? Tất cả khách hàng trong giai đoạn này sẽ được chuyển về giai đoạn đầu tiên.`
      )
    ) {
      const updatedStages = stages.filter((s) => s.id !== stage.id);
      onUpdateStages(updatedStages);

      const firstStageId = updatedStages[0]?.id || "new";
      leads.forEach((lead) => {
        onChangeStage(lead.id, firstStageId);
      });
    }
  };

  // Kéo đè lên cột
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = () => {
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Thả card vào cột
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) {
      onChangeStage(leadId, stage.id);
    }
  };

  const getTooltipContent = (stageId: string) => {
    switch (stageId) {
      case "new":
        return (
            <p className="text-xs text-base-content/70 leading-relaxed font-medium">
              Khách hàng tiềm năng có thể mới tìm được hoặc gần đây đã tương tác với Trang của bạn. Họ vẫn cần được đánh giá để xác định xem có đủ điều kiện là khách hàng tiềm năng phù hợp cho doanh nghiệp của bạn không.
            </p>
        );
      case "qualified":
        return (
            <p className="text-xs text-base-content/70 leading-relaxed font-medium">
              Khách hàng tiềm năng thực sự quan tâm đến sản phẩm hoặc dịch vụ của bạn và có khả năng phù hợp với doanh nghiệp của bạn.
            </p>
        );
      case "converted":
        return (
            <p className="text-xs text-base-content/70 leading-relaxed font-medium">
              Khách hàng tiềm năng đã đồng ý mua hàng hoặc giao dịch với doanh nghiệp của bạn. Ví dụ: khách hàng tiềm năng đã đặt cọc cho sản phẩm hoặc hẹn lịch sử dụng dịch vụ.
            </p>
        );
      case "lost":
        return (
            <p className="text-xs text-base-content/70 leading-relaxed font-medium">
              Khách hàng tiềm năng đã kết thúc cuộc trò chuyện với bạn. Bạn có thể thu hút lại hoặc lưu thông tin của họ cho chiến dịch nhắm mục tiêu lại trong tương lai.
            </p>
        );
      case "unqualified":
        return (
            <p className="text-xs text-base-content/70 leading-relaxed font-medium">
              Khách hàng tiềm năng không phù hợp với doanh nghiệp của bạn. Ví dụ: họ không ở vị trí thuận tiện hoặc ngân sách của họ quá thấp.
            </p>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "w-80 bg-base-100 border border-base-content/5 rounded-lg p-4 flex flex-col gap-4 h-full shadow-sm shrink-0 transition-all duration-300",
        isDragOver && "border-primary bg-primary/5 scale-[1.01] shadow-md",
      )}
    >
      {/* Column Header */}
      <div className="flex justify-between items-center pb-2 border-b border-base-content/5">
        <div className="flex items-center gap-1.5 text-sm md:text-base font-bold text-base-content relative flex-1 mr-2 min-w-0">
          {isEditingHeader ? (
            <input
              type="text"
              maxLength={50}
              value={headerName}
              onChange={(e) => setHeaderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const trimmed = headerName.trim();
                  if (trimmed && trimmed !== stage.label) {
                    const updatedStages = stages.map((s) =>
                      s.id === stage.id ? { ...s, label: trimmed } : s
                    );
                    onUpdateStages(updatedStages);
                  }
                  setIsEditingHeader(false);
                } else if (e.key === "Escape") {
                  setIsEditingHeader(false);
                }
              }}
              onBlur={() => {
                const trimmed = headerName.trim();
                if (trimmed && trimmed !== stage.label) {
                  const updatedStages = stages.map((s) =>
                    s.id === stage.id ? { ...s, label: trimmed } : s
                  );
                  onUpdateStages(updatedStages);
                }
                setIsEditingHeader(false);
              }}
              autoFocus
              className="bg-transparent border-b border-primary/60 focus:border-primary focus:outline-hidden font-bold text-sm md:text-base text-base-content py-0.5 w-full pr-2 font-brand"
            />
          ) : (
            <>
              <span>{stage.label}</span>

              {/* Tooltip Info Icon (chỉ hiển thị cho giai đoạn mặc định) */}
              {isDefaultStage && (
                <div 
                  ref={infoIconRef}
                  onMouseEnter={() => setIsTooltipActive(true)}
                  onMouseLeave={() => setIsTooltipActive(false)}
                  className="flex items-center justify-center shrink-0 ml-1 cursor-pointer"
                >
                  <Info
                    size={13}
                    className="text-base-content/40 hover:text-base-content/75 transition-colors shrink-0"
                  />
                  <PortalTooltip active={isTooltipActive} anchorRef={infoIconRef}>
                    {getTooltipContent(stage.id)}
                  </PortalTooltip>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Badge số lượng dạng tròn xám nhẹ */}
          <span className="badge badge-soft badge-sm">
            {leads.length}
          </span>

          {isBulkEditing ? (
            leads.length > 0 && (
              <button
                onClick={() => {
                  const allSelectedInStage = leads.every((l) =>
                    selectedLeadIds.includes(l.id),
                  );
                  onSelectAllLeadsInStage(stage.id, !allSelectedInStage);
                }}
                className="text-2xs font-bold text-primary hover:underline transition-all shrink-0 cursor-pointer select-none font-brand"
              >
                {leads.every((l) => selectedLeadIds.includes(l.id))
                  ? "Bỏ chọn"
                  : "Chọn tất cả"}
              </button>
            )
          ) : (
            <div className={cn("dropdown dropdown-end", isDefaultStage && "dropdown-hover")}>
              <div
                tabIndex={0}
                role="button"
                className="btn btn-xs btn-ghost btn-square rounded-lg text-base-content/50 hover:text-base-content/80 hover:bg-base-200 cursor-pointer flex items-center justify-center"
              >
                <MoreHorizontal size={14} />
              </div>
              {isDefaultStage ? (
                <div
                  tabIndex={0}
                  className="dropdown-content bg-base-100 border border-base-content/10 rounded-md z-50 w-56 p-3 shadow-md mt-1 text-xs text-base-content/80 font-medium leading-relaxed pointer-events-none"
                >
                  Không thể đổi tên, xóa và di chuyển các giai đoạn mặc định
                </div>
              ) : (
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 border border-base-content/10 rounded-md z-50 w-56 p-1.5 drop-shadow-sm mt-1"
                >
                  <li>
                    <button
                      onClick={handleEditStageName}
                      className="text-xs font-semibold text-base-content hover:bg-soft py-2 rounded-md cursor-pointer"
                    >
                      Chỉnh sửa tên giai đoạn
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleDeleteStage}
                      className="text-xs font-semibold text-error hover:bg-error/10 py-2 rounded-md cursor-pointer"
                    >
                      Xóa giai đoạn
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lead Cards List */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar pr-0.5 min-h-[150px]">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stages={stages}
              onChangeStage={onChangeStage}
              onDeleteLead={onDeleteLead}
              isBulkEditing={isBulkEditing}
              isSelected={selectedLeadIds.includes(lead.id)}
              onSelect={(checked) => onSelectLead(lead.id, checked)}
              isAllClusters={isAllClusters}
            />
          ))
        ) : (
          /* Trạng thái rỗng */
          <div className="flex-1 flex flex-col items-center justify-center p-5 text-center text-base-content/40 gap-4 mt-8">
            {/* SVG minh họa Đủ tiêu chuẩn */}
            {stage.id === "qualified" && (
              <div className="relative w-20 h-20 flex items-center justify-center text-primary">
                <StageIllustration variant="qualified" size={72} />
              </div>
            )}

            {/* SVG minh họa Đã chuyển đổi */}
            {stage.id === "converted" && (
              <div className="relative w-20 h-20 flex items-center justify-center text-primary">
                <StageIllustration variant="converted" size={72} />
              </div>
            )}

            {/* SVG minh họa các stage custom trống */}
            {stage.id !== "qualified" && stage.id !== "converted" && (
              <div className="relative w-16 h-16 flex items-center justify-center`">
                 <StageIllustration variant="qualified" size={72} />
              </div>
            )}

            <div className="text-sm font-bold text-base-content font-brand leading-snug">
              <span className="block text-nowrap">Không có khách hàng tiềm năng </span>{stage.label} nào
            </div>

            <p className="text-xs text-pretty leading-relaxed max-w-[200px] text-base-content/50 font-medium -mt-2">
              {stage.id === "qualified" &&
                "Chuyển khách hàng tiềm năng sang giai đoạn này nếu họ thực sự quan tâm đến sản phẩm hoặc dịch vụ."}
              {stage.id === "converted" &&
                "Chuyển khách hàng tiềm năng sang giai đoạn này nếu họ đã thỏa thuận hoặc giao dịch với doanh nghiệp của bạn."}
              {stage.id !== "qualified" &&
                stage.id !== "converted" &&
                "Kéo thả hoặc cập nhật giai đoạn của khách hàng tiềm năng để bắt đầu theo dõi."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
