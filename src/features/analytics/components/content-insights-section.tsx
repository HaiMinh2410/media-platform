'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTopPostsAction } from '@features/analytics/actions/analytics.actions';
import { PostDetailModal } from './post-detail-modal';

// Media type filter definitions with inline beautiful SVGs
const MEDIA_FILTERS = [
  { 
    id: 'all', 
    label: 'All', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="21" y1="12" x2="3" y2="12"/>
        <line x1="12" y1="21" x2="12" y2="3"/>
      </svg>
    )
  },
  { 
    id: 'image', 
    label: 'Images', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    )
  },
  { 
    id: 'reels', 
    label: 'Reels', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="2" y1="7" x2="7" y2="7"/>
        <line x1="2" y1="17" x2="7" y2="17"/>
        <line x1="17" y1="17" x2="22" y2="17"/>
        <line x1="17" y1="7" x2="22" y2="7"/>
      </svg>
    )
  },
  { 
    id: 'carousel', 
    label: 'Carousels', 
    icon: (className?: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    )
  },
];

const METRIC_FILTERS = [
  { id: 'views', label: 'Views' },
  { id: 'interactions', label: 'Interactions' },
  { id: 'reach', label: 'Reach' },
  { id: 'likes', label: 'Likes' },
  { id: 'shares', label: 'Shares' },
  { id: 'profile_visits', label: 'Profile Visits' },
  { id: 'follows', label: 'Follows' },
];

const ORDER_FILTERS = [
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
  { id: 'newest', label: 'Newest' },
];

const RANGE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: '7d', label: 'Last 7 days' },
  { id: '14d', label: 'Last 14 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'custom', label: 'Custom Period' },
];

const formatMetricValue = (val: number): string => {
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'K';
  return val.toString();
};

export function ContentInsightsSection({
  accountId
}: {
  accountId: string;
}) {
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'reels' | 'carousel'>('all');
  const [metricFilter, setMetricFilter] = useState<'views' | 'interactions' | 'reach' | 'likes' | 'shares' | 'profile_visits' | 'follows'>('views');
  const [orderFilter, setOrderFilter] = useState<'highest' | 'lowest' | 'newest'>('highest');
  const [rangeFilter, setRangeFilter] = useState<'all' | '7d' | '14d' | '30d' | '90d' | 'custom'>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<'media' | 'metric' | 'order' | 'range' | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: result, isPending, isError } = useQuery({
    queryKey: ['content-insights-posts', accountId, metricFilter, rangeFilter, customStart, customEnd],
    queryFn: () => {
      const start = rangeFilter === 'custom' && customStart ? new Date(customStart) : undefined;
      const end = rangeFilter === 'custom' && customEnd ? new Date(customEnd) : undefined;
      return getTopPostsAction(accountId, rangeFilter as any, start, end, metricFilter, 100);
    },
    staleTime: 5 * 60 * 1000,
  });

  const posts = result?.data || [];

  const processedPosts = useMemo(() => {
    let filtered = [...posts];

    // 1. Filter by range
    if (rangeFilter !== 'all') {
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (rangeFilter === 'custom') {
        if (customStart) {
          startDate = new Date(customStart);
          startDate.setHours(0, 0, 0, 0);
        }
        if (customEnd) {
          endDate = new Date(customEnd);
          endDate.setHours(23, 59, 59, 999);
        }
      } else {
        const now = new Date();
        let days = 30;
        if (rangeFilter === '7d') days = 7;
        else if (rangeFilter === '14d') days = 14;
        else if (rangeFilter === '90d') days = 90;

        startDate = new Date();
        startDate.setDate(now.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
      }

      filtered = filtered.filter(p => {
        const postedAt = new Date(p.postedAt);
        if (startDate && postedAt < startDate) return false;
        if (endDate && postedAt > endDate) return false;
        return true;
      });
    }

    // 2. Filter by media type
    if (mediaFilter !== 'all') {
      filtered = filtered.filter(p => {
        const type = p.mediaType?.toUpperCase();
        if (mediaFilter === 'image') return type === 'IMAGE';
        if (mediaFilter === 'reels') return type === 'REELS';
        if (mediaFilter === 'carousel') return type === 'CAROUSEL_ALBUM';
        return true;
      });
    }

    // 3. Sort by order
    if (orderFilter === 'lowest') {
      filtered.reverse();
    } else if (orderFilter === 'newest') {
      filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }

    return filtered;
  }, [posts, mediaFilter, orderFilter, rangeFilter, customStart, customEnd]);

  const getMetricValue = (post: any) => {
    const likes = post.likeCount || 0;
    const comments = post.commentsCount || 0;
    const shares = post.sharesCount || 0;
    const saves = post.savedCount || 0;
    const baseInteractions = likes + comments + shares + saves;

    switch (metricFilter) {
      case 'views': return post.views || post.reach || 0;
      case 'interactions': return post.totalInteractions > 0 ? post.totalInteractions : baseInteractions;
      case 'reach': return post.reach || 0;
      case 'likes': return likes;
      case 'shares': return shares;
      case 'profile_visits': return post.profileVisits || 0;
      case 'follows': return post.follows || 0;
      default: return 0;
    }
  };

  const renderMediaPreview = (post: any) => {
    const isVideo = post.mediaType === 'VIDEO' || post.mediaType === 'REELS';
    const url = post.mediaUrl || post.thumbnailUrl;
    
    if (isVideo && post.mediaUrl) {
      return (
        <div className="relative w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center group/player">
          <video 
            src={post.mediaUrl} 
            controls 
            className="max-h-[500px] w-full object-contain rounded-2xl"
            poster={post.thumbnailUrl}
            autoPlay
            muted
            loop
          />
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-xs font-bold text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
            {post.mediaType}
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-full rounded-2xl overflow-hidden bg-black/20 flex items-center justify-center border border-white/5">
        {url ? (
          <img 
            src={url} 
            alt="Post media preview" 
            className="max-h-[500px] w-full object-contain rounded-2xl"
          />
        ) : (
          <div className="text-white/20 text-sm font-bold uppercase tracking-widest">{post.mediaType}</div>
        )}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-xs font-bold text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
          {post.mediaType}
        </div>
      </div>
    );
  };

  const selectedMedia = MEDIA_FILTERS.find(m => m.id === mediaFilter);
  const selectedMetric = METRIC_FILTERS.find(m => m.id === metricFilter);
  const selectedOrder = ORDER_FILTERS.find(o => o.id === orderFilter);
  const selectedRange = RANGE_FILTERS.find(r => r.id === rangeFilter);

  return (
    <div className="bg-[#0b0c0e] min-h-[600px] text-white p-6 font-sans rounded-3xl border border-white/5 shadow-2xl relative transition-all duration-300">
      <div className="flex flex-col gap-6" ref={dropdownRef}>
        {/* Title Row */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Content insights</h2>
          <p className="text-white/40 text-xs mt-1">Phân tích hiệu suất truyền thông bài viết trọn đời</p>
        </div>

        {/* Dropdowns Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative select-none">
          <div className="flex items-center gap-3">
            {/* Media filter pill */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'media' ? null : 'media')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4.5 py-2 text-xs font-bold text-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
              >
                {selectedMedia?.icon('w-3.5 h-3.5 text-white/80')}
                <span>{selectedMedia?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${activeDropdown === 'media' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'media' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[110%] left-0 bg-[#141416] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[140px] flex flex-col gap-0.5 backdrop-blur-xl"
                  >
                    {MEDIA_FILTERS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMediaFilter(m.id as any);
                          setActiveDropdown(null);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                          mediaFilter === m.id
                            ? 'text-white bg-white/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {m.icon('w-3.5 h-3.5')}
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Metric filter pill */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'metric' ? null : 'metric')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4.5 py-2 text-xs font-bold text-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
              >
                <span>{selectedMetric?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${activeDropdown === 'metric' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'metric' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[110%] left-0 bg-[#141416] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[160px] flex flex-col gap-0.5 backdrop-blur-xl"
                  >
                    {METRIC_FILTERS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMetricFilter(m.id as any);
                          setActiveDropdown(null);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                          metricFilter === m.id
                            ? 'text-white bg-white/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order filter pill */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'order' ? null : 'order')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4.5 py-2 text-xs font-bold text-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
              >
                <span>{selectedOrder?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${activeDropdown === 'order' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'order' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[110%] left-0 bg-[#141416] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[120px] flex flex-col gap-0.5 backdrop-blur-xl"
                  >
                    {ORDER_FILTERS.map(o => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setOrderFilter(o.id as any);
                          setActiveDropdown(null);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                          orderFilter === o.id
                            ? 'text-white bg-white/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Range filter pill & Custom Date inputs */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {rangeFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                />
                <span className="text-white/20 text-xs">→</span>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none [color-scheme:dark]"
                />
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'range' ? null : 'range')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4.5 py-2 text-xs font-bold text-white/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
              >
                <Calendar className="w-3.5 h-3.5 text-white/80" />
                <span>{selectedRange?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${activeDropdown === 'range' ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeDropdown === 'range' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[110%] right-0 bg-[#141416] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[145px] flex flex-col gap-0.5 backdrop-blur-xl"
                  >
                    {RANGE_FILTERS.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRangeFilter(r.id as any);
                          setActiveDropdown(null);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          rangeFilter === r.id
                            ? 'text-white bg-white/10'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{r.label}</span>
                        {rangeFilter === r.id && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {isPending ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="w-full min-h-[300px] flex items-center justify-center border border-dashed border-white/5 rounded-3xl text-white/30 text-sm">
          Lỗi khi tải dữ liệu bài viết
        </div>
      ) : processedPosts.length === 0 ? (
        <div className="w-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl text-white/30 text-sm py-12">
          <svg className="w-12 h-12 opacity-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Không tìm thấy bài viết nào phù hợp
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-4">
          {processedPosts.map((post: any, index: number) => {
            const displayUrl = post.thumbnailUrl || post.mediaUrl;
            const value = getMetricValue(post);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.3 }}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square rounded-[24px] overflow-hidden border border-white/5 bg-white/5 shadow-lg group cursor-pointer"
              >
                {displayUrl ? (
                  <Image
                    src={displayUrl}
                    alt="Thumbnail"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, 250px"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-[10px] font-bold text-white/30 tracking-widest uppercase">
                    {post.mediaType}
                  </div>
                )}

                {/* Gradient shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Format icon */}
                {post.mediaType === 'CAROUSEL_ALBUM' ? (
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md rounded-lg p-1.5 border border-white/10 shadow-lg flex items-center justify-center text-white">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </div>
                ) : post.mediaType === 'VIDEO' || post.mediaType === 'REELS' ? (
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md rounded-lg p-1.5 border border-white/10 shadow-lg flex items-center justify-center text-white">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ) : null}

                {/* White transparent pill badge (Image 2 style) */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md text-black font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 select-none min-w-[55px] text-center">
                  {formatMetricValue(value)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Instagram-style Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
