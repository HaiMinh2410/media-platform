'use client';

import { cn } from "@shared/lib";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  Flame,
  Award,
  Video,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from "lucide-react";
import type { LeaderboardPostItem } from "@features/analytics/services/post-analytics-engine";

interface TopContentLeaderboardProps {
  data: LeaderboardPostItem[] | null;
  isLoading?: boolean;
  onOpenPostDetail: (postId: string) => void;
}

export function TopContentLeaderboard({
  data,
  isLoading = false,
  onOpenPostDetail,
}: TopContentLeaderboardProps) {
  if (isLoading || !data) {
    return <LeaderboardSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Sparkles className="w-8 h-8 text-base-content/40 mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-base-content mb-1">
          Chưa có dữ liệu bảng xếp hạng
        </h3>
        <p className="text-xs text-base-content/70">
          Không tìm thấy bài viết nào trong khoảng thời gian được lọc.
        </p>
      </div>
    );
  }

  const numberFormatter = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };

  const getMediaIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "VIDEO":
        return <Video className="w-3 h-3 text-info" />;
      case "REELS":
        return <Flame className="w-3 h-3 text-warning animate-pulse" />;
      case "CAROUSEL_ALBUM":
        return <Layers className="w-3 h-3 text-secondary" />;
      default:
        return <ImageIcon className="w-3 h-3 text-primary" />;
    }
  };

  return (
    <div className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-base-content/10">
        <h2 className="text-lg font-bold text-base-content tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500 animate-pulse" />
          Bảng Xếp Hạng Bài Viết Hiệu Quả
        </h2>
      </div>

      {/* Semantic Responsive Table */}
      <div className="overflow-x-auto w-full -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-base-content/10 text-2xs text-base-content/50 uppercase font-bold tracking-wider">
              <th className="pb-3 pl-2 w-12">Hạng</th>
              <th className="pb-3 w-48">Nội dung</th>
              <th className="pb-3 w-28 text-right">Lượt xem</th>
              <th className="pb-3 w-28 text-right">Tương tác</th>
              <th className="pb-3 w-24 text-right">ER%</th>
              <th className="pb-3 w-40 text-center text-xs">Xu hướng (7D)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-content/5">
            {data.map((post, index) => {
              const formattedDate = format(
                new Date(post.postedAt),
                "dd/MM/yyyy HH:mm",
                { locale: vi },
              );
              return (
                <tr
                  key={post.id}
                  onClick={() => onOpenPostDetail(post.postId)}
                  className="group hover:bg-base-200/50 transition-all duration-200 cursor-pointer"
                >
                  <td className="py-4 pl-2">
                    <span
                      className={cn(
                        "font-bold pl-2.5 font-mono text-sm",
                        index === 0 &&
                          "text-amber-500 text-base font-extrabold",
                        index === 1 &&
                          "text-slate-400 text-base font-extrabold",
                        index === 2 &&
                          "text-amber-700 text-base font-extrabold",
                        index > 2 && "text-base-content/70",
                      )}
                    >
                      {index + 1}
                    </span>
                  </td>

                  {/* Content Preview Block */}
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3 max-w-[280px]">
                      {/* Media Thumb */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-base-300 border border-base-content/5 shrink-0 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.thumbnailUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/images/placeholder.png";
                          }}
                        />
                        {/* Media Overlay Badge */}
                        <div className="absolute bottom-1 right-1 bg-base-300/80 backdrop-blur-md p-1 rounded-md border border-base-content/5 flex items-center justify-center">
                          {getMediaIcon(post.mediaType)}
                        </div>
                      </div>

                      {/* Text details */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-base-content/40 truncate group-hover:text-primary transition-colors">
                          {post.caption}
                        </span>
                        <span className="text-xs text-base-content/60 mt-1 font-mono">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Views */}
                  <td className="py-4 text-right">
                    <span className="text-sm font-bold text-base-content/70 font-mono">
                      {numberFormatter(post.views)}
                    </span>
                  </td>

                  {/* Interactions Breakdown */}
                  <td className="py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-success font-mono">
                        {numberFormatter(post.totalInteractions)}
                      </span>
                      {/* Mini Breakdown Hud on hover */}
                      <div className="flex items-center gap-1.5 text-xs text-base-content/40 mt-0.5 font-semibold font-mono">
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 text-error" />
                          {numberFormatter(post.likeCount)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="w-2.5 h-2.5 text-info" />
                          {numberFormatter(post.commentsCount)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* ER% */}
                  <td className="py-4 text-right">
                    <span className="text-sm font-mono font-black text-base-content">
                      {post.er}%
                    </span>
                  </td>

                  {/* SVG Custom Sparkline (High Performance Line Curve) */}
                  <td className="py-4 text-center">
                    <div className="inline-block">
                      <Sparkline
                        points={post.sparkline}
                        type={index === 0 ? "warning" : "primary"}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Super lightweight SVG sparkline drawer with area gradient overlay.
 * Replaces heavy nested charts for zero-lag performance.
 */
function Sparkline({
  points,
  type,
}: {
  points: number[];
  type: "warning" | "primary";
}) {
  const w = 110;
  const h = 26;
  const N = points.length;
  if (N < 2) return null;

  const maxVal = Math.max(...points, 1);
  const minVal = 0;
  const dx = w / (N - 1);

  // Map data to SVG canvas coordinates
  const pathPoints = points.map((val, i) => {
    const x = i * dx;
    const y = h - ((val - minVal) / (maxVal - minVal)) * (h - 4) - 2;
    return { x, y };
  });

  // Construct path coordinates
  const d = pathPoints.reduce((acc, p, i) => {
    return acc + `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }, "");

  // Construct closed area coordinates
  const areaD = `${d} L ${w} ${h} L 0 ${h} Z`;

  const colorVar =
    type === "warning" ? "var(--color-warning)" : "var(--color-primary)";

  return (
    <svg
      width={w}
      height={h}
      className="overflow-visible opacity-85 hover:opacity-100 transition-opacity"
    >
      <defs>
        <linearGradient id={`sparkGrad-${type}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorVar} stopOpacity={0.25} />
          <stop offset="100%" stopColor={colorVar} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      {/* Area Gradient */}
      <path d={areaD} fill={`url(#sparkGrad-${type})`} />
      {/* Line Stroke */}
      <path
        d={d}
        fill="none"
        stroke={colorVar}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End Point Glow Indicator */}
      {pathPoints.length > 0 && (
        <circle
          cx={pathPoints[pathPoints.length - 1].x}
          cy={pathPoints[pathPoints.length - 1].y}
          r={2}
          fill={colorVar}
          className="animate-ping"
        />
      )}
    </svg>
  );
}

// ==========================================
// LEADERBOARD LOADING SKELETON
// ==========================================
function LeaderboardSkeleton() {
  return (
    <div className="bg-base-100 border border-base-content/5 shadow-sm rounded-3xl p-6 space-y-4">
      <div className="space-y-2">
        <div className="skeleton h-5 w-44 rounded-lg" />
        <div className="skeleton h-3.5 w-60 rounded-md" />
      </div>

      <div className="space-y-3 mt-6">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-3 border-b border-base-content/5"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="skeleton h-7 w-7 rounded-full" />
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-32 rounded-md" />
                <div className="skeleton h-2.5 w-20 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="skeleton h-4 w-12 rounded-md" />
              <div className="skeleton h-4 w-16 rounded-md" />
              <div className="skeleton h-7 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
