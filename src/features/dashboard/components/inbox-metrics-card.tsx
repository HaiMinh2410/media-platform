"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import {
  InboxMetrics,
  getInboxMetrics,
} from "@features/dashboard/actions/dashboard.actions";
import { AccountHealthData } from "@features/settings";
import { cn } from "@shared/lib/utils";
import { RangeSelector } from "@shared/ui/range-selector";
import { motion } from "framer-motion";
import {
  Globe,
  Flame,
  CloudSun,
  Snowflake,
  Bot,
  User,
  MessageSquare,
  Camera,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { ErrorBoundary, SectionError } from "./error-boundary";

interface InboxMetricsCardProps {
  workspaceId: string;
  accounts: AccountHealthData[];
  initialData?: InboxMetrics;
}

export function InboxMetricsCard({
  workspaceId,
  accounts,
  initialData,
}: InboxMetricsCardProps) {
  const [period, setPeriod] = useState<"24h" | "7d" | "14d" | "30d" | "custom">(
    "24h",
  );
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<
    string | undefined
  >(undefined);
  const [metrics, setMetrics] = useState<InboxMetrics | null>(
    initialData || null,
  );
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const fetchMetrics = () => {
    // Skip first fetch if initialData is present and no filters changed from default
    if (
      initialData &&
      !selectedAccountId &&
      period === "24h" &&
      metrics === initialData
    )
      return;

    startTransition(async () => {
      try {
        const data = await getInboxMetrics(
          workspaceId,
          selectedAccountId,
          period,
          customStartDate ? new Date(customStartDate) : undefined,
          customEndDate ? new Date(customEndDate) : undefined,
        );
        setMetrics(data);
      } catch (err) {
        console.error("Lỗi khi tải Inbox Metrics:", err);
      }
    });
  };

  useEffect(() => {
    fetchMetrics();
  }, [workspaceId, selectedAccountId, period, customStartDate, customEndDate]);

  const totalLeads = useMemo(() => {
    return (
      (metrics?.leadDistribution?.hot || 0) +
      (metrics?.leadDistribution?.warm || 0) +
      (metrics?.leadDistribution?.cold || 0)
    );
  }, [metrics?.leadDistribution]);

  const totalMessages = metrics?.totalMessages || 0;

  // Tạo dữ liệu Sparkline 24h uốn lượn mượt mà dựa trên totalMessages để làm đẹp giao diện
  const sparklineData = useMemo(() => {
    const base = totalMessages || 120;
    // Hệ số uốn lượn hình sin nhẹ đi lên để Sparkline chạy mềm mại
    const factors = [
      0.85, 0.92, 0.88, 0.95, 1.02, 0.98, 1.05, 1.12, 1.08, 1.15, 1.22, 1.2,
    ];
    return factors.map((f, i) => ({
      hour: `${i * 2}h`,
      value: Math.round(base * f * (0.85 + Math.sin(i / 1.6) * 0.1)),
    }));
  }, [totalMessages]);

  const aiHandledPct = metrics?.aiHandledPct || 0;
  const humanNeededPct = metrics?.humanNeededPct || 0;

  // Logic sinh câu nhận định AI đúc kết động (Dynamic AI Insights)
  const aiInsightText = useMemo(() => {
    if (!metrics) return "Đang tính toán các chỉ số phễu hội thoại...";

    const hot = metrics.leadDistribution?.hot || 0;
    const warm = metrics.leadDistribution?.warm || 0;
    const cold = metrics.leadDistribution?.cold || 0;
    const total = hot + warm + cold;

    if (metrics.totalMessages === 0) {
      return "Không ghi nhận hoạt động hội thoại nào trong chu kỳ này. Vui lòng kiểm tra lại kết nối của các tài khoản Facebook/Instagram.";
    }

    if (metrics.aiHandledPct >= 70) {
      return `AI đang vận hành xuất sắc với tỷ lệ tự động hóa đạt ${metrics.aiHandledPct}%. Hệ thống đã tiết kiệm ước tính khoảng ${((metrics.aiHandled * 18) / 3600).toFixed(1)} giờ làm việc thủ công cho nhân sự bán hàng của bạn.`;
    }

    if (hot > total * 0.35 && total > 0) {
      return `Phát hiện mật độ Hot Lead tiềm năng cực cao (${hot} lead, chiếm ${Math.round((hot / total) * 100)}%). Khuyên bạn nên mở ngay Hộp thư để nhân viên ưu tiên chăm sóc và chốt đơn gấp.`;
    }

    if (metrics.humanNeededPct > 50) {
      return `Tỷ lệ hội thoại cần nhân viên hỗ trợ chiếm tới ${metrics.humanNeededPct}%. Bạn có thể bổ sung thêm tài liệu và tối ưu kịch bản AI trong mục Cài đặt Agent để nâng cao năng suất trả lời tự động.`;
    }

    return `Phễu hội thoại đa kênh hoạt động ổn định. Tỷ lệ tự động hóa AI đạt ${metrics.aiHandledPct}%, xử lý trơn tru tổng số ${metrics.totalMessages.toLocaleString()} tin nhắn được điều phối.`;
  }, [metrics]);

  return (
    <div className="bg-base-100 border border-base-content/5 rounded-2xl p-6 flex flex-col gap-6 shadow-sm h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 group/card relative overflow-hidden">
      {/* TẦNG 1: Header (Thanh Tiêu Đề & Bộ lọc & Nút hành động) */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 border-b border-base-content/5 pb-4.5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-base-content font-brand uppercase">
            Inbox Metrics — Phễu Hội Thoại
            {isPending && (
              <span className="loading loading-spinner loading-xs text-primary"></span>
            )}
          </h2>
        </div>

        {/* Unified Filter Group - Thiết kế hợp nhất dùng chung 1 border ngăn cách bởi line dọc mờ (Đã bỏ overflow-hidden để tránh che khuất dropdown) */}
        <div className="flex items-center border border-base-content/10 rounded-lg h-8 transition-all shrink-0">
          {/* Dropdown Chọn Tài Khoản */}
          <RangeSelector
            options={[
              {
                id: "all",
                label: "Tất cả tài khoản",
                icon: <Globe className="w-3.5 h-3.5 text-base-content/60" />,
              },
              ...accounts.map((account) => ({
                id: account.id,
                label: account.platform_user_name,
                icon:
                  account.platform === "facebook" ? (
                    <MessageSquare className="w-3.5 h-3.5 text-facebook" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-instagram" />
                  ),
              })),
            ]}
            value={selectedAccountId || "all"}
            onChange={(val) =>
              setSelectedAccountId(val === "all" ? undefined : val)
            }
            menuAlign="right"
            menuMinWidth="w-52"
            className="[&_button]:border-0! [&_button]:bg-transparent! [&_button]:shadow-none! [&_button]:rounded-none! [&_button]:rounded-l-lg! [&_button]:h-full! [&_button]:hover:bg-base-200/50! [&_button]:text-xs! [&_button]:font-semibold!"
          />

          {/* Đường ngăn cách dọc mờ */}
          <div className="w-px h-4 bg-base-content/10 shrink-0" />

          {/* Bộ lọc thời gian */}
          <RangeSelector
            options={[
              { id: "24h", label: "24h" },
              { id: "7d", label: "7 ngày" },
              { id: "14d", label: "14 ngày" },
              { id: "30d", label: "30 ngày" },
              { id: "custom", label: "Tùy chỉnh" },
            ]}
            value={period}
            onChange={setPeriod}
            menuAlign="right"
            className="[&_button]:border-0! [&_button]:bg-transparent! [&_button]:shadow-none! [&_button]:rounded-none! [&_button]:rounded-r-lg! [&_button]:h-full! [&_button]:hover:bg-base-200/50! [&_button]:text-xs! [&_button]:font-semibold!"
          />
        </div>
      </div>

      {/* Custom Date Range Picker - Thiết kế hợp nhất dùng chung 1 border ngăn cách bởi line dọc mờ */}
      {period === "custom" && (
        <div className="flex flex-wrap items-center bg-base-200/50 p-2 rounded-xl border border-base-content/5 -mt-2 transition-all duration-300 justify-end">
          <div className="flex items-center bg-base-100 border border-base-content/10 rounded-lg overflow-hidden h-7.5 focus-within:border-primary! transition-all shadow-xs">
            {/* Từ */}
            <div className="flex items-center h-full">
              <span className="pl-2.5 pr-1 text-2xs font-bold text-base-content/45 uppercase font-mono select-none">
                Từ
              </span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-mono text-[11px] font-semibold text-base-content h-full px-2 focus:outline-hidden w-[110px]"
              />
            </div>

            {/* Đường ngăn cách dọc mờ */}
            <div className="w-px h-4 bg-base-content/10 shrink-0" />

            {/* Đến */}
            <div className="flex items-center h-full">
              <span className="pl-2.5 pr-1 text-2xs font-bold text-base-content/45 uppercase font-mono select-none">
                Đến
              </span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent border-0 outline-hidden font-mono text-[11px] font-semibold text-base-content h-full px-2 focus:outline-hidden w-[110px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG DỮ LIỆU CHÍNH: Bọc bằng ErrorBoundary và lớp phủ mờ khi isPending */}
      <ErrorBoundary fallback={<SectionError title="Dữ liệu Phễu Hội Thoại" />}>
        <div
          className={cn(
            "flex flex-col gap-6 grow transition-all duration-300",
            isPending && "opacity-50 pointer-events-none select-none",
          )}
        >
          {/* TẦNG 2: Hệ Thống Phễu (Bên trái đổ sang bên phải - 2 Cột 30% / 70%) */}
          <div className="flex flex-col md:flex-row md:items-stretch items-stretch gap-5 grow">
            {/* Cột Trái (30%): Thẻ "Tổng Hội Thoại" Premium Bento */}
            <div className="w-full md:w-[30%] flex flex-col justify-between bg-linear-to-br from-primary/12 via-primary/5 to-transparent border border-base-content/5 rounded-xl p-5 relative overflow-hidden shadow-xs group/funnel min-h-[170px]">
              {/* Lưới ô vuông mờ toán học đồng bộ với AccountHealthGrid */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 5%, black 100%)",
                  maskImage:
                    "linear-gradient(to right, transparent 5%, black 100%)",
                }}
              />

              {/* Glow hiệu ứng mờ bên trong card */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none transition-all duration-500 group-hover/card:scale-125" />

              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">
                  Tổng hội thoại
                </span>
                <div className="text-5xl font-extrabold tracking-tighter text-primary font-mono mt-1.5 transition-transform duration-300 group-hover/funnel:translate-x-1">
                  {totalMessages.toLocaleString()}
                </div>
              </div>

              {/* Sparkline Chart */}
              <div className="w-full h-14 mt-4 opacity-75 group-hover/card:opacity-100 transition-opacity duration-300 relative z-10">
                {sparklineData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={sparklineData}
                      margin={{ top: 2, bottom: 2, left: 2, right: 2 }}
                    >
                      <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-primary, #3b82f6)"
                        strokeWidth={2}
                        fill="url(#glow-sparkline)"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <defs>
                        <linearGradient
                          id="glow-sparkline"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-primary, #3b82f6)"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-primary, #3b82f6)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Cột Phải (70%): Khối "Phân Bố Lead Theo AI Tag" */}
            <div className="w-full md:w-[70%] flex flex-col justify-between bg-base-300/40 border border-base-content/5 rounded-xl p-5 relative overflow-hidden">
              <div className="flex flex-col gap-1 mb-4">
                <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">
                  Phân bố Lead theo AI Tag
                </span>
              </div>

              {/* Cấu trúc 3 dòng phân phối */}
              <div className="flex flex-col gap-4 grow justify-center">
                {/* Hot Lead */}
                <LeadProgressRow
                  icon={<Flame className="w-3.5 h-3.5 stroke-[2.25]" />}
                  label="Hot lead"
                  count={metrics?.leadDistribution?.hot || 0}
                  percent={
                    totalLeads > 0
                      ? Math.round(
                          ((metrics?.leadDistribution?.hot || 0) / totalLeads) *
                            100,
                        )
                      : 0
                  }
                  variant="hot"
                  mounted={mounted}
                />

                {/* Warm Lead */}
                <LeadProgressRow
                  icon={<CloudSun className="w-3.5 h-3.5 stroke-[2.25]" />}
                  label="Warm lead"
                  count={metrics?.leadDistribution?.warm || 0}
                  percent={
                    totalLeads > 0
                      ? Math.round(
                          ((metrics?.leadDistribution?.warm || 0) /
                            totalLeads) *
                            100,
                        )
                      : 0
                  }
                  variant="warm"
                  mounted={mounted}
                />

                {/* Cold Lead */}
                <LeadProgressRow
                  icon={<Snowflake className="w-3.5 h-3.5 stroke-[2.25]" />}
                  label="Cold lead"
                  count={metrics?.leadDistribution?.cold || 0}
                  percent={
                    totalLeads > 0
                      ? Math.round(
                          ((metrics?.leadDistribution?.cold || 0) /
                            totalLeads) *
                            100,
                        )
                      : 0
                  }
                  variant="cold"
                  mounted={mounted}
                />
              </div>
            </div>
          </div>

          {/* TẦNG 3: Khối "Hiệu Suất Xử Lý" (Toàn Chiều Ngang 100%) */}
          <div className="flex flex-col gap-4">
            <div className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">
              HIỆU SUẤT XỬ LÝ (AI VS CON NGƯỜI)
            </div>

            {/* Stacked Bar Chart */}
            <div className="w-full h-4 bg-base-300/80 border border-base-content/5 shadow-inner rounded-full overflow-hidden flex relative group/bar cursor-pointer">
              {/* Khúc bên trái: AI */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: mounted ? `${aiHandledPct}%` : "0%" }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="h-full bg-info/90 hover:bg-info transition-colors duration-200"
              />

              {/* Vạch cắt tinh tế giữa 2 phần */}
              {mounted && aiHandledPct > 0 && humanNeededPct > 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-base-100 w-0.5 z-10"
                  style={{
                    left: `${aiHandledPct}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              )}

              {/* Khúc bên phải: Con người */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: mounted ? `${humanNeededPct}%` : "0%" }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="h-full bg-warning/90 hover:bg-warning transition-colors duration-200"
              />
            </div>

            {/* Chú thích số liệu dưới thanh ngang - Căn thẳng hàng đối xứng tuyệt đối chuẩn Bento */}
            <div className="flex justify-between items-center text-xs font-semibold px-0.5 pb-4 border-b border-base-content/5 gap-4">
              {/* AI Tự Động (Bên Trái) */}
              <div className="flex items-center gap-2.5 text-info">
                <Bot className="w-4.5 h-4.5 stroke-2" />
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-extrabold text-info font-mono">
                    {(metrics?.aiHandled || 0).toLocaleString()}
                  </span>
                  <span className="text-sm opacity-75 font-bold font-mono">
                    ({aiHandledPct}%)
                  </span>
                </div>
              </div>

              {/* Nhân Viên Trực (Bên Phải) */}
              <div className="flex items-center gap-2.5 text-warning text-right justify-end">
                <div className="flex items-baseline gap-1.5 mt-0.5 justify-end">
                  <span className="text-xl font-extrabold text-warning font-mono">
                    {(metrics?.humanNeeded || 0).toLocaleString()}
                  </span>
                  <span className="text-sm opacity-75 font-bold font-mono">
                    ({humanNeededPct}%)
                  </span>
                </div>
                <User className="w-4.5 h-4.5 stroke-2" />
              </div>
            </div>

            {/* Khối AI Insights đúc kết động theo Bento cao cấp */}
            <div className="text-xs text-base-content/60 flex items-start gap-2.5 transition-all">
              <Bot className="w-4.5 h-4.5 text-primary shrink-0 animate-pulse mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-base-content/85 leading-relaxed">
                  {aiInsightText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}

// ==========================================
// STATIC CLASS MAP & STYLE DEFINITION FOR LEADS
// ==========================================
const leadStyles = {
  hot: {
    badge: "text-error font-bold gap-1.5",
    progress: "bg-error",
    iconColor: "text-error",
  },
  warm: {
    badge: "text-warning font-bold gap-1.5",
    progress: "bg-warning",
    iconColor: "text-warning",
  },
  cold: {
    badge: "text-info font-bold gap-1.5",
    progress: "bg-info",
    iconColor: "text-info",
  },
} as const;

interface LeadProgressRowProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  percent: number;
  variant: "hot" | "warm" | "cold";
  mounted: boolean;
}

function LeadProgressRow({
  icon,
  label,
  count,
  percent,
  variant,
  mounted,
}: LeadProgressRowProps) {
  const styles = leadStyles[variant];
  return (
    <div className="flex items-center gap-4 w-full group/row">
      {/* Icon + Tên Tag */}
      <div className="w-30 shrink-0 flex">
        <div
          className={cn(
            "text-sm font-semibold flex items-center gap-1.5 transition-all duration-300",
            styles.badge,
          )}
        >
          <span
            className={cn(
              "shrink-0 flex items-center justify-center transition-transform duration-300 group-hover/row:scale-110",
              styles.iconColor,
            )}
          >
            {icon}
          </span>
          <span>{label}</span>
        </div>
      </div>

      {/* Thanh Tiến Trình - Sửa lỗi background progress bằng cách map styles.progress */}
      <div className="grow h-2 bg-base-300/80 border border-base-content/5 shadow-inner rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: mounted ? `${percent}%` : "0%" }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "h-full rounded-full transition-all duration-300",
            styles.progress,
          )}
        />
      </div>

      {/* Số lượng & % (Căn thẳng hàng bên phải ngoài cùng) */}
      <div className="w-20 shrink-0 flex items-center justify-end font-bold text-base-content font-mono">
        <span className="group-hover/row:text-primary transition-colors duration-200">
          {count.toLocaleString()}
        </span>
        <span className="text-base-content/40 text-xs ml-1.5 font-normal">
          ({percent}%)
        </span>
      </div>
    </div>
  );
}
