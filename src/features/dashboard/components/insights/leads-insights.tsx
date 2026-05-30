import React, { useRef, useState } from "react";
import { Info, HelpCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@shared/lib/utils";
import { FilterGroup } from "@shared/ui/filter-group";
import { ClusterSelector } from "@features/inbox/components/cluster-selector";
import { DoubleCalendarPicker } from "../leads/double-calendar-picker";
import { MetricCard } from "./metric-card";
import { PortalTooltip } from "@shared/ui/portal-tooltip";

export interface LeadsInsightsProps {
  workspaceId: string;
  selectedGroupId: string | null;
  onChangeGroup: (id: string | null) => void;
  filters: {
    stage: string;
    campaign: string;
    form: string;
    date: string;
  };
  onFilterChange: (key: string, value: string) => void;
  loading: boolean;
  newLeadsCount: number;
  convertedLeadsCount: number;
  unqualifiedLeadsCount: number;
  lostLeadsCount: number;
  conversionRate: string;
  chartData: Array<{ name: string; value: number }>;
}

export function LeadsInsights({
  workspaceId,
  selectedGroupId,
  onChangeGroup,
  filters,
  onFilterChange,
  loading,
  newLeadsCount,
  convertedLeadsCount,
  unqualifiedLeadsCount,
  lostLeadsCount,
  conversionRate,
  chartData,
}: LeadsInsightsProps) {
  const [isChartTooltipActive, setIsChartTooltipActive] = useState(false);
  const chartTooltipAnchorRef = useRef<HTMLDivElement>(null);
  const [isRateTooltipActive, setIsRateTooltipActive] = useState(false);
  const rateTooltipAnchorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Section title & local filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <h3 className="text-lg font-bold text-base-content">
          Hiệu quả trong Trung tâm khách hàng tiềm năng
        </h3>

        <FilterGroup>
          <ClusterSelector
            workspaceId={workspaceId}
            selectedGroupId={selectedGroupId}
            onChangeGroup={onChangeGroup}
            triggerClassName={cn(
              "btn btn-soft btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
              selectedGroupId &&
                "text-primary bg-primary/10 font-bold hover:bg-primary/15",
            )}
          />

          {/* Bộ lọc Chọn ngày (Double Calendar Picker) */}
          <DoubleCalendarPicker
            selectedDate={filters.date}
            onSelectDate={(date) => onFilterChange("date", date)}
            triggerClassName={cn(
              "btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
              filters.date !== "all" &&
                "text-primary bg-primary/10 font-bold hover:bg-primary/15",
            )}
          />
        </FilterGroup>
      </div>

      {loading ? (
        /* Trạng thái Loading cao cấp (Skeleton) */
        <div className="flex flex-col gap-6 w-full animate-pulse">
          <div className="flex flex-wrap gap-3.5 w-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-1 min-w-[150px] h-24 bg-base-300/30 rounded-lg"
              ></div>
            ))}
          </div>
          <div className="h-[350px] bg-base-300/30 rounded-xl w-full"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 p-5 border border-base-content/5 rounded-xl bg-base-100 shadow-2xs">
          {/* ─── BÁO CÁO TỔNG QUAN ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* 1. Top Metrics Bar (Thanh chỉ số) */}
            <div className="flex flex-wrap gap-3.5 w-full">
              <MetricCard
                label="Số khách hàng ở giai đoạn tiếp nhận"
                value={newLeadsCount}
                tooltipText="Số khách hàng tiềm năng đã được thu thập ở giai đoạn đầu tiên (tiếp nhận)."
              />
              <MetricCard
                label="Số khách hàng tiềm năng đã chuyển đổi"
                value={convertedLeadsCount}
                tooltipText="Số lượng khách hàng tiềm năng đã chuyển đổi thành hợp đồng/khách hàng thực tế thành công."
              />
              <MetricCard
                label="Thời gian trung bình để khách hàng tiềm năng chuyển đổi"
                value="0,1"
                tooltipText="Thời gian trung bình tính bằng ngày để một khách hàng tiềm năng chuyển đổi thành công."
              />
              <MetricCard
                label="Số khách hàng tiềm năng đã bỏ lỡ"
                value={lostLeadsCount > 0 ? lostLeadsCount : "--"}
                tooltipText="Số lượng khách hàng tiềm năng đã bị bỏ lỡ hoặc không thể liên lạc."
              />
              <MetricCard
                label="Số khách hàng không đủ điều kiện"
                value={unqualifiedLeadsCount}
                tooltipText="Số lượng khách hàng tiềm năng được đánh giá là không phù hợp với tiêu chí."
              />
            </div>
          </div>

          {/* 2. Charts & Conversion Rate (Biểu đồ & Tỷ lệ chuyển đổi) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 divide-x divide-base-content/5 pt-4 border-t border-base-content/5">
            {/* Cột trái: Biểu đồ (70%) */}
            <div className="xl:col-span-8 pr-5 flex flex-col gap-4 min-h-[400px] w-full">
              <h5 className="text-sm font-semibold text-base-content/75 flex items-center gap-1.5">
                <span>
                  Khách hàng tiềm năng trong Trung tâm khách hàng tiềm năng
                </span>
                <div
                  ref={chartTooltipAnchorRef}
                  onMouseEnter={() => setIsChartTooltipActive(true)}
                  onMouseLeave={() => setIsChartTooltipActive(false)}
                  className="cursor-pointer shrink-0"
                >
                  <Info
                    size={12}
                    className="opacity-50 hover:opacity-80 transition-opacity"
                  />
                </div>
              </h5>

              <PortalTooltip
                active={isChartTooltipActive}
                anchorRef={chartTooltipAnchorRef}
                showArrow
                position="top"
                align="right"
                offsetY={6}
                className="w-80 text-pretty text-sm rounded-md"
              >
                <div className="flex flex-col gap-1 text-left">
                  <div className="font-semibold text-base-content text-sm">
                    Khách hàng tiềm năng trong Trung tâm khách hàng tiềm năng
                  </div>
                  <p className="text-base-content/70 text-xs leading-relaxed">
                    Tổng số khách hàng tiềm năng ở một giai đoạn bất kỳ trong
                    Trung tâm khách hàng tiềm năng. Các khách hàng tiềm năng đã
                    thêm vào giai đoạn Đã để mất hoặc Không đủ điều kiện sẽ
                    không được hiển thị.
                  </p>
                </div>
              </PortalTooltip>

              <div className="flex-1 w-full h-[260px] text-xs font-medium">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: -25, bottom: 5 }}
                    barSize={60}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--color-base-content, #ccc)"
                      opacity={0.08}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "currentColor",
                        opacity: 0.6,
                        fontSize: 10,
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "currentColor",
                        opacity: 0.6,
                        fontSize: 10,
                      }}
                      domain={[0, "dataMax + 2"]}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "currentColor", opacity: 0.03 }}
                      contentStyle={{
                        backgroundColor: "var(--color-base-100, #fff)",
                        borderColor: "rgba(0,0,0,0.06)",
                        borderRadius: "6px",
                        color: "var(--color-base-content, #000)",
                        fontSize: "11px",
                        fontWeight: "bold",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar dataKey="value" fill="#62c2b7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cột phải: Tỷ lệ chuyển đổi (30%) */}
            <div className="xl:col-span-4 pl-5 flex flex-col gap-4 p-2">
              <div className="flex flex-col gap-2">
                <h5 className="text-xs font-bold text-base-content/75 flex items-center gap-1.5">
                  <span>Tỷ lệ chuyển đổi</span>
                  <div
                    ref={rateTooltipAnchorRef}
                    onMouseEnter={() => setIsRateTooltipActive(true)}
                    onMouseLeave={() => setIsRateTooltipActive(false)}
                    className="cursor-pointer shrink-0"
                  >
                    <Info
                      size={12}
                      className="opacity-50 hover:opacity-80 transition-opacity"
                    />
                  </div>
                </h5>

                <PortalTooltip
                  active={isRateTooltipActive}
                  anchorRef={rateTooltipAnchorRef}
                  showArrow
                  position="top"
                  align="left"
                  offsetY={6}
                  className="w-80 text-pretty text-sm rounded-md"
                >
                  <div className="flex flex-col gap-1 text-left font-normal">
                    <div className="font-semibold text-base-content text-sm">
                      Tỷ lệ chuyển đổi
                    </div>
                    <p className="text-base-content/70 text-xs leading-relaxed mb-1.5">
                      Tỷ lệ phần trăm khách hàng tiềm năng chuyển từ giai đoạn
                      Tiếp nhận sang giai đoạn Đã chuyển đổi ở Trung tâm khách
                      hàng tiềm năng trong khoảng thời gian đã chọn.
                    </p>
                    <p className="text-base-content/70 text-xs leading-relaxed">
                      Số liệu này được tính bằng cách lấy tổng số khách hàng
                      tiềm năng đã bước vào giai đoạn Đã chuyển đổi ở Trung tâm
                      khách hàng tiềm năng chia cho tổng số khách hàng tiềm năng
                      bước vào giai đoạn Tiếp nhận trong khoảng thời gian đã
                      chọn.
                    </p>
                  </div>
                </PortalTooltip>

                <div className="flex flex-col gap-1 mt-2">
                  <div className="text-4xl font-black text-base-content tracking-tight">
                    {conversionRate}%
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-success mt-1">
                    <span className="text-md">↑</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
