import { Icon, MessengerIcon, RangeSelector, AccountAvatar } from "@shared/ui";
import { cn } from "@shared/lib";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Lead, LeadStage } from "../types";
import { useInboxStore } from "@features/inbox/store/inbox.store";

// Badge icon hiển thị đè lên avatar — static map để Tailwind compile đúng class
const PLATFORM_BADGE: Record<string, { icon: React.ReactNode; colorClass: string }> = {
  messenger: {
    icon: <MessengerIcon />,
    colorClass: "text-messenger",
  },
  instagram: {
    icon: <Icon name="instagram-filled" size={10} />,
    colorClass: "text-instagram",
  },
  facebook: {
    icon: <Icon name="facebook" size={10} />,
    colorClass: "text-facebook",
  },
  tiktok: {
    icon: <Icon name="tiktok" size={10} />,
    colorClass: "text-tiktok dark:text-base-content",
  },
};

interface LeadRowProps {
  lead: Lead;
  stages: LeadStage[];
  isSelected: boolean;
  onSelectLead: (leadId: string, isChecked: boolean) => void;
  onChangeStage: (leadId: string, newStageId: string) => void;
}

export function LeadRow({ lead, stages, isSelected, onSelectLead, onChangeStage }: LeadRowProps) {
  const currentStageLabel = stages.find((s) => s.id === lead.stage)?.label ?? lead.stage;

  const { accountGroups } = useInboxStore();
  const account = React.useMemo(() => {
    if (!lead.accountId) return null;
    for (const group of accountGroups) {
      const found = group.members.find((m) => m.id === lead.accountId);
      if (found) return found;
    }
    return null;
  }, [accountGroups, lead.accountId]);

  // Phân chia stages theo nhóm logic
  const topStage = stages.find((s) => s.id === "new");
  const bottomStage = stages.find((s) => s.id === "converted");
  const middleStages = stages.filter(
    (s) => s.id !== "new" && s.id !== "converted" && s.id !== "unqualified" && s.id !== "lost"
  );
  const doneStages = stages.filter((s) => s.id === "unqualified" || s.id === "lost");

  const renderStageItem = (stage: LeadStage) => {
    const isCurrentStage = stage.id === lead.stage;
    return (
      <button
        key={stage.id}
        onClick={() => onChangeStage(lead.id, stage.id)}
        className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-base-content hover:bg-base-100 rounded-md cursor-pointer w-full text-left transition-colors"
      >
        <input
          type="radio"
          name={`stage_lead_${lead.id}`}
          checked={isCurrentStage}
          readOnly
          className="radio radio-xs radio-primary cursor-pointer shrink-0"
        />
        <span className={isCurrentStage ? "font-semibold text-primary" : ""}>
          {stage.label}
        </span>
      </button>
    );
  };

  const Divider = () => <div className="h-px bg-base-content/10 my-1 mx-2" />;

  return (
    <tr className="hover:bg-base-200/20 transition-colors text-xs text-base-content/85">
      {/* Checkbox */}
      <td className="pl-3 py-2.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectLead(lead.id, e.target.checked)}
          className="checkbox checkbox-xs checkbox-primary rounded-sm cursor-pointer"
        />
      </td>

      {/* Ngày thêm */}
      <td className="py-2.5 px-3 text-base-content/55 tabular-nums">
        {(() => {
          if (!lead.fullDate) return lead.date;
          const parts = lead.fullDate.split("/");
          if (parts.length >= 2) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            return `${day} Tháng ${month}`;
          }
          return lead.fullDate;
        })()}
      </td>

      {/* Tên & Avatar với badge platform */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
          <AccountAvatar
            avatarUrl={lead.avatar || undefined}
            name={lead.name}
            platform={lead.platform || ""}
            size="sm"
            showPlatformIcon={!!lead.platform}
          />

          <span className="font-semibold text-base-content hover:text-primary cursor-pointer transition-colors">
            {lead.name}
          </span>
        </div>
      </td>

      {/* Dropdown Giai đoạn */}
      <td className="py-2.5 px-3">
        <RangeSelector
          menuAlign="left"
          menuMinWidth="w-44"
          dropdownClassName="rounded-lg"
          customTrigger={
            <button className="btn btn-soft rounded-sm btn-xs opacity-80">
              <span>{currentStageLabel}</span>
              <ChevronDown size={11} className="opacity-50 shrink-0" />
            </button>
          }
        >
          <div className="flex flex-col gap-0.5 w-full">
            {topStage && renderStageItem(topStage)}

            {topStage && (middleStages.length > 0 || bottomStage) && <Divider />}

            {middleStages.map((stage) => renderStageItem(stage))}
            {bottomStage && renderStageItem(bottomStage)}

            {doneStages.length > 0 && <Divider />}

            {doneStages.map((stage) => renderStageItem(stage))}
          </div>
        </RangeSelector>
      </td>

      {/* Nguồn (tài khoản) */}
      <td className="py-2.5 px-3 text-base-content/60">
        {account ? `${account.name}` : `${lead.source || "Hai Minh platform"}`}
      </td>

      {/* Nhãn */}
      <td className="py-2.5 px-3">
        <div className="flex flex-wrap gap-1 flex-1">
          {lead.tags && lead.tags.length > 0 ? (
            lead.tags.map((tagStr) => {
              const [name, color] = tagStr.split("::");
              const tagColor = color || "#6366f1";
              return (
                <span
                  key={tagStr}
                  className="badge badge-sm px-1.5 py-0.5 rounded border transition-all duration-300"
                  style={{
                    backgroundColor: `${tagColor}15`,
                    color: tagColor,
                    borderColor: `${tagColor}30`,
                  }}
                >
                  {name}
                </span>
              );
            })
          ) : (
            <span className="text-base-content/30 text-2xs italic">Không có nhãn</span>
          )}
        </div>
      </td>
    </tr>
  );
}
