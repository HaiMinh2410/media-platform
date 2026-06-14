import React, { useRef, useState } from "react";
import { cn } from "@shared/lib";
import { PortalTooltip, RangeSelector } from "@shared/ui";

type XungHoAndStageSectionProps = {
  gender: string | null;
  onUpdateGender: (gender: string | null) => void;
  profile: any;
  stageConfig: any;
};

export function XungHoAndStageSection({
  gender,
  onUpdateGender,
  profile,
  stageConfig,
}: XungHoAndStageSectionProps) {
  const genderRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [showGenderTooltip, setShowGenderTooltip] = useState(false);
  const [showStageTooltip, setShowStageTooltip] = useState(false);

  return (
    <>
      <div className="space-y-2.5">
        {/* Gender Card */}
        <div className="flex items-center gap-2">
          <span
            ref={genderRef}
            onMouseEnter={() => setShowGenderTooltip(true)}
            onMouseLeave={() => setShowGenderTooltip(false)}
            className="text-sm whitespace-nowrap text-base-content/60 flex items-center gap-1 cursor-help hover:text-base-content/70 transition-colors select-none"
          >
            Xưng hô:
          </span>
          <RangeSelector
            size="xs"
            value={gender || "Chưa rõ"}
            onChange={(val) => onUpdateGender(val === "Chưa rõ" ? null : val)}
            options={[
              { id: "Nam", label: "Nam (Anh)", iconColorClass: "text-info" },
              { id: "Nữ", label: "Nữ (Chị)", iconColorClass: "text-secondary" },
              {
                id: "Chưa rõ",
                label: "Chưa xác định",
                iconColorClass: "text-base-content/60",
              },
            ]}
            hideIcon
            menuAlign="left"
            className="flex-1"
            triggerClassName="rounded-md border-none text-sm font-medium"
          />
        </div>

        {/* Stage Card */}
        <div className="flex items-center gap-2 relative">
          <span className="text-sm text-base-content/60 select-none">
            Giai đoạn (Stage):
          </span>
          {profile && stageConfig ? (
            <div
              ref={stageRef}
              onMouseEnter={() => setShowStageTooltip(true)}
              onMouseLeave={() => setShowStageTooltip(false)}
              className={cn(
                "text-sm font-bold bg-transparent!  cursor-help",
                stageConfig.styleClass,
              )}
            >
              {stageConfig.label}
            </div>
          ) : (
            <div className="text-xs font-bold text-base-content/60 px-2 py-1 rounded-lg border border-base-content/5 text-center">
              G1 - Kết nối
            </div>
          )}
        </div>

        {profile && stageConfig && (
          <p className="text-sm text-base-content leading-relaxed">
            <strong className="text-base-content/60 select-none">
              Mục tiêu Stage:
            </strong>{" "}
            {stageConfig.targetGoal}
          </p>
        )}
      </div>

      {showGenderTooltip && (
        <PortalTooltip
          active={showGenderTooltip}
          anchorRef={genderRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <span className="text-sm font-bold text-primary">
              Xưng hô hội thoại (Gender Pronoun):
            </span>
            <p className="text-sm text-base-content/85 leading-normal">
              Cách xưng hô hiện tại (Anh/Chị/Bạn) dùng để AI sinh câu trả lời tự
              nhiên. Hệ thống tự động thay đổi xưng hô tương ứng khi phát hiện
              Fan chủ động tự xưng.
            </p>
          </div>
        </PortalTooltip>
      )}

      {showStageTooltip && (
        <PortalTooltip
          active={showStageTooltip}
          anchorRef={stageRef}
          position="top"
          align="center"
          showArrow
          className="w-72"
        >
          <div className="flex flex-col gap-1 text-base-content">
            <div className="text-xs text-base-content/85 leading-normal flex flex-col gap-0.5">
              {(!profile?.stage || profile.stage === "G1") && (
                <span>
                  <strong>G1 - Kết nối:</strong> ≤ 10 ngày tương tác. Xây dựng
                  lòng tin.
                </span>
              )}
              {profile?.stage === "G2" && (
                <span>
                  <strong>G2 - Làm ấm:</strong> 11 - 15 ngày tương tác (hoặc
                  thăng cấp sớm từ G1 nếu thiện cảm ≥ 85%).
                </span>
              )}
              {profile?.stage === "G3" && (
                <span>
                  <strong>G3 - Chốt đơn:</strong> &gt; 15 ngày tương tác (hoặc
                  thăng cấp sớm từ G2 nếu thiện cảm ≥ 80%).
                </span>
              )}
            </div>
          </div>
        </PortalTooltip>
      )}
    </>
  );
}
