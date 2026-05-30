import React from "react";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Lead } from "./types";

interface LeadsStatsProps {
  leads: Lead[];
  selectedGroupId?: string | null;
  dateFilter?: string;
}

export function LeadsStats({ leads, selectedGroupId, dateFilter }: LeadsStatsProps) {
  const router = useRouter();
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter((l) => l.stage === "new").length;
  const convertedLeadsCount = leads.filter(
    (l) => l.stage === "converted",
  ).length;

  // Tính tỷ lệ chuyển đổi
  const conversionRate =
    totalLeads > 0
      ? ((convertedLeadsCount / totalLeads) * 100).toFixed(0) + "%"
      : "--";

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
        <div className="flex items-center gap-2">
          <span className="opacity-80 font-semibold">
            Số khách hàng tiềm năng ở giai đoạn tiếp nhận:
          </span>
          <span className="font-bold text-primary text-sm">
            {newLeadsCount}
          </span>
          <div className="relative group/tooltip flex items-center justify-center">
            <Info
              size={13}
              className="text-info/80 cursor-pointer shrink-0"
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-base-100 text-base-content/85 text-2xs leading-relaxed rounded-xl border border-base-200 dark:border-base-800 shadow-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-300 z-50 text-center font-semibold">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-base-100 border-b border-r border-base-200 dark:border-base-800 rotate-45" />
              Khách hàng mới tiếp cận và đang chờ xử lý liên hệ.
            </div>
          </div>
        </div>

        {/* Dấu gạch dọc phân cách */}
        <div className="h-4 w-[1.5px] bg-sky-200 dark:bg-info hidden md:block" />

        {/* Chỉ số 2: Đã chuyển đổi */}
        <div className="flex items-center gap-2">
          <span className="opacity-80 font-semibold">
            Số khách hàng tiềm năng đã chuyển đổi:
          </span>
          <span className="font-bold text-success text-sm">
            {convertedLeadsCount > 0 ? convertedLeadsCount : "--"}
          </span>
          <div className="relative group/tooltip flex items-center justify-center">
            <Info
              size={13}
              className="text-info/80 cursor-pointer shrink-0"
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-base-100 text-base-content/85 text-2xs leading-relaxed rounded-xl border border-base-200 dark:border-base-800 shadow-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-300 z-50 text-center font-semibold">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-base-100 border-b border-r border-base-200 dark:border-base-800 rotate-45" />
              Khách hàng đã chốt hợp đồng hoặc mua hàng thành công.
            </div>
          </div>
        </div>

        {/* Dấu gạch dọc phân cách */}
        <div className="h-4 w-[1.5px] bg-sky-200 dark:bg-info hidden md:block" />

        {/* Chỉ số 3: Tỷ lệ chuyển đổi */}
        <div className="flex items-center gap-2">
          <span className="opacity-80 font-semibold">Tỷ lệ chuyển đổi:</span>
          <span className="font-bold text-secondary text-sm">
            {conversionRate}
          </span>
          <div className="relative group/tooltip flex items-center justify-center">
            <Info
              size={13}
              className="text-info/80 cursor-pointer shrink-0"
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-base-100 text-base-content/85 text-2xs leading-relaxed rounded-xl border border-base-200 dark:border-base-800 shadow-md opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-300 z-50 text-center font-semibold">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-base-100 border-b border-r border-base-200 dark:border-base-800 rotate-45" />
              Tỷ lệ phần trăm khách hàng đã chốt đơn thành công trên tổng data.
            </div>
          </div>
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
