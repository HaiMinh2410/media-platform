'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTopPostsAction } from '@/application/actions/analytics.actions';

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
  const [orderFilter, setOrderFilter] = useState<'highest' | 'lowest'>('highest');
  const [activeDropdown, setActiveDropdown] = useState<'media' | 'metric' | 'order' | null>(null);
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
    queryKey: ['content-insights-posts', accountId, metricFilter],
    queryFn: () => getTopPostsAction(accountId, '90d', undefined, undefined, metricFilter, 100),
    staleTime: 5 * 60 * 1000,
  });

  const posts = result?.data || [];

  const processedPosts = useMemo(() => {
    let filtered = [...posts];

    if (mediaFilter !== 'all') {
      filtered = filtered.filter(p => {
        const type = p.mediaType?.toUpperCase();
        if (mediaFilter === 'image') return type === 'IMAGE';
        if (mediaFilter === 'reels') return type === 'REELS';
        if (mediaFilter === 'carousel') return type === 'CAROUSEL_ALBUM';
        return true;
      });
    }

    if (orderFilter === 'lowest') {
      filtered.reverse();
    }

    return filtered;
  }, [posts, mediaFilter, orderFilter]);

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

  return (
    <div className="bg-[#0b0c0e] min-h-[600px] text-white p-6 font-sans rounded-3xl border border-white/5 shadow-2xl relative transition-all duration-300">
      <div className="flex flex-col gap-6" ref={dropdownRef}>
        {/* Title Row */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Content insights</h2>
          <p className="text-white/40 text-xs mt-1">Phân tích hiệu suất truyền thông bài viết trọn đời</p>
        </div>

        {/* Dropdowns Filter Row */}
        <div className="flex items-center gap-3 relative select-none">
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

      {/* Split-screen Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-10 select-none">
            {/* Backdrop cover */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-5xl bg-[#101012] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col md:grid md:grid-cols-12 min-h-[500px] max-h-[85vh] text-white select-text"
            >
              {/* Left Column: Media Preview */}
              <div className="md:col-span-5 p-6 bg-black/40 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/5 select-none">
                {renderMediaPreview(selectedPost)}
              </div>

              {/* Right Column: Statistics Panel */}
              <div className="md:col-span-7 p-6 md:p-8 flex flex-col h-full overflow-hidden max-h-[85vh]">
                {/* Header Section */}
                <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-white/5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00bcd4] bg-[#00bcd4]/10 px-2.5 py-1 rounded-md border border-[#00bcd4]/20 select-none">
                      Bài viết chi tiết
                    </span>
                    <div className="text-white/40 text-[11px] mt-2.5 font-medium flex items-center gap-1.5 select-none">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>Đã đăng ngày {new Date(selectedPost.postedAt).toLocaleDateString('vi-VN', { dateStyle: 'long' })}</span>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="bg-white/5 hover:bg-white/10 hover:text-white text-white/60 p-2.5 rounded-full border border-white/10 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 select-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Scrollable Metrics Sheet */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* Caption block */}
                  {selectedPost.caption && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider select-none">Nội dung caption</h4>
                      <p className="text-sm font-medium leading-relaxed text-white/90 bg-white/5 p-4 rounded-2xl border border-white/5 max-h-[110px] overflow-y-auto whitespace-pre-wrap">
                        {selectedPost.caption}
                      </p>
                    </div>
                  )}

                  {/* Block 1: Reach & views */}
                  <div className="space-y-3 pb-5 border-b border-white/5">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider select-none">Chỉ số tiếp cận & hiển thị</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/5 p-4.5 rounded-2xl flex items-center gap-4 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#00c853]/15 text-[#00c853] p-3 rounded-xl">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white/40">Lượt xem (Views)</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.views || selectedPost.reach)}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4.5 rounded-2xl flex items-center gap-4 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#2979ff]/15 text-[#2979ff] p-3 rounded-xl">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white/40">Số tài khoản tiếp cận (Reach)</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.reach)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Main Interactions */}
                  <div className="space-y-3 pb-5 border-b border-white/5">
                    <div className="flex justify-between items-center select-none">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Tương tác chi tiết</h4>
                      <span className="text-[11px] text-white/60 font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 select-text">
                        Tổng: {formatMetricValue(selectedPost.totalInteractions || (selectedPost.likeCount + selectedPost.commentsCount + selectedPost.sharesCount + selectedPost.savedCount))}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3.5 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#ff1744]/15 text-[#ff1744] p-2.5 rounded-xl">
                          <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/40">Lượt thích</div>
                          <div className="text-lg font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.likeCount)}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3.5 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#ff9100]/15 text-[#ff9100] p-2.5 rounded-xl">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/40">Bình luận</div>
                          <div className="text-lg font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.commentsCount)}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3.5 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#00e5ff]/15 text-[#00e5ff] p-2.5 rounded-xl">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.632-2.316m0 7.148l-4.632-2.316M19 19a3 3 0 11-6 0 3 3 0 016 0zm-6-14a3 3 0 11-6 0 3 3 0 016 0zm-6 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/40">Chia sẻ</div>
                          <div className="text-lg font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.sharesCount)}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3.5 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#ea80fc]/15 text-[#ea80fc] p-2.5 rounded-xl">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/40">Lưu lại</div>
                          <div className="text-lg font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.savedCount)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 3: Profile and Followers conversions */}
                  <div className="space-y-3 pb-2">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider select-none">Hành vi chuyển đổi khán giả</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 border border-white/5 p-4.5 rounded-2xl flex items-center gap-4 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#651fff]/15 text-[#651fff] p-3 rounded-xl">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/40">Ghé thăm Profile</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.profileVisits)}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4.5 rounded-2xl flex items-center gap-4 hover:bg-white/8 hover:border-white/10 transition-all select-none">
                        <div className="bg-[#f50057]/15 text-[#f50057] p-3 rounded-xl">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/40">Follower mới</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5 select-text">{formatMetricValue(selectedPost.follows)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
