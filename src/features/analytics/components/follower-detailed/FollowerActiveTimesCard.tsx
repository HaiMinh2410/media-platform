import { SlidingTabs } from "@shared/ui";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BarChart3, Info, Sparkles, Trophy } from "lucide-react";
import { cn } from "../primitives";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface FollowerActiveTimesCardProps {
  activeTimes: Record<string, number[]> | null;
}

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const TIME_LABELS_FULL = [
  "00:00",
  "03:00",
  "06:00",
  "09:00",
  "12:00",
  "15:00",
  "18:00",
  "21:00",
];

const TAB_ITEMS = DAYS.map((d) => ({
  value: d,
  label: d,
  activeBgClass: "bg-secondary",
  activeTextClass: "text-secondary-content",
}));

export function FollowerActiveTimesCard({
  activeTimes,
}: FollowerActiveTimesCardProps) {
  const currentDayIndex = new Date().getDay();
  const initialDay = DAYS[(currentDayIndex + 6) % 7];
  const [activeDay, setActiveDay] = useState<(typeof DAYS)[number]>(initialDay);

  // Tính mốc giờ hoạt động nhiều nhất trung bình cả tuần
  let peakTimeLabel = "";
  if (activeTimes) {
    const hourlySums = Array(8).fill(0);
    DAYS.forEach((day) => {
      const dayData = activeTimes[day] || [];
      for (let i = 0; i < 8; i++) {
        hourlySums[i] += dayData[i] || 0;
      }
    });

    let maxIdx = 0;
    let maxVal = -1;
    for (let i = 0; i < 8; i++) {
      if (hourlySums[i] > maxVal) {
        maxVal = hourlySums[i];
        maxIdx = i;
      }
    }

    const rawLabel = TIME_LABELS_FULL[maxIdx];
    const timeRanges: Record<string, string> = {
      "00:00": "00:00 - 03:00",
      "03:00": "03:00 - 06:00",
      "06:00": "06:00 - 09:00",
      "09:00": "09:00 - 12:00",
      "12:00": "12:00 - 15:00",
      "15:00": "15:00 - 18:00",
      "18:00": "18:00 - 21:00",
      "21:00": "21:00 - 00:00",
    };
    peakTimeLabel = timeRanges[rawLabel] || rawLabel;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-base-100 border border-base-content/5 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[380px] h-full"
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-secondary animate-pulse" />
            <h4 className="text-lg font-bold text-base-content tracking-tight">
              Giờ hoạt động nhiều nhất
            </h4>
          </div>

          {/* Day Selector Tabs */}
          {activeTimes && (
            <SlidingTabs
              items={TAB_ITEMS}
              activeValue={activeDay}
              onChange={setActiveDay}
              size="xs"
              layoutId="followerActiveDayIndicator"
            />
          )}
        </div>

        {!activeTimes ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-8 h-8 text-base-content/20 mb-2" />
            <span className="text-base-content/40 italic">
              Không có dữ liệu giờ hoạt động
            </span>
          </div>
        ) : (
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="text-sm text-base-content/50 mb-2 tracking-wide">
              Thời gian online nhiều nhất
            </div>

            <div className="h-[220px] w-full mt-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDay}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  {(() => {
                    const dayData = activeTimes[activeDay] || [
                      0, 0, 0, 0, 0, 0, 0, 0,
                    ];
                    const chartData = TIME_LABELS_FULL.map((label, idx) => ({
                      time: label,
                      value: dayData[idx] || 0,
                    }));

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="activeTimeGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-secondary)"
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--color-secondary)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--color-base-content)"
                            opacity={0.06}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="time"
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fill: "var(--color-base-content)",
                              opacity: 0.5,
                              fontSize: 11,
                              fontWeight: 500,
                              fontFamily: "var(--font-sans, sans-serif)",
                            }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fill: "var(--color-base-content)",
                              opacity: 0.5,
                              fontSize: 11,
                              fontWeight: 500,
                              fontFamily: "var(--font-sans, sans-serif)",
                            }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-soft px-3 py-2 rounded-lg shadow-xl">
                                    <p className="text-xs text-base-content/80 font-bold uppercase tracking-wide font-mono">
                                      {payload[0].payload.time}
                                    </p>
                                    <p className="text-sm font-bold text-secondary mt-0.5">
                                      {payload[0].value?.toLocaleString()}{" "}
                                      <span className="text-xs text-base-content/60 font-medium">
                                        hoạt động
                                      </span>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--color-secondary)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#activeTimeGrad)"
                            activeDot={{
                              r: 6,
                              stroke: "var(--color-base-100)",
                              strokeWidth: 2,
                              fill: "var(--color-secondary)",
                              className: "shadow-lg",
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-base-content/5 flex items-center gap-2 text-sm text-base-content/60 tracking-wider">
        <Trophy size={14} className="text-secondary/60" />
        <span>
          Thời gian online nhiều nhất trung bình cả tuần:{" "}
          <span className="text-secondary">{peakTimeLabel || "N/A"}</span>
        </span>
      </div>
    </motion.div>
  );
}
