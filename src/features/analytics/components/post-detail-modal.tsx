'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Layers, Image as ImageIcon, Heart, MessageCircle, Share2, Bookmark, Info, Copy, Check } from 'lucide-react';

export interface PostDetailData {
  postId?: string;
  mediaType: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  postedAt?: string | Date;
  syncedAt?: string | Date;
  likeCount: number;
  commentsCount: number;
  sharesCount: number;
  savedCount: number;
  views?: number;
  reach?: number;
  totalInteractions?: number;
  profileVisits?: number;
  follows?: number;
  igReelsAvgWatchTime?: number;
  igReelsVideoViewTotalTime?: number;
  reelsSkipRate?: number;
  crosspostedViews?: number;
}

interface PostDetailModalProps {
  post: PostDetailData;
  onClose: () => void;
}

const formatMetricValue = (val: number): string => {
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'K';
  return val.toString();
};

const formatPlayTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
};

export function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    // Khóa cuộn body khi mở modal
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(handle);
      document.body.style.overflow = '';
    };
  }, []);

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 3000);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex bg-base-100 select-none overflow-hidden">
      {/* Close button at top-left screen (Instagram style) */}
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 z-110 text-base-content-secondary hover:text-base-content transition-all hover:scale-105 active:scale-95 cursor-pointer p-2.5 rounded-full hover:bg-foreground/5"
      >
        <svg className="w-8 h-8 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Modal Body */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-screen h-screen bg-base-100 z-10 flex flex-col md:grid md:grid-cols-12 text-base-content select-text"
      >
        {/* Left Column: Media Preview + Floating Reels Action Bar */}
        <div className="md:col-span-8 relative bg-base-300 flex items-center justify-center border-b md:border-b-0 md:border-r border-foreground/10 select-none overflow-hidden h-full py-6">
          {/* Center vertical media container */}
          <div className="relative max-w-full max-h-[95vh] md:max-h-[92vh] rounded-md overflow-hidden shadow-2xl border border-foreground/10 bg-base-200 flex items-center justify-center group/media select-none">
            {post.mediaType === 'VIDEO' || post.mediaType === 'REELS' ? (
              <video 
                src={post.mediaUrl} 
                controls 
                className="max-w-full max-h-[95vh] md:max-h-[92vh] w-auto h-auto object-contain"
                poster={post.thumbnailUrl}
                autoPlay
                muted
                loop
              />
            ) : post.thumbnailUrl || post.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={post.thumbnailUrl || post.mediaUrl} 
                alt="Reels item" 
                className="max-w-full max-h-[95vh] md:max-h-[92vh] w-auto h-auto object-contain"
              />
            ) : (
              <div className="text-base-content-tertiary text-sm font-bold tracking-widest">{post.mediaType}</div>
            )}
            
            {/* Media Type Icon */}
            <div 
              className="absolute top-4 left-4 p-2 backdrop-blur-md text-base-content rounded-full flex items-center justify-center"
              title={post.mediaType === 'REELS' ? 'Reels video' : post.mediaType === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post'}
            >
              {post.mediaType === 'REELS' ? (
                <Clapperboard className="w-4.5 h-4.5" />
              ) : post.mediaType === 'CAROUSEL_ALBUM' ? (
                <Layers className="w-4.5 h-4.5" />
              ) : (
                <ImageIcon className="w-4.5 h-4.5" />
              )}
            </div>
          </div>

          {/* Quick vertical Instagram-style action overlay */}
          <div className="absolute right-6 bottom-12 flex flex-col items-center gap-4 z-20">
            {/* Like button */}
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="p-3 hover:bg-base-300 rounded-full backdrop-blur-md text-red-500 transition-all group-hover:scale-110 active:scale-90 shadow-xl flex items-center justify-center">
                <Heart className="size-6 fill-current" />
              </div>
              <span className="text-sm font-bold text-base-content drop-shadow-lg">{formatMetricValue(post.likeCount)}</span>
            </div>

            {/* Comments button */}
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="p-3 hover:bg-base-300 rounded-full backdrop-blur-md text-base-content transition-all group-hover:scale-110 active:scale-90 shadow-xl flex items-center justify-center">
                <MessageCircle className="size-6" />
              </div>
              <span className="text-sm font-bold text-base-content drop-shadow-lg">{formatMetricValue(post.commentsCount)}</span>
            </div>

            {/* Shares button */}
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="p-3 hover:bg-base-300 rounded-full backdrop-blur-md text-base-content transition-all group-hover:scale-110 active:scale-90 shadow-xl flex items-center justify-center">
                <Share2 className="size-6" />
              </div>
              <span className="text-sm font-bold text-base-content drop-shadow-lg">{formatMetricValue(post.sharesCount)}</span>
            </div>

            {/* Saves button */}
            <div className="flex flex-col items-center cursor-pointer group">
              <div className="p-3 hover:bg-base-300 rounded-full backdrop-blur-md text-base-content transition-all group-hover:scale-110 active:scale-90 shadow-xl flex items-center justify-center">
                <Bookmark className="size-6" />
              </div>
              <span className="text-sm font-bold text-base-content drop-shadow-lg">{formatMetricValue(post.savedCount)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Instagram Reels Insights Sidebar */}
        <div className="md:col-span-4 flex flex-col h-full bg-base-200 select-text overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-foreground/5 select-none">
            <h3 className="text-2xl font-bold text-base-content">
              {post.mediaType === 'REELS' ? 'Reels insights' : 'Post insights'}
            </h3>
          </div>

          {/* Caption preview (collapsible in concept, static here) */}
          {post.caption && (
            <div className="px-5 py-4 border-b border-foreground/5 bg-soft/40">
              <p className="font-semibold text-base-content-secondary mb-1 select-none">Caption</p>
              <p className="text-sm text-base-content-secondary max-h-[85px] overflow-y-auto whitespace-pre-wrap custom-scrollbar pr-1">
                {post.caption}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* POST METADATA */}
            <div className="space-y-3">
              <div className="font-bold text-base-content select-none">
                Post details
              </div>
              <div className="space-y-2.5 text-sm font-medium">
                <div className="flex justify-between items-center select-none">
                  <span className="text-base-content-secondary">Post ID</span>
                  <div className="flex items-center gap-1.5">
                    <div 
                      onClick={() => handleCopy(post.postId || '', 'postId')}
                      className="flex items-center gap-1 text-base-content-secondary hover:text-base-content cursor-pointer transition-colors active:scale-95 group/copy select-none"
                      title="Click to copy ID"
                    >
                      <span className="font-mono">{post.postId || 'N/A'}</span>
                      {copiedField === 'postId' ? (
                        <Check className="w-3.5 h-3.5 text-success animate-pulse" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-60 group-hover/copy:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center select-none">
                  <span className="text-base-content-secondary">Posted At (Ngày đăng)</span>
                  <span className="text-base-content-secondary text-right">
                    {post.postedAt ? new Date(post.postedAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center select-none">
                  <span className="text-base-content-secondary">Synced At (Đồng bộ lúc)</span>
                  <span className="text-base-content-secondary text-right">
                    {post.syncedAt ? new Date(post.syncedAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-foreground/5" />

            {/* SECTION 1: REACH & VIEWS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center select-none">
                <div className="flex items-center gap-1.5 font-bold text-base-content">
                  <span>Reach & Views</span>
                  <Info className="w-3.5 h-3.5 text-base-content-secondary hover:text-base-content cursor-pointer transition-colors" />
                </div>
              </div>

              <div className="space-y-2.5 select-none text-sm font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-base-content-secondary">Views (Lượt xem)</span>
                  <span className="font-semibold text-base-content">{(post.views || post.reach || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content-secondary">Reach (Số tài khoản tiếp cận)</span>
                  <span className="font-semibold text-base-content">{(post.reach || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-foreground/5" />

            {/* SECTION 2: INTERACTIONS */}
            <div className="space-y-3">
              <div className="space-y-3">
                <div className="flex justify-between items-center font-bold text-base-content select-none">
                  <span>Reels interactions</span>
                  <span className="text-base-content font-bold text-sm">{(post.totalInteractions || (post.likeCount + post.commentsCount + post.sharesCount + post.savedCount)).toLocaleString()}</span>
                </div>
                
                <div className="space-y-2.5 text-sm font-medium">
                  {/* Likes */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-base-content-secondary">
                      <Heart className="w-3.5 h-3.5 text-base-content-secondary/60" />
                      <span>Likes (Lượt thích)</span>
                    </div>
                    <span className="font-semibold text-base-content">{post.likeCount.toLocaleString()}</span>
                  </div>
                  {/* Comments */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-base-content-secondary">
                      <MessageCircle className="w-3.5 h-3.5 text-base-content-secondary/60" />
                      <span>Comments (Bình luận)</span>
                    </div>
                    <span className="font-semibold text-base-content">{post.commentsCount.toLocaleString()}</span>
                  </div>
                  {/* Shares */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-base-content-secondary">
                      <Share2 className="w-3.5 h-3.5 text-base-content-secondary/60" />
                      <span>Shares (Chia sẻ)</span>
                    </div>
                    <span className="font-semibold text-base-content">{post.sharesCount.toLocaleString()}</span>
                  </div>
                  {/* Saves */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-base-content-secondary">
                      <Bookmark className="w-3.5 h-3.5 text-base-content-secondary/60" />
                      <span>Saves (Lưu lại)</span>
                    </div>
                    <span className="font-semibold text-base-content">{post.savedCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: PROFILE CONVERSIONS */}
            {post.mediaType !== 'REELS' && post.mediaType !== 'VIDEO' && (
              <>
                <div className="h-px bg-foreground/5" />

                <div className="space-y-3">
                  {/* Section Title */}
                  <div className="flex justify-between items-center select-none">
                    <div className="flex items-center gap-1.5 font-bold text-base-content">
                      <span>Profile Visits & Follows</span>
                      <Info className="w-3.5 h-3.5 text-base-content-secondary hover:text-base-content cursor-pointer transition-colors" />
                    </div>
                  </div>

                  {/* Detail Metrics for Profile */}
                  <div className="space-y-2.5 text-sm font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-base-content-secondary">Profile Visits (Ghé thăm Profile)</span>
                      <span className="font-semibold text-base-content">{(post.profileVisits || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content-secondary">Follows (Lượt theo dõi)</span>
                      <span className="font-semibold text-base-content">{(post.follows || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {post.mediaType === 'REELS' && (
              <>
                <div className="h-px bg-foreground/5" />

                <div className="space-y-3">
                  {/* Section Title */}
                  <div className="flex justify-between items-center select-none">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>Reels Performance Details</span>
                      <Info className="w-3.5 h-3.5 text-base-content/80 hover:text-primary cursor-pointer transition-colors" />
                    </div>
                  </div>

                  {/* Detail Metrics for Reels */}
                  <div className="space-y-2.5 text-sm font-medium">
                    <div className="flex justify-between items-center">
                      <span className="text-base-content-secondary">Average Watch Time (Thời gian xem TB)</span>
                      <span className="font-semibold text-base-content">
                        {post.igReelsAvgWatchTime ? `${(post.igReelsAvgWatchTime / 1000).toFixed(2)}s` : '0.00s'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content-secondary">Total Play Time (Tổng thời gian phát)</span>
                      <span className="font-semibold text-base-content">
                        {post.igReelsVideoViewTotalTime ? formatPlayTime(post.igReelsVideoViewTotalTime) : '0s'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content-secondary">3s Skip Rate (Tỷ lệ bỏ qua trong 3s)</span>
                      <span className="font-semibold text-base-content">
                        {post.reelsSkipRate ? `${post.reelsSkipRate.toFixed(1)}%` : '0.0%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content-secondary">Facebook Views (Lượt xem trên FB)</span>
                      <span className="font-semibold text-base-content">
                        {(post.crosspostedViews || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
