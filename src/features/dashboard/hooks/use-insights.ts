import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useInboxStore } from "@features/inbox/store/inbox.store";
import { getLeadsFromDB } from "../actions/dashboard.actions";
import { Lead } from "@features/leads/types";
import { calculateLeadsDelta } from "../utils/leads-insights-utils";

export function useInsights(workspaceId: string) {
  const [activeSidebar, setActiveSidebar] = useState("leads");
  const [selectedPlatform, setSelectedPlatform] = useState("Facebook");
  const { accountGroups } = useInboxStore();
  const searchParams = useSearchParams();

  const urlGroupId = searchParams.get("groupId");
  const urlDate = searchParams.get("date");

  // Quản lý cụm tài khoản hiện tại được lọc
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    urlGroupId || null,
  );
  const onChangeGroup = (id: string | null) => setSelectedGroupId(id);

  // Danh sách leads thực tế tải từ DB
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc ngày
  const [filters, setFilters] = useState({
    stage: "all",
    campaign: "all",
    form: "all",
    date: urlDate || "all",
  });
  const onFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Đồng bộ hóa với URL search params khi có thay đổi (VD: khi click Xem tất cả từ LeadsStats)
  useEffect(() => {
    if (urlGroupId) {
      setSelectedGroupId(urlGroupId);
    }
    if (urlDate) {
      setFilters((prev) => ({ ...prev, date: urlDate }));
    }
  }, [urlGroupId, urlDate]);

  // Tải leads từ DB
  useEffect(() => {
    if (workspaceId) {
      setLoading(true);
      getLeadsFromDB(workspaceId)
        .then((dbLeads: Lead[]) => {
          setLeads(dbLeads);
        })
        .catch((err: any) => {
          console.error("Failed to load leads from DB in useInsights:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [workspaceId]);

  // Logic lọc dữ liệu leads (khớp với useLeads)
  const selectedGroup = accountGroups.find((g) => g.id === selectedGroupId);

  const filteredLeads = leads.filter((lead) => {
    // Lọc theo cụm tài khoản
    const matchesCluster = selectedGroup
      ? selectedGroup.members.some((member) => member.id === lead.accountId)
      : true;

    // Lọc theo ngày
    let matchesDate = true;
    if (filters.date !== "all") {
      const parseDate = (dStr: string) => {
        const parts = dStr.split("/");
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
      };

      const leadDateObj = lead.fullDate ? parseDate(lead.fullDate) : new Date();
      leadDateObj.setHours(0, 0, 0, 0);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const referenceToday =
        now.getFullYear() >= 2026 ? now : new Date(2026, 4, 28);

      if (filters.date === "Hôm nay") {
        const formattedToday = referenceToday.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        matchesDate = lead.fullDate === formattedToday;
      } else if (filters.date === "Hôm qua") {
        const yesterday = new Date(referenceToday);
        yesterday.setDate(referenceToday.getDate() - 1);
        const formattedYesterday = yesterday.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        matchesDate = lead.fullDate === formattedYesterday;
      } else if (filters.date === "7 ngày qua") {
        const past7Days = new Date(referenceToday);
        past7Days.setDate(referenceToday.getDate() - 7);
        matchesDate = leadDateObj >= past7Days && leadDateObj <= referenceToday;
      } else if (filters.date === "14 ngày qua") {
        const past14Days = new Date(referenceToday);
        past14Days.setDate(referenceToday.getDate() - 14);
        matchesDate =
          leadDateObj >= past14Days && leadDateObj <= referenceToday;
      } else if (filters.date === "30 ngày qua") {
        const past30Days = new Date(referenceToday);
        past30Days.setDate(referenceToday.getDate() - 30);
        matchesDate =
          leadDateObj >= past30Days && leadDateObj <= referenceToday;
      } else if (filters.date === "Tháng này") {
        matchesDate =
          leadDateObj.getMonth() === referenceToday.getMonth() &&
          leadDateObj.getFullYear() === referenceToday.getFullYear();
      } else if (filters.date.includes(" - ")) {
        // Lọc theo khoảng ngày tùy chỉnh từ Lịch đôi (ví dụ: "20/05/2026 - 28/05/2026")
        const parts = filters.date.split(" - ");
        const startParts = parts[0].split("/");
        const endParts = parts[1].split("/");

        const startDate = new Date(
          parseInt(startParts[2]),
          parseInt(startParts[1]) - 1,
          parseInt(startParts[0]),
        );
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(
          parseInt(endParts[2]),
          parseInt(endParts[1]) - 1,
          parseInt(endParts[0]),
        );
        endDate.setHours(23, 59, 59, 999);

        matchesDate = leadDateObj >= startDate && leadDateObj <= endDate;
      } else {
        matchesDate = lead.fullDate === filters.date;
      }
    }

    return matchesCluster && matchesDate;
  });

  // Tính toán các chỉ số kinh doanh động dựa trên filteredLeads
  const totalLeadsCount = filteredLeads.length;
  const newLeadsCount = filteredLeads.filter((l) => l.stage === "new").length;
  const convertedLeadsCount = filteredLeads.filter(
    (l) => l.stage === "converted",
  ).length;
  const unqualifiedLeadsCount = filteredLeads.filter(
    (l) => l.stage === "unqualified",
  ).length;
  const lostLeadsCount = filteredLeads.filter((l) => l.stage === "lost").length;

  const processingLeadsCount = filteredLeads.filter(
    (l) => !["new", "converted", "unqualified", "lost"].includes(l.stage),
  ).length;

  // Tỷ lệ chuyển đổi = (Số leads đã chuyển đổi / Tổng số leads) * 100 (Mô hình phễu)
  const rawConversionRate =
    filteredLeads.length > 0
      ? (convertedLeadsCount / filteredLeads.length) * 100
      : 0;

  // Format tỷ lệ chuyển đổi thành string (ví dụ: "28.6") với tiếng Việt dùng dấu phẩy cho thập phân
  const conversionRate = rawConversionRate.toFixed(1).replace(".", ",");

  // Tính Delta % cho Tỷ lệ chuyển đổi bằng helper dùng chung
  const { conversionRateDelta, conversionRateDirection } = calculateLeadsDelta(
    filteredLeads,
    leads,
    filters.date,
    rawConversionRate
  );

  // Tính thời gian chuyển đổi trung bình thực tế từ Database (createdAt và convertedAt)
  const convertedLeads = filteredLeads.filter(
    (l) => l.stage === "converted" && l.createdAt && l.convertedAt
  );
  let avgConversionTimeDays = "0,1";

  if (convertedLeads.length > 0) {
    const totalDiffMs = convertedLeads.reduce((acc, l) => {
      const created = new Date(l.createdAt!);
      const converted = new Date(l.convertedAt!);
      return acc + (converted.getTime() - created.getTime());
    }, 0);
    const avgMs = totalDiffMs / convertedLeads.length;
    // Chuyển đổi mili-giây sang ngày: 1 ngày = 24 * 60 * 60 * 1000 ms
    const avgDays = avgMs / 86400000;
    // Hiển thị tối thiểu là 0,1 ngày để tránh 0,0 ngày
    const displayDays = Math.max(0.1, avgDays);
    avgConversionTimeDays = displayDays.toFixed(1).replace(".", ",");
  } else {
    avgConversionTimeDays = "--";
  }

  // Dữ liệu thực tế cho biểu đồ Recharts theo mô hình phễu (Funnel Model)
  const chartData = [
    { name: "Tiếp nhận", value: totalLeadsCount },
    { name: "Đủ tiêu chuẩn", value: processingLeadsCount + convertedLeadsCount },
    { name: "Đã chuyển đổi", value: convertedLeadsCount },
  ];

  const displayedTags: any[] = [];
  const selectedTags: any[] = [];
  const tagButtonText = "Nhãn";
  const handleTagClick = () => {};
  const parseTag = (tag: string) => ({ name: tag, color: "gray" });

  const viewMode = "kanban";
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreContainerRef = React.useRef<HTMLDivElement>(null);

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const onToggleUnreadOnly = () => setShowUnreadOnly(!showUnreadOnly);

  const [showLost, setShowLost] = useState(false);
  const onToggleLost = () => setShowLost(!showLost);

  const [showUnqualified, setShowUnqualified] = useState(false);
  const onToggleUnqualified = () => setShowUnqualified(!showUnqualified);

  return {
    activeSidebar,
    setActiveSidebar,
    selectedPlatform,
    setSelectedPlatform,
    selectedGroupId,
    onChangeGroup,
    filters,
    onFilterChange,
    displayedTags,
    selectedTags,
    tagButtonText,
    handleTagClick,
    parseTag,
    viewMode,
    isMoreOpen,
    setIsMoreOpen,
    moreContainerRef,
    showUnreadOnly,
    onToggleUnreadOnly,
    showLost,
    onToggleLost,
    showUnqualified,
    onToggleUnqualified,
    // Trả về các chỉ số động bổ sung
    loading,
    totalLeadsCount,
    newLeadsCount,
    convertedLeadsCount,
    unqualifiedLeadsCount,
    lostLeadsCount,
    conversionRate,
    chartData,
    conversionRateDelta,
    conversionRateDirection,
    avgConversionTimeDays,
  };
}
