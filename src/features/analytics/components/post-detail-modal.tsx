'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PostDetailModalProps {
  post: any;
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Generate stable percentage rates based on post ID for vivid simulation
  const seed = post.id ? post.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 100;
  const followersPct = Math.round(80 + (seed % 15));
  const nonfollowersPct = 100 - followersPct;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base-300/90 backdrop-blur-xl select-none overflow-hidden">
      {/* Close button at top-left screen (Instagram style) */}
      <button 
        onClick={onClose}
        className="absolute top-6 left-6 z-50 text-foreground-secondary hover:text-foreground transition-all hover:scale-105 active:scale-95 cursor-pointer p-2.5 rounded-full hover:bg-foreground/5"
      >
        <svg className="w-8 h-8 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Modal Body */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-screen h-screen md:w-[90vw] md:h-[90vh] md:max-w-6xl md:rounded-3xl bg-base-100 border border-foreground/10 overflow-hidden shadow-2xl z-10 flex flex-col md:grid md:grid-cols-12 text-foreground select-text"
      >
        {/* Left Column: Media Preview + Floating Reels Action Bar */}
        <div className="md:col-span-8 relative bg-base-300 flex items-center justify-center border-b md:border-b-0 md:border-r border-foreground/10 select-none overflow-hidden h-full py-6">
          {/* Center vertical media container */}
          <div className="relative h-full max-h-[90vh] md:max-h-[80vh] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-foreground/10 bg-base-200 flex items-center justify-center group/media select-none">
            {post.mediaType === 'VIDEO' || post.mediaType === 'REELS' ? (
              <video 
                src={post.mediaUrl} 
                controls 
                className="w-full h-full object-cover"
                poster={post.thumbnailUrl}
                autoPlay
                muted
                loop
              />
            ) : post.thumbnailUrl || post.mediaUrl ? (
              <img 
                src={post.thumbnailUrl || post.mediaUrl} 
                alt="Reels item" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-foreground-tertiary text-xs font-bold uppercase tracking-widest">{post.mediaType}</div>
            )}
            
            {/* Media Type Tag */}
            <div className="absolute top-4 left-4 bg-base-300/80 backdrop-blur-md text-[9px] font-extrabold text-foreground px-2.5 py-1 rounded-full border border-foreground/10 uppercase tracking-widest">
              {post.mediaType === 'REELS' ? 'Reel' : post.mediaType === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post'}
            </div>

            {/* Fullscreen indicator */}
            <div className="absolute top-4 right-4 p-2 bg-base-300/50 hover:bg-base-300/80 text-foreground rounded-full border border-foreground/10 backdrop-blur-md cursor-pointer transition-colors shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </div>
          </div>

          {/* Quick vertical Instagram-style action overlay */}
          <div className="absolute right-6 bottom-12 flex flex-col items-center gap-5.5 z-20">
            {/* Like button */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="p-3 bg-base-300/80 hover:bg-base-300 rounded-full border border-foreground/10 hover:border-foreground/20 backdrop-blur-md text-error transition-all group-hover:scale-110 active:scale-90 shadow-xl">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span className="text-[10px] font-extrabold text-foreground drop-shadow-lg">{formatMetricValue(post.likeCount)}</span>
            </div>

            {/* Comments button */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="p-3 bg-base-300/80 hover:bg-base-300 rounded-full border border-foreground/10 hover:border-foreground/20 backdrop-blur-md text-foreground transition-all group-hover:scale-110 active:scale-90 shadow-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-[10px] font-extrabold text-foreground drop-shadow-lg">{formatMetricValue(post.commentsCount)}</span>
            </div>

            {/* Shares button */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="p-3 bg-base-300/80 hover:bg-base-300 rounded-full border border-foreground/10 hover:border-foreground/20 backdrop-blur-md text-foreground transition-all group-hover:scale-110 active:scale-90 shadow-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.632-2.316m0 7.148l-4.632-2.316M19 19a3 3 0 11-6 0 3 3 0 016 0zm-6-14a3 3 0 11-6 0 3 3 0 016 0zm-6 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-extrabold text-foreground drop-shadow-lg">{formatMetricValue(post.sharesCount)}</span>
            </div>

            {/* Saves button */}
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <div className="p-3 bg-base-300/80 hover:bg-base-300 rounded-full border border-foreground/10 hover:border-foreground/20 backdrop-blur-md text-foreground transition-all group-hover:scale-110 active:scale-90 shadow-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <span className="text-[10px] font-extrabold text-foreground drop-shadow-lg">{formatMetricValue(post.savedCount)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Instagram Reels Insights Sidebar */}
        <div className="md:col-span-4 flex flex-col h-full bg-base-200 select-text overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-foreground/10 select-none">
            <h3 className="text-[15px] font-bold text-foreground tracking-wide">
              {post.mediaType === 'REELS' ? 'Reels insights' : 'Post insights'}
            </h3>
          </div>

          {/* Caption preview (collapsible in concept, static here) */}
          {post.caption && (
            <div className="px-5 py-4 border-b border-foreground/10 bg-foreground/[0.01]">
              <p className="text-[11px] text-foreground-secondary leading-relaxed font-semibold uppercase tracking-wider mb-1.5 select-none">Caption</p>
              <p className="text-[11.5px] text-foreground-secondary leading-relaxed max-h-[75px] overflow-y-auto whitespace-pre-wrap custom-scrollbar pr-1">
                {post.caption}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* POST METADATA */}
            <div className="space-y-2.5">
              <div className="text-sm font-bold text-foreground select-none">
                Post details
              </div>
              <div className="space-y-2 text-[11.5px] font-semibold">
                <div className="flex justify-between items-center select-none">
                  <span className="text-foreground-secondary">Post ID</span>
                  <div className="flex items-center gap-1.5">
                    {copiedField === 'postId' && (
                      <span className="text-[10px] text-success font-bold animate-pulse">Copied!</span>
                    )}
                    <span 
                      onClick={() => handleCopy(post.postId || '', 'postId')}
                      className="text-foreground-secondary hover:text-foreground cursor-pointer select-all transition-colors active:scale-95 text-xs font-mono" 
                      title="Click to copy ID"
                    >
                      {post.postId || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-foreground-secondary select-none">Posted At (Ngày đăng)</span>
                  <div className="flex items-center gap-1.5">
                    {copiedField === 'postedAt' && (
                      <span className="text-[10px] text-success font-bold animate-pulse select-none">Copied!</span>
                    )}
                    <span 
                      onClick={() => {
                        const dateStr = post.postedAt ? new Date(post.postedAt).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A';
                        handleCopy(dateStr, 'postedAt');
                      }}
                      className="text-foreground-secondary hover:text-foreground cursor-pointer select-all transition-colors active:scale-95 text-right"
                      title="Click to copy Posted At"
                    >
                      {post.postedAt ? new Date(post.postedAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-foreground-secondary select-none">Synced At (Đồng bộ lúc)</span>
                  <div className="flex items-center gap-1.5">
                    {copiedField === 'syncedAt' && (
                      <span className="text-[10px] text-success font-bold animate-pulse select-none">Copied!</span>
                    )}
                    <span 
                      onClick={() => {
                        const dateStr = post.syncedAt ? new Date(post.syncedAt).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A';
                        handleCopy(dateStr, 'syncedAt');
                      }}
                      className="text-foreground-secondary hover:text-foreground cursor-pointer select-all transition-colors active:scale-95 text-right"
                      title="Click to copy Synced At"
                    >
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
            </div>

            <div className="h-[1px] bg-foreground/10" />

            {/* SECTION 1: REACH & VIEWS */}
            <div className="space-y-4">
              <div className="flex justify-between items-center select-none">
                <div className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-foreground">
                  <span>Reach & Views</span>
                  <svg className="w-3.5 h-3.5 text-foreground-tertiary hover:text-foreground cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-3 pl-1 select-none">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-foreground-secondary">Views (Lượt xem)</span>
                  <span className="font-bold text-foreground">{(post.views || post.reach || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-foreground-secondary">Reach (Số tài khoản tiếp cận)</span>
                  <span className="font-bold text-foreground">{(post.reach || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-foreground/5 my-1" />

            {/* SECTION 2: INTERACTIONS */}
            <div className="space-y-4">

              {/* Detail Metric list inside Interactions section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-foreground select-none">
                  <span>Reels interactions</span>
                  <span className="text-foreground font-extrabold">{(post.totalInteractions || (post.likeCount + post.commentsCount + post.sharesCount + post.savedCount)).toLocaleString()}</span>
                </div>
                
                <div className="space-y-3 pl-1">
                  {/* Likes */}
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <svg className="w-4 h-4 text-foreground-tertiary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>Likes (Lượt thích)</span>
                    </div>
                    <span className="font-bold text-foreground">{post.likeCount.toLocaleString()}</span>
                  </div>
                  {/* Comments */}
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <svg className="w-4 h-4 text-foreground-tertiary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Comments (Bình luận)</span>
                    </div>
                    <span className="font-bold text-foreground">{post.commentsCount.toLocaleString()}</span>
                  </div>
                  {/* Shares */}
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <svg className="w-4 h-4 text-foreground-tertiary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.632-2.316m0 7.148l-4.632-2.316M19 19a3 3 0 11-6 0 3 3 0 016 0zm-6-14a3 3 0 11-6 0 3 3 0 016 0zm-6 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Shares (Chia sẻ)</span>
                    </div>
                    <span className="font-bold text-foreground">{post.sharesCount.toLocaleString()}</span>
                  </div>
                  {/* Saves */}
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <svg className="w-4 h-4 text-foreground-tertiary" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span>Saves (Lưu lại)</span>
                    </div>
                    <span className="font-bold text-foreground">{post.savedCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: PROFILE CONVERSIONS */}
            {post.mediaType !== 'REELS' && post.mediaType !== 'VIDEO' && (
              <>
                <div className="h-[1px] bg-foreground/10" />

                <div className="space-y-4">
                  {/* Section Title */}
                  <div className="flex justify-between items-center select-none">
                    <div className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-foreground">
                      <span>Profile Visits & Follows</span>
                      <svg className="w-3.5 h-3.5 text-foreground-tertiary hover:text-foreground cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Detail Metrics for Profile */}
                  <div className="space-y-3.5 pl-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground-secondary">Profile Visits (Ghé thăm Profile)</span>
                      <span className="font-bold text-foreground">{(post.profileVisits || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground-secondary">Follows (Lượt theo dõi)</span>
                      <span className="font-bold text-foreground">{(post.follows || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {post.mediaType === 'REELS' && (
              <>
                <div className="h-[1px] bg-foreground/10" />

                <div className="space-y-4">
                  {/* Section Title */}
                  <div className="flex justify-between items-center select-none">
                    <div className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-primary">
                      <span>Reels Performance Details</span>
                      <svg className="w-3.5 h-3.5 text-primary/60 hover:text-primary cursor-pointer transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Detail Metrics for Reels */}
                  <div className="space-y-3.5 pl-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground-secondary">Average Watch Time (Thời gian xem TB)</span>
                      <span className="font-bold text-foreground">
                        {post.igReelsAvgWatchTime ? `${(post.igReelsAvgWatchTime / 1000).toFixed(2)}s` : '0.00s'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground-secondary">Total Play Time (Tổng thời gian phát)</span>
                      <span className="font-bold text-foreground">
                        {post.igReelsVideoViewTotalTime ? formatPlayTime(post.igReelsVideoViewTotalTime) : '0s'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground-secondary">3s Skip Rate (Tỷ lệ bỏ qua trong 3s)</span>
                      <span className="font-bold text-foreground">
                        {post.reelsSkipRate ? `${post.reelsSkipRate.toFixed(1)}%` : '0.0%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-foreground-secondary">Facebook Views (Lượt xem trên FB)</span>
                      <span className="font-bold text-foreground">
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
    </div>
  );
}
