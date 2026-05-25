import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { PostDeepAnalyticsData } from "@features/analytics/services/post-analytics-engine";

const SafeTooltip = Tooltip as unknown as React.ComponentType<
  Omit<React.ComponentProps<typeof Tooltip>, "formatter"> & {
    formatter?: (
      value: number,
      name: string,
    ) => [React.ReactNode, React.ReactNode] | React.ReactNode;
  }
>;

interface PerformanceTabProps {
  data: PostDeepAnalyticsData;
}

export function PerformanceTab({ data }: PerformanceTabProps) {
  const numberFormatter = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 divide-x divide-base-content/10 gap-6">
      {/* 1. Performance Line Chart (Col span 2) */}
      <div className="lg:col-span-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-base-content">
              Hiệu suất theo thời gian
            </h3>
          </div>
        </div>

        <div className="h-[360px] w-full mt-6 text-base-content/70">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.performance}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-secondary)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-secondary)"
                    stopOpacity={0.0}
                  />
                </linearGradient>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-info)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-info)"
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.05}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "currentColor",
                  opacity: 0.5,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                }}
                dy={10}
                tickFormatter={(value) => {
                  if (!value) return "";
                  if (value instanceof Date) {
                    const day = String(value.getDate()).padStart(2, "0");
                    const month = String(value.getMonth() + 1).padStart(2, "0");
                    return `${day}/${month}`;
                  }
                  if (typeof value === "number") {
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) {
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      return `${day}/${month}`;
                    }
                  }
                  if (typeof value === "string") {
                    if (value.includes("-")) {
                      const parts = value.split("T")[0].split("-");
                      if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}`;
                      }
                    }
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) {
                      const day = String(d.getDate()).padStart(2, "0");
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      return `${day}/${month}`;
                    }
                  }
                  return String(value);
                }}
              />
              <YAxis
                yAxisId="left"
                stroke="currentColor"
                opacity={0.5}
                fontSize={10}
                fontFamily="var(--font-mono)"
                tickLine={false}
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="currentColor"
                opacity={0.5}
                fontSize={10}
                fontFamily="var(--font-mono)"
                tickLine={false}
                axisLine={false}
                tickFormatter={numberFormatter}
              />
              <SafeTooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-3 rounded-xl shadow-2xl space-y-1.5 min-w-[150px]">
                        <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider mb-1 font-mono">
                          {label}
                        </div>
                        {payload.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs text-base-content/70 font-semibold">
                                {item.name === "views"
                                  ? "Lượt xem"
                                  : item.name === "reach"
                                    ? "Tiếp cận"
                                    : "Tương tác"}
                              </span>
                            </div>
                            <span
                              className="text-xs font-black font-mono"
                              style={{ color: item.color }}
                            >
                              {numberFormatter(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{
                  stroke: "currentColor",
                  strokeOpacity: 0.1,
                  strokeWidth: 1.5,
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="views"
                name="views"
                stroke="var(--color-secondary)"
                strokeWidth={2.5}
                dot={{ stroke: "var(--color-secondary)", strokeWidth: 1, r: 2 }}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: "var(--color-secondary)",
                  fill: "var(--color-base-100)",
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="reach"
                name="reach"
                stroke="var(--color-info)"
                strokeWidth={2}
                dot={{ stroke: "var(--color-info)", strokeWidth: 1, r: 1 }}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-info)",
                  fill: "var(--color-base-100)",
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="interactions"
                name="interactions"
                stroke="var(--color-success)"
                strokeWidth={2}
                dot={{ stroke: "var(--color-success)", strokeWidth: 1, r: 1 }}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-success)",
                  fill: "var(--color-base-100)",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. MoM Comparison Metrics Cards */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="flex-1 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-secondary mb-2">
              <h3 className="text-lg font-bold text-base-content">
                So sánh chu kỳ trước (MoM)
              </h3>
            </div>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {data.mom.map((m, idx) => {
              const isPositive = m.growth >= 0;
              return (
                <div
                  key={idx}
                  className="border-t border-base-content/5 p-3 flex items-end justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wide">
                      {m.metric}
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="font-extrabold text-base-content font-mono">
                        {numberFormatter(m.current)}
                      </span>
                      <span className="text-xs text-base-content/30 font-bold font-mono">
                        vs {numberFormatter(m.previous)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-sm font-bold",
                      isPositive
                        ? "text-success/85"
                        : "text-error/85",
                    )}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {m.growth}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
