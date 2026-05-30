import { PortalTooltip } from "@shared/ui";
import { cn } from "@shared/lib";

import React, { useRef, useState } from "react";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lead } from "./types";
import { calculateLeadsDelta } from "@features/dashboard/components/insights/leads-insights-utils";

interface LeadsStatsProps {
  leads: Lead[];
  allLeads?: Lead[];
  selectedGroupId?: string | null;
  dateFilter?: string;
}

export function LeadsStats({
  leads,
  allLeads = [],
  selectedGroupId,
  dateFilter = "all",
}: LeadsStatsProps) {
  const router = useRouter();

  // Trạng thái active và Refs cho PortalTooltip
  const [isNewLeadsTooltipActive, setIsNewLeadsTooltipActive] = useState(false);
  const newLeadsAnchorRef = useRef<HTMLDivElement>(null);

  const [isConvertedLeadsTooltipActive, setIsConvertedLeadsTooltipActive] = useState(false);
  const convertedLeadsAnchorRef = useRef<HTMLDivElement>(null);

  const [isRateTooltipActive, setIsRateTooltipActive] = useState(false);
  const rateAnchorRef = useRef<HTMLDivElement>(null);

  const newLeadsCount = leads.filter((l) => l.stage === "new").length;
  const convertedLeadsCount = leads.filter(
    (l) => l.stage === "converted",
  ).length;

  // Tính tỷ lệ chuyển đổi theo mô hình phễu: (đã chuyển đổi / tổng tiếp nhận) * 100
  const rawConversionRate =
    leads.length > 0 ? (convertedLeadsCount / leads.length) * 100 : 0;
  const conversionRate =
    rawConversionRate > 0
      ? rawConversionRate.toFixed(1).replace(".", ",") + "%"
      : "--";

  // Tính Delta % cho Tỷ lệ chuyển đổi bằng helper dùng chung
  const { conversionRateDelta, conversionRateDirection } = calculateLeadsDelta(
    leads,
    allLeads,
    dateFilter,
    rawConversionRate
  );

  const handleViewAllClick = () => {
    const params = new URLSearchParams();
    params.set("tab", "insights");
    if (selectedGroupId) {
      params.set("groupId", selectedGroupId);
    }
    if (dateFilter && dateFilter !== "all") {
      params.set("date", dateFilter);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="bg-base-100 border border-base-content/5 rounded-md py-3 px-5 flex flex-col md:flex-row justify-between items-center w-full gap-4 shadow-3xs">
      {/* 3 chỉ số bên trái */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-1 text-xs md:text-sm text-info">
        {/* Chỉ số 1: Tiếp nhận */}
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="opacity-80 font-semibold">
            Số khách hàng tiềm năng ở giai đoạn tiếp nhận:
          </span>
          <span className="font-bold text-primary text-sm">
            {newLeadsCount}
          </span>
          <div
            ref={newLeadsAnchorRef}
            onMouseEnter={() => setIsNewLeadsTooltipActive(true)}
            onMouseLeave={() => setIsNewLeadsTooltipActive(false)}
            className="cursor-pointer shrink-0"
          >
            <Info size={13} className="text-info/80" />
          </div>
          <PortalTooltip
            active={isNewLeadsTooltipActive}
            anchorRef={newLeadsAnchorRef}
            showArrow
            position="top"
            align="right"
            offsetY={6}
            className="text-xs"
          >
            Khách hàng mới tiếp cận và đang chờ xử lý liên hệ.
          </PortalTooltip>
        </div>

        {/* Dấu gạch dọc phân cách */}
        <div className="h-4 w-[1.5px] bg-sky-200 dark:bg-info hidden md:block" />

        {/* Chỉ số 2: Đã chuyển đổi */}
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="opacity-80 font-semibold">
            Số khách hàng tiềm năng đã chuyển đổi:
          </span>
          <span className="font-bold text-success text-sm">
            {convertedLeadsCount > 0 ? convertedLeadsCount : "--"}
          </span>
          <div
            ref={convertedLeadsAnchorRef}
            onMouseEnter={() => setIsConvertedLeadsTooltipActive(true)}
            onMouseLeave={() => setIsConvertedLeadsTooltipActive(false)}
            className="cursor-pointer shrink-0"
          >
            <Info size={13} className="text-info/80" />
          </div>
          <PortalTooltip
            active={isConvertedLeadsTooltipActive}
            anchorRef={convertedLeadsAnchorRef}
            showArrow
            position="top"
            align="right"
            offsetY={6}
            className="text-xs"
          >
            Khách hàng đã chốt hợp đồng hoặc mua hàng thành công.
          </PortalTooltip>
        </div>

        {/* Dấu gạch dọc phân cách */}
        <div className="h-4 w-[1.5px] bg-sky-200 dark:bg-info hidden md:block" />

        {/* Chỉ số 3: Tỷ lệ chuyển đổi */}
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="opacity-80 font-semibold">Tỷ lệ chuyển đổi:</span>
          <span className="font-bold text-secondary text-sm">
            {conversionRate}
          </span>
          {conversionRateDirection !== "flat" && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-bold",
                conversionRateDirection === "up"
                  ? "text-success"
                  : "text-error",
              )}
            >
              <span className="text-md">
                {conversionRateDirection === "up" ? "↑" : "↓"}
              </span>
              <span>{conversionRateDelta}%</span>
            </div>
          )}
          <div
            ref={rateAnchorRef}
            onMouseEnter={() => setIsRateTooltipActive(true)}
            onMouseLeave={() => setIsRateTooltipActive(false)}
            className="cursor-pointer shrink-0"
          >
            <Info size={13} className="text-info/80" />
          </div>
          <PortalTooltip
            active={isRateTooltipActive}
            anchorRef={rateAnchorRef}
            showArrow
            position="top"
            align="right"
            offsetY={6}
            className="text-xs"
          >
            Tỷ lệ phần trăm khách hàng tiềm năng chuyển từ giai đoạn Tiếp nhận sang giai đoạn Đã chuyển đổi ở Trung tâm khách hàng tiềm năng.
          </PortalTooltip>
        </div>
      </div>

      {/* Nút Xem tất cả bên phải */}
      <button
        onClick={handleViewAllClick}
        className="text-info text-xs transition-all shrink-0 hover:underline cursor-pointer"
      >
        Xem tất cả
      </button>
    </div>
  );
}
