'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  ExternalLink,
  Flame,
  Award,
  Video,
  Image as ImageIcon,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaderboardPostItem } from '@/lib/post-analytics-engine';

interface TopContentLeaderboardProps {
  data: LeaderboardPostItem[] | null;
  isLoading?: boolean;
  onOpenPostDetail: (postId: string) => void;
}

export function TopContentLeaderboard({
  data,
  isLoading = false,
  onOpenPostDetail
}: TopContentLeaderboardProps) {
  if (isLoading || !data) {
    return <LeaderboardSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-[#121212]/30 border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Sparkles className="w-8 h-8 text-white/20 mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">Chưa có dữ liệu bảng xếp hạng</h3>
        <p className="text-xs text-white/40">Không tìm thấy bài viết nào trong khoảng thời gian được lọc.</p>
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
      case 'VIDEO':
        return <Video className="w-3 h-3 text-sky-400" />;
      case 'REELS':
        return <Flame className="w-3 h-3 text-orange-400 animate-pulse" />;
      case 'CAROUSEL_ALBUM':
        return <Layers className="w-3 h-3 text-pink-400" />;
      default:
        return <ImageIcon className="w-3 h-3 text-purple-400" />;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/10 border border-amber-400/20 text-black font-extrabold text-xs">
            <Award className="w-4 h-4" />
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shadow-lg shadow-slate-400/10 border border-slate-300/20 text-black font-extrabold text-xs">
            2
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 shadow-lg shadow-amber-900/10 border border-amber-800/20 text-white/90 font-extrabold text-xs">
            3
          </div>
        );
      default:
        return (
          <span className="text-xs font-bold text-white/40 pl-2.5">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#121212]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Bảng Xếp Hạng Bài Viết Hiệu Quả
          </h2>
          <p className="text-xs text-white/40 mt-0.5">Top 10 bài đăng có tương tác cao nhất trong chu kỳ</p>
        </div>
      </div>

      {/* Semantic Responsive Table */}
      <div className="overflow-x-auto w-full -mx-4 px-4 md:mx-0 md:px-0">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-white/[0.04] text-[10px] text-white/40 uppercase font-bold tracking-wider">
              <th className="pb-3 pl-2 w-12">Hạng</th>
              <th className="pb-3 w-48">Nội dung</th>
              <th className="pb-3 w-28 text-center">Bối cảnh</th>
              <th className="pb-3 w-28 text-right">Lượt xem</th>
              <th className="pb-3 w-28 text-right">Tương tác</th>
              <th className="pb-3 w-24 text-right">ER%</th>
              <th className="pb-3 w-40 text-center">Xu hướng (7D)</th>
              <th className="pb-3 w-16 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {data.map((post, index) => {
              const formattedDate = format(new Date(post.postedAt), "dd/MM/yyyy HH:mm", { locale: vi });
              return (
                <tr 
                  key={post.id} 
                  className="group hover:bg-white/[0.01] transition-all duration-200"
                >
                  {/* Rank */}
                  <td className="py-4 pl-2">
                    {getRankBadge(index)}
                  </td>

                  {/* Content Preview Block */}
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3 max-w-[280px]">
                      {/* Media Thumb */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={post.thumbnailUrl} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/placeholder.png';
                          }}
                        />
                        {/* Media Overlay Badge */}
                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md p-1 rounded-md border border-white/5">
                          {getMediaIcon(post.mediaType)}
                        </div>
                      </div>

                      {/* Text details */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                          {post.caption}
                        </span>
                        <span className="text-[10px] text-white/30 mt-1 font-mono">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Shot Location Type */}
                  <td className="py-4 text-center">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      post.locationType === 'Outdoor' 
                        ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                        : post.locationType === 'Indoor'
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    )}>
                      {post.locationType}
                    </span>
                  </td>

                  {/* Views */}
                  <td className="py-4 text-right">
                    <span className="text-xs font-bold text-white/80">{numberFormatter(post.views)}</span>
                  </td>

                  {/* Interactions Breakdown */}
                  <td className="py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-emerald-400">{numberFormatter(post.totalInteractions)}</span>
                      {/* Mini Breakdown Hud on hover */}
                      <div className="flex items-center gap-1.5 text-[9px] text-white/30 mt-0.5 font-semibold">
                        <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{numberFormatter(post.likeCount)}</span>
                        <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{numberFormatter(post.commentsCount)}</span>
                      </div>
                    </div>
                  </td>

                  {/* ER% */}
                  <td className="py-4 text-right">
                    <span className="text-xs font-mono font-bold text-white">{post.er}%</span>
                  </td>

                  {/* SVG Custom Sparkline (High Performance Line Curve) */}
                  <td className="py-4 text-center">
                    <div className="inline-block">
                      <Sparkline points={post.sparkline} color={index === 0 ? '#f59e0b' : '#a855f7'} />
                    </div>
                  </td>

                  {/* Actions (Open Modal) */}
                  <td className="py-4 text-center pr-2">
                    <button
                      onClick={() => onOpenPostDetail(post.postId)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-purple-600/20 hover:border-purple-500/30 transition-all shadow-md active:scale-95"
                      title="Xem chi tiết"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
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
function Sparkline({ points, color }: { points: number[]; color: string }) {
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
    return acc + `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }, '');

  // Construct closed area coordinates
  const areaD = `${d} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg width={w} height={h} className="overflow-visible opacity-85 hover:opacity-100 transition-opacity">
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      {/* Area Gradient */}
      <path d={areaD} fill={`url(#sparkGrad-${color})`} />
      {/* Line Stroke */}
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {/* End Point Glow Indicator */}
      {pathPoints.length > 0 && (
        <circle 
          cx={pathPoints[pathPoints.length - 1].x} 
          cy={pathPoints[pathPoints.length - 1].y} 
          r={2} 
          fill={color} 
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
    <div className="bg-[#121212]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl animate-pulse space-y-4">
      <div className="space-y-1.5">
        <div className="h-5 w-44 bg-white/10 rounded-lg" />
        <div className="h-3.5 w-60 bg-white/5 rounded-md" />
      </div>

      <div className="space-y-3 mt-6">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-white/[0.02]">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-7 w-7 bg-white/5 rounded-full" />
              <div className="h-10 w-10 bg-white/5 rounded-xl" />
              <div className="space-y-2">
                <div className="h-3 w-32 bg-white/10 rounded-md" />
                <div className="h-2.5 w-20 bg-white/5 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="h-4 w-12 bg-white/5 rounded-md" />
              <div className="h-4 w-16 bg-white/5 rounded-md" />
              <div className="h-7 w-20 bg-white/5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
