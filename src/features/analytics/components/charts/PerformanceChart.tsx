/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Eye,
  Bot,
  Star,
  Flame,
  AlertTriangle,
  BarChart2,
  Search,
  Target,
} from "lucide-react";
import { Icon } from "@shared/ui/icon";
import { motion, AnimatePresence } from "framer-motion";
import { SlidingTabs } from "@shared/ui/sliding-tabs";
import { generatePerformanceInsightAction } from "@features/analytics/actions/analytics.actions";
import {
  PLATFORM_BENCHMARKS,
  Platform,
} from "@features/analytics/constants/platformBenchmarks";
import { PerformanceInsight } from "@features/analytics/types/performanceInsight";

// --- CONSTANTS ---
const COLOR_REACH = "var(--color-info)";
const COLOR_VIEWS = "var(--color-secondary)";
const COLOR_ENGAGEMENT = "var(--color-warning)";
const COLOR_INTERACTIONS = "var(--color-success)";
const COLOR_BACKGROUND_VAR = "var(--color-base-100)";

const RATING_CONFIG = {
  excellent: {
    label: "Xuất sắc",
    color: "text-success border-success/20 bg-success/5",
    icon: Flame,
    iconClass: "text-success",
  },
  good: {
    label: "Tốt",
    color: "text-info border-info/20 bg-info/5",
    icon: Star,
    iconClass: "text-info",
  },
  average: {
    label: "Trung bình",
    color: "text-warning border-warning/20 bg-warning/5",
    icon: AlertTriangle,
    iconClass: "text-warning",
  },
  weak: {
    label: "Yếu",
    color: "text-error border-error/20 bg-error/5",
    icon: AlertTriangle,
    iconClass: "text-error",
  },
} as const;

// Client-side cache to prevent duplicate AI generation on tab switches
const performanceInsightCache = new Map<
  string,
  { content: PerformanceInsight | null; modelUsed?: string }
>();

interface PerformanceChartProps {
  chartData: any[];
  range: string;
  platform: Platform;
  avgReach: number;
  avgEngagement: number;
  avgEngagementRate: number;
  engagementInsight: any;
  avgViews: number;
  avgInteractions: number;
  avgInteractionRate: number;
  interactionInsight: any;
}

export function PerformanceChart({
  chartData,
  range,
  platform,
  avgReach,
  avgEngagement,
  avgEngagementRate,
  engagementInsight,
  avgViews,
  avgInteractions,
  avgInteractionRate,
  interactionInsight,
}: PerformanceChartProps) {
  const [viewMode, setViewMode] = useState<"reach" | "views">("reach");
  const [aiInsight, setAiInsight] = useState<PerformanceInsight | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>("");
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const getRateColorClass = (rate: number, isReachMode: boolean) => {
    const b = PLATFORM_BENCHMARKS[platform]?.[isReachMode ? "reach" : "views"];
    if (!b) return "text-warning";

    if (rate >= b.excellent) return "text-success";
    if (rate >= b.good) return "text-info";
    return "text-warning";
  };

  const activeInsight =
    viewMode === "reach" ? engagementInsight : interactionInsight;
  const isReachMode = viewMode === "reach";

  useEffect(() => {
    let active = true;

    const cacheKey = JSON.stringify({
      platform,
      viewMode,
      avgReach,
      avgEngagement,
      avgEngagementRate,
      avgViews,
      avgInteractions,
      avgInteractionRate,
    });

    if (performanceInsightCache.has(cacheKey)) {
      const cached = performanceInsightCache.get(cacheKey);
      setAiInsight(cached?.content || null);
      setModelUsed(cached?.modelUsed || "");
      return;
    }

    async function loadAIInsight() {
      setIsLoadingAI(true);
      setRateLimitMessage(null);
      try {
        const res = await generatePerformanceInsightAction({
          platform,
          viewMode,
          avgReach,
          avgEngagement,
          avgEngagementRate,
          avgViews,
          avgInteractions,
          avgInteractionRate,
        });

        if (active) {
          if (res.content) {
            performanceInsightCache.set(cacheKey, {
              content: res.content,
              modelUsed: res.modelUsed,
            });
            setAiInsight(res.content);
            setModelUsed(res.modelUsed || "");
            setRateLimitMessage(null);
          } else {
            setAiInsight(null);
            setModelUsed("");
            if (res.error && (res.error.includes('rate_limit_exceeded') || res.error.includes('Please try again in'))) {
              const match = res.error.match(/Please try again in [^.]+/);
              if (match) {
                setRateLimitMessage(match[0]);
              } else {
                setRateLimitMessage("Please try again in a few minutes");
              }
            }
          }
        }
      } catch (err: any) {
        if (active) {
          setAiInsight(null);
          setModelUsed("");
          setRateLimitMessage(null);
        }
      } finally {
        if (active) {
          setIsLoadingAI(false);
        }
      }
    }

    loadAIInsight();

    return () => {
      active = false;
    };
  }, [
    viewMode,
    platform,
    avgReach,
    avgEngagement,
    avgEngagementRate,
    avgViews,
    avgInteractions,
    avgInteractionRate,
    activeInsight?.desc,
  ]);

  return (
    <div className="w-full bg-base-100 border-t border-base-content/5 shadow-sm  pt-4 flex flex-col gap-6">
      {/* 1. HEADER SECTION (Tiêu đề & Bộ chuyển đổi Switcher) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-content/5">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
            <Icon
              lucide={isReachMode ? Users : Eye}
              size={18}
              className={isReachMode ? "text-info" : "text-secondary"}
            />
            {isReachMode
              ? "So sánh Tiếp cận & Tương tác"
              : "So sánh Lượt hiển thị & Tương tác"}
          </h3>
        </div>

        {/* VIEW SWITCHER (MINI SWITCHER) */}
        <SlidingTabs
          items={[
            {
              value: "reach",
              label: "Theo Reach",
              icon: Users,
              activeBgClass: "bg-info",
              activeTextClass: "text-info-content",
            },
            {
              value: "views",
              label: "Theo Views",
              icon: Eye,
              activeBgClass: "bg-secondary",
              activeTextClass: "text-secondary-content",
            },
          ]}
          activeValue={viewMode}
          onChange={setViewMode}
          size="sm"
          layoutId="performanceViewModeTab"
          className="self-start sm:self-center shrink-0"
        />
      </div>

      {/* 2. BODY CONTENT (Layout Grid 3 cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (CHIẾM 2 PHẦN) - BIỂU ĐỒ */}
        <div className="lg:col-span-8 flex flex-col gap-5 justify-between">
          {/* STATS CARDS (Xếp ngang trên mọi màn hình) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-3 divide-x divide-base-content/10 w-full"
            >
              {isReachMode ? (
                <>
                  <div className="flex flex-col pl-0 pr-4 py-1">
                    <span className="text-xs text-base-content/40 font-medium">
                      Reach TB/Ngày
                    </span>
                    <span className="text-lg font-black text-info font-mono">
                      {avgReach.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col px-4 py-1">
                    <span className="text-xs text-base-content/40 font-medium">
                      Tương tác TB
                    </span>
                    <span className="text-lg font-black text-warning font-mono">
                      {avgEngagement.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col pl-4 pr-0 py-1">
                    <span className="text-xs text-base-content/40 font-medium">
                      Tỷ lệ tương tác
                    </span>
                    <span
                      className={`text-lg font-black font-mono ${getRateColorClass(avgEngagementRate, true)}`}
                    >
                      {avgEngagementRate}%
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1 pl-0 pr-4 py-1">
                    <span className="text-xs text-base-content/40 font-medium">
                      Views TB/Ngày
                    </span>
                    <span className="text-lg font-black text-secondary font-mono">
                      {avgViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-1">
                    <span className="text-xs text-base-content/40 font-medium">
                      Tương tác TB
                    </span>
                    <span className="text-lg font-black text-success font-mono">
                      {avgInteractions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pl-4 pr-0 py-1">
                    <span className="text-xs text-base-content/40 font-medium">
                      Tỷ lệ tương tác
                    </span>
                    <span
                      className={`text-lg font-black font-mono ${getRateColorClass(avgInteractionRate, false)}`}
                    >
                      {avgInteractionRate}%
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div
            style={{ width: "100%", height: "370px" }}
            className="relative text-base-content/70"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.06}
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
                      const month = String(value.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
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
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "currentColor",
                    opacity: 0.5,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;

                      if (isReachMode) {
                        const reachVal = data.reach || 0;
                        const engVal = data.engagement || 0;
                        const dailyRate =
                          reachVal > 0
                            ? ((engVal / reachVal) * 100).toFixed(2)
                            : "0";

                        return (
                          <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                            <div className="text-xs font-bold text-base-content/40 border-b border-base-content/10 pb-1 mb-1 font-mono">
                              {data.date}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-info" />
                                <span>Reach (Tiếp cận):</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">
                                {reachVal.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                                <span>Tương tác:</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">
                                {engVal.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-base-content/10 pt-1.5 mt-1">
                              <span className="text-xs font-medium text-base-content/30">
                                Tỷ lệ tương tác ngày:
                              </span>
                              <span
                                className={`text-xs font-bold font-mono ${getRateColorClass(Number(dailyRate), true)}`}
                              >
                                {dailyRate}%
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        const viewsVal = data.views || 0;
                        const engVal = data.engagement || 0;
                        const dailyRate =
                          viewsVal > 0
                            ? ((engVal / viewsVal) * 100).toFixed(2)
                            : "0";

                        return (
                          <div className="bg-base-300/95 backdrop-blur-xl border border-base-content/10 p-4 rounded-xl shadow-2xl space-y-2 min-w-[200px]">
                            <div className="text-xs font-bold text-base-content/40 border-b border-base-content/10 pb-1 mb-1 font-mono">
                              {data.date}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                                <span>Views (Lượt hiển thị):</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">
                                {viewsVal.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                                <div className="w-2.5 h-2.5 rounded-full bg-success" />
                                <span>Tương tác (Interactions):</span>
                              </div>
                              <span className="text-xs font-bold text-base-content font-mono">
                                {engVal.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 border-t border-base-content/10 pt-1.5 mt-1">
                              <span className="text-xs font-medium text-base-content/30">
                                Tỷ lệ tương tác ngày:
                              </span>
                              <span
                                className={`text-xs font-bold font-mono ${getRateColorClass(Number(dailyRate), false)}`}
                              >
                                {dailyRate}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  }}
                  cursor={{
                    stroke: "currentColor",
                    strokeOpacity: 0.1,
                    strokeWidth: 2,
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    let label = "";
                    if (isReachMode) {
                      label =
                        value === "mainLine"
                          ? "Accounts Reached (Tiếp cận)"
                          : "Accounts Engaged (Tương tác)";
                    } else {
                      label =
                        value === "mainLine"
                          ? "Views (Lượt hiển thị)"
                          : "Interactions (Tương tác)";
                    }
                    return (
                      <span className="text-xs font-semibold text-base-content/70 hover:text-base-content transition-colors">
                        {label}
                      </span>
                    );
                  }}
                />

                {/* MAIN DISTRIBUTIVE LINE (REACH or VIEWS) */}
                <Line
                  type="monotone"
                  dataKey={isReachMode ? "reach" : "views"}
                  name="mainLine"
                  stroke={isReachMode ? COLOR_REACH : COLOR_VIEWS}
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{
                    r: 6,
                    stroke: isReachMode ? COLOR_REACH : COLOR_VIEWS,
                    strokeWidth: 2,
                    fill: COLOR_BACKGROUND_VAR,
                  }}
                />

                {/* ENGAGEMENT LINE */}
                <Line
                  type="monotone"
                  dataKey="engagement"
                  name="engagementLine"
                  stroke={isReachMode ? COLOR_ENGAGEMENT : COLOR_INTERACTIONS}
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{
                    r: 6,
                    stroke: isReachMode ? COLOR_ENGAGEMENT : COLOR_INTERACTIONS,
                    strokeWidth: 2,
                    fill: COLOR_BACKGROUND_VAR,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CỘT PHẢI (CHIẾM 1 PHẦN) - THÔNG TIN CHI TIẾT & INSIGHT */}
        <div className="lg:col-span-4 flex flex-col justify-end">
          {/* AI INSIGHT BLOCK */}
          <div className="flex-1 flex flex-col justify-end">
            <AnimatePresence mode="wait">
              {activeInsight &&
                (() => {
                  const hasValidAiRating =
                    aiInsight &&
                    aiInsight.rating &&
                    RATING_CONFIG[aiInsight.rating];
                  const insightColor = hasValidAiRating
                    ? RATING_CONFIG[aiInsight.rating].color
                    : activeInsight?.color ||
                      "text-warning border-warning/20 bg-warning/5";

                  const insightLabel = hasValidAiRating
                    ? RATING_CONFIG[aiInsight.rating].label
                    : "";

                  return (
                    <motion.div
                      key={viewMode}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className={`p-4 rounded-lg border flex flex-col gap-3 transition-all duration-300 w-full ${insightColor}`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-base-content/5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-base-content flex items-center gap-1.5 uppercase tracking-wide">
                            <Icon
                              lucide={Bot}
                              size={14}
                              className={`${insightColor}`}
                            />
                            Phân tích AI
                            {modelUsed && (
                              <span className="text-2xs font-mono lowercase opacity-40 px-1 py-0.5 rounded bg-base-content/5">
                                {modelUsed
                                  .replace("openai/", "")
                                  .replace("llama-", "")}
                              </span>
                            )}
                          </h4>
                        </div>

                        {hasValidAiRating && (
                          <span className="text-xs font-bold px-2 py-0.5">
                            {insightLabel}
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {rateLimitMessage && (
                          <div className="alert alert-warning text-xs py-2 px-3 rounded-lg border border-warning/20 bg-warning/5 flex items-center gap-2">
                            <Icon lucide={AlertTriangle} size={14} className="text-warning shrink-0 animate-pulse" />
                            <span className="font-semibold text-base-content/80 leading-normal">
                              {rateLimitMessage.replace('Please try again in', 'Đạt giới hạn lượt gọi AI. Vui lòng thử lại sau')}
                            </span>
                          </div>
                        )}
                        {isLoadingAI ? (
                          <div className="space-y-2 py-1 animate-pulse">
                            <div className="h-2 bg-base-content/20 rounded-md w-full" />
                            <div className="h-2 bg-base-content/20 rounded-md w-11/12" />
                            <div className="h-2 bg-base-content/20 rounded-md w-4/5" />
                            <div className="h-2 bg-base-content/10 rounded-md w-3/4 pt-1" />
                          </div>
                        ) : aiInsight ? (
                          <div className="flex flex-col gap-3 text-sm leading-relaxed">
                            <div className="text-base-content/90 flex items-start gap-2">
                              <Icon
                                lucide={BarChart2}
                                size={14}
                                className="text-info shrink-0 mt-0.5"
                              />
                              <span>{aiInsight.evaluation}</span>
                            </div>
                            <div className="bg-background/80 text-base-content/80 p-2 rounded-md font-medium space-y-2">
                              <div className="flex items-start gap-2">
                                <Icon
                                  lucide={Search}
                                  size={14}
                                  className="text-base-content/50 shrink-0 mt-1.5"
                                />
                                <span>{aiInsight.cause}</span>
                              </div>
                              <div className="h-px w-full bg-base-content/10"></div>
                              <div className="flex items-start gap-2">
                                <Icon
                                  lucide={Target}
                                  size={14}
                                  className="text-success shrink-0 mt-1.5"
                                />
                                <span>Kỳ vọng: {aiInsight.expectation}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-base-content">
                              {activeInsight.title}
                            </h5>
                            <p className="text-xs text-base-content/70 leading-relaxed font-medium">
                              {activeInsight.desc}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
