import { Lead } from "@features/leads/types";

/**
 * Helper function dùng chung để tính toán sự biến động (Delta %) của tỷ lệ chuyển đổi
 * giữa kỳ hiện tại và kỳ trước.
 */
export function calculateLeadsDelta(
  leads: Lead[],
  allLeads: Lead[],
  dateFilter: string,
  rawConversionRate: number
) {
  if (!allLeads || allLeads.length === 0) {
    return {
      conversionRateDelta: 0,
      conversionRateDirection: "flat" as const,
    };
  }

  const parseDateStr = (dStr: string) => {
    const parts = dStr.split("/");
    return new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
  };

  const currentAccountIds = Array.from(new Set(leads.map((l) => l.accountId)));

  const previousLeads = allLeads.filter((lead) => {
    const matchesCluster = currentAccountIds.length > 0
      ? currentAccountIds.includes(lead.accountId)
      : true;

    if (!matchesCluster) return false;

    const leadDateObj = lead.fullDate ? parseDateStr(lead.fullDate) : new Date();
    leadDateObj.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const referenceToday = now.getFullYear() >= 2026 ? now : new Date(2026, 4, 28);

    let matchesPrevDate = false;

    if (dateFilter === "Hôm nay") {
      const yesterday = new Date(referenceToday);
      yesterday.setDate(referenceToday.getDate() - 1);
      const formattedYesterday = yesterday.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      matchesPrevDate = lead.fullDate === formattedYesterday;
    } else if (dateFilter === "Hôm qua") {
      const dayBeforeYesterday = new Date(referenceToday);
      dayBeforeYesterday.setDate(referenceToday.getDate() - 2);
      const formattedDbY = dayBeforeYesterday.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      matchesPrevDate = lead.fullDate === formattedDbY;
    } else if (dateFilter === "7 ngày qua") {
      const startCurrent = new Date(referenceToday);
      startCurrent.setDate(referenceToday.getDate() - 7);
      
      const startPrev = new Date(referenceToday);
      startPrev.setDate(referenceToday.getDate() - 14);
      
      matchesPrevDate = leadDateObj >= startPrev && leadDateObj < startCurrent;
    } else if (dateFilter === "14 ngày qua") {
      const startCurrent = new Date(referenceToday);
      startCurrent.setDate(referenceToday.getDate() - 14);
      
      const startPrev = new Date(referenceToday);
      startPrev.setDate(referenceToday.getDate() - 28);
      
      matchesPrevDate = leadDateObj >= startPrev && leadDateObj < startCurrent;
    } else if (dateFilter === "30 ngày qua") {
      const startCurrent = new Date(referenceToday);
      startCurrent.setDate(referenceToday.getDate() - 30);
      
      const startPrev = new Date(referenceToday);
      startPrev.setDate(referenceToday.getDate() - 60);
      
      matchesPrevDate = leadDateObj >= startPrev && leadDateObj < startCurrent;
    } else if (dateFilter === "Tháng này") {
      const prevMonth = referenceToday.getMonth() - 1;
      const prevYear =
        prevMonth < 0
          ? referenceToday.getFullYear() - 1
          : referenceToday.getFullYear();
      const normalizedPrevMonth = prevMonth < 0 ? 11 : prevMonth;
      
      matchesPrevDate =
        leadDateObj.getMonth() === normalizedPrevMonth &&
        leadDateObj.getFullYear() === prevYear;
    } else if (dateFilter.includes(" - ")) {
      const parts = dateFilter.split(" - ");
      const startDate = parseDateStr(parts[0]);
      startDate.setHours(0, 0, 0, 0);

      const endDate = parseDateStr(parts[1]);
      endDate.setHours(23, 59, 59, 999);

      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - diffDays);

      matchesPrevDate = leadDateObj >= prevStartDate && leadDateObj < startDate;
    } else {
      const targetDate = parseDateStr(dateFilter);
      const prevDate = new Date(targetDate);
      prevDate.setDate(targetDate.getDate() - 1);
      const formattedPrevDate = prevDate.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      matchesPrevDate = lead.fullDate === formattedPrevDate;
    }

    return matchesPrevDate;
  });

  const prevTotalLeads = previousLeads.length;
  const prevConvertedLeadsCount = previousLeads.filter(
    (l) => l.stage === "converted",
  ).length;

  const prevRawConversionRate =
    prevTotalLeads > 0
      ? (prevConvertedLeadsCount / prevTotalLeads) * 100
      : 0;

  // Tính Delta % cho Tỷ lệ chuyển đổi
  let conversionRateDelta = 0;
  let conversionRateDirection: "up" | "down" | "flat" = "flat";

  if (prevRawConversionRate === 0) {
    if (rawConversionRate > 0) {
      conversionRateDelta = 100;
      conversionRateDirection = "up";
    } else {
      conversionRateDelta = 0;
      conversionRateDirection = "flat";
    }
  } else {
    const diff = rawConversionRate - prevRawConversionRate;
    conversionRateDelta = Math.abs(
      Math.round((diff / prevRawConversionRate) * 100),
    );
    conversionRateDirection = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  }

  return { conversionRateDelta, conversionRateDirection };
}
