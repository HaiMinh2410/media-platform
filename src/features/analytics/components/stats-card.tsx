"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";

interface StatsCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  isPositive?: boolean;
  delta?: number;
  isActive?: boolean;
  onClick?: () => void;
  activeColor?: string;
  sparklineData?: number[];
}

export function SkeletonStatsCard() {
  return (
    <div className="relative bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 flex flex-col gap-3 min-h-[148px] overflow-hidden animate-pulse">
      <div className="flex justify-between items-start mb-1">
        <div className="w-10 h-10 bg-base-300 rounded-lg"></div>
        <div className="w-16 h-8 bg-base-300 rounded-lg"></div>
      </div>
      <div className="w-20 h-3 bg-base-300 rounded-md"></div>
      <div className="w-32 h-8 bg-base-300 rounded-lg mt-1"></div>
    </div>
  );
}

export function StatsCard({
  label,
  value,
  icon,
  trend,
  isPositive,
  delta,
  isActive,
  onClick,
  activeColor = "var(--color-primary)",
  sparklineData = [],
}: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-base-100 border border-base-content/5 shadow-sm rounded-2xl p-6 transition-all duration-300 select-none group cursor-pointer flex flex-col justify-between h-full ${
        isActive
          ? "-translate-y-1 scale-[1.02] border-opacity-50 ring-1 ring-opacity-20 shadow-md"
          : "hover:-translate-y-1 hover:shadow-md active:scale-98"
      }`}
      style={
        isActive
          ? ({
              borderColor: `color-mix(in srgb, ${activeColor} 40%, transparent)`,
              boxShadow: `0 8px 30px color-mix(in srgb, ${activeColor} 10%, transparent)`,
              "--active-glow": `color-mix(in srgb, ${activeColor} 20%, transparent)`,
            } as React.CSSProperties)
          : {}
      }
    >
      {isActive && (
        <div
          className="absolute inset-0 bg-linear-to-br opacity-[0.03] pointer-events-none rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${activeColor}, transparent)`,
          }}
        />
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-base-200 rounded-lg border border-base-content/5 shadow-inner group-hover:border-base-content/10 transition-colors flex items-center justify-center">
          {icon}
        </div>
        <div className="w-20 h-10 opacity-30 group-hover:opacity-80 transition-opacity">
          {sparklineData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sparklineData.map((v, i) => ({ v, i }))}
                margin={{ top: 2, bottom: 2 }}
              >
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={activeColor}
                  strokeWidth={1.5}
                  fill={`url(#glow-${label.replace(/\s+/g, "")})`}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
                <defs>
                  <linearGradient
                    id={`glow-${label.replace(/\s+/g, "")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={activeColor}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={activeColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-base-content/40 uppercase tracking-widest font-mono">
          {label}
        </span>

        <div className="flex items-baseline justify-between gap-2 mt-1">
          <span className="text-3xl font-extrabold text-base-content tracking-tighter font-mono">
            {value}
          </span>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-2xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 font-mono ${
                isPositive
                  ? "text-success bg-success/10 border border-success/5"
                  : trend === "—"
                    ? "text-base-content/40 bg-base-200 border border-base-content/5"
                    : "text-error bg-error/10 border border-error/5"
              }`}
            >
              {trend !== "—" && (isPositive ? "▲" : "▼")}{" "}
              {trend.replace("+", "").replace("-", "")}
            </span>
            {delta !== undefined && delta !== 0 && (
              <span className="text-2xs font-bold text-base-content/30 font-mono">
                {delta > 0 ? "+" : ""}
                {delta.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
