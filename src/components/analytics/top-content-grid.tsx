'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn, formatMetric } from './primitives';
import { 
  Eye, MousePointer2, Users, Heart, User, UserPlus, Calendar, MessageCircle, Send, Bookmark 
} from 'lucide-react';

export interface TopContentPost {
  id: string;
  postId: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  postedAt: Date | string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  caption: string | null;
  views: number;
  totalInteractions: number;
  reach: number;
  likeCount: number;
  commentsCount: number;
  sharesCount: number;
  savedCount: number;
  profileVisits?: number;
  follows?: number;
}

export type MetricType = 'interactions' | 'reach' | 'likes' | 'profile_visits' | 'follows';

interface TopContentGridProps {
  posts: TopContentPost[];
  activeMetric: MetricType;
  setActiveMetric: (metric: MetricType) => void;
  isLoading?: boolean;
}

const METRIC_TABS = [
  { id: 'interactions', label: 'Interactions', icon: MousePointer2, gradient: 'from-emerald-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.15)' },
  { id: 'reach', label: 'Reach', icon: Users, gradient: 'from-purple-500 to-indigo-600', glow: 'rgba(168, 85, 247, 0.15)' },
  { id: 'likes', label: 'Likes', icon: Heart, gradient: 'from-rose-500 to-pink-600', glow: 'rgba(244, 63, 94, 0.15)' },
  { id: 'profile_visits', label: 'Profile Visits', icon: User, gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245, 158, 11, 0.15)' },
  { id: 'follows', label: 'Follows', icon: UserPlus, gradient: 'from-fuchsia-500 to-pink-600', glow: 'rgba(217, 70, 239, 0.15)' },
] as const;

const GRADIENTS = [
  "linear-gradient(135deg, #e91e63, #9c27b0)",
  "linear-gradient(135deg, #673ab7, #3f51b5)",
  "linear-gradient(135deg, #ff5722, #ff9800)",
  "linear-gradient(135deg, #009688, #4caf50)",
  "linear-gradient(135deg, #00bcd4, #03a9f4)",
];

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' });

function PostThumb({
  post,
  metricType,
  gradient,
  index
}: {
  post: TopContentPost;
  metricType: MetricType;
  gradient: string;
  index: number;
}) {
  const displayUrl = post.thumbnailUrl || post.mediaUrl;
  const formattedDate = dateFormatter.format(new Date(post.postedAt));

  const getMetricValue = () => {
    const likes = post.likeCount || 0;
    const comments = post.commentsCount || 0;
    const shares = post.sharesCount || 0;
    const saves = post.savedCount || 0;
    const baseInteractions = likes + comments + shares + saves;

    switch (metricType) {
      case 'interactions': {
        return post.totalInteractions > 0 ? post.totalInteractions : baseInteractions;
      }
      case 'reach': {
        return post.reach || 0;
      }
      case 'likes': {
        return likes;
      }
      case 'profile_visits': {
        return post.profileVisits || 0;
      }
      case 'follows': {
        return post.follows || 0;
      }
      default: return 0;
    }
  };

  const getMetricBadgeStyle = () => {
    switch (metricType) {
      case 'interactions': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'reach': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'likes': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'profile_visits': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'follows': return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
      className="flex flex-col items-center relative"
    >
      {/* Media Container */}
      <div
        className="relative w-[130px] h-[130px] sm:w-[140px] sm:h-[140px] rounded-2xl overflow-hidden mb-2.5 shadow-md border border-white/5 cursor-pointer"
        style={{ background: gradient }}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Content thumbnail"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 130px, 140px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <span className="text-white/30 text-[10px] font-bold tracking-widest uppercase">{post.mediaType}</span>
          </div>
        )}

        {/* Premium Shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Media Format Icon Overlay */}
        {post.mediaType === 'VIDEO' || post.mediaType === 'REELS' ? (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-lg p-1.5 border border-white/10 shadow-lg">
            <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : post.mediaType === 'CAROUSEL_ALBUM' ? (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-lg p-1.5 border border-white/10 shadow-lg flex items-center justify-center">
            <div className="relative w-3.5 h-3.5">
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-white rounded-[2px]" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-white/40 rounded-[2px] border border-black" />
            </div>
          </div>
        ) : null}

        {/* Top ranking crown/badge for visual delight */}
        {index === 0 && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-md border border-yellow-300">
            #1
          </div>
        )}

        {/* Metric Value HUD */}
        <div className={cn(
          "absolute bottom-2 left-2 right-2 backdrop-blur-md rounded-xl py-1 px-2.5 border text-center font-bold text-xs shadow-md tracking-tight",
          getMetricBadgeStyle()
        )}>
          {formatMetric(getMetricValue())}
        </div>
      </div>
      <span className="text-[11px] text-white/40 font-semibold flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {formattedDate}
      </span>
    </motion.div>
  );
}

export function TopContentGrid({
  posts,
  activeMetric,
  setActiveMetric,
  isLoading = false
}: TopContentGridProps) {

  const sortedAndFilteredPosts = React.useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const getVal = (p: TopContentPost) => {
          const likes = p.likeCount || 0;
          const comments = p.commentsCount || 0;
          const shares = p.sharesCount || 0;
          const saves = p.savedCount || 0;
          const baseInteractions = likes + comments + shares + saves;

          switch (activeMetric) {
            case 'interactions':
              return p.totalInteractions > 0 ? p.totalInteractions : baseInteractions;
            case 'reach':
              return p.reach || 0;
            case 'likes':
              return likes;
            case 'profile_visits':
              return p.profileVisits || 0;
            case 'follows':
              return p.follows || 0;
            default:
              return 0;
          }
        };
        return getVal(b) - getVal(a);
      })
      .slice(0, 5);
  }, [posts, activeMetric]);

  const activeTabConfig = METRIC_TABS.find(t => t.id === activeMetric) || METRIC_TABS[0];

  if (isLoading) {
    return (
      <div className="bg-[#111] border border-white/5 rounded-3xl p-6 font-sans shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 opacity-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-white/5 rounded-lg animate-pulse" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-white/5 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex gap-4 flex-wrap justify-center sm:justify-start">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-[130px] h-[130px] sm:w-[140px] sm:h-[140px] bg-white/5 rounded-2xl animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-[#111] border border-white/5 rounded-3xl p-6 text-white font-sans overflow-hidden shadow-2xl relative transition-all duration-300"
      style={{
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px ${activeTabConfig.glow}`
      }}
    >
      {/* Decorative Gradient Line matching active tab */}
      <div 
        className={cn(
          "absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r transition-all duration-500",
          activeTabConfig.gradient
        )}
      />

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className={cn("p-1.5 rounded-lg bg-gradient-to-br text-black font-extrabold flex items-center justify-center", activeTabConfig.gradient)}>
              <activeTabConfig.icon className="w-4 h-4 text-white" />
            </span>
            Xếp hạng Media Trọn đời
          </h3>
          <p className="text-white/40 text-xs mt-1">
            Top 5 bài viết đạt hiệu quả cao nhất dựa trên chỉ số <span className="text-white font-semibold">{activeTabConfig.label}</span>
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap p-1 bg-white/5 rounded-2xl border border-white/5 gap-1 self-start xl:self-auto max-w-full">
          {METRIC_TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeMetric === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMetric(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer select-none",
                  isActive 
                    ? "text-white" 
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r rounded-xl -z-10 shadow-lg border border-white/10",
                      tab.gradient
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <IconComponent className={cn("w-3.5 h-3.5 transition-transform duration-300", isActive && "scale-110")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Row with Animations */}
      <div className="relative min-h-[160px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMetric}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex gap-4 flex-wrap justify-center sm:justify-start w-full"
          >
            {sortedAndFilteredPosts.length > 0 ? (
              sortedAndFilteredPosts.map((post, i) => (
                <PostThumb
                  key={post.id}
                  post={post}
                  index={i}
                  metricType={activeMetric}
                  gradient={GRADIENTS[i % GRADIENTS.length]}
                />
              ))
            ) : (
              <div className="w-full min-h-[140px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl text-white/30 text-xs py-8">
                <svg className="w-8 h-8 opacity-20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Không có dữ liệu bài viết phù hợp
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
