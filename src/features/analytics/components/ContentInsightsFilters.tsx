import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar } from 'lucide-react';

export const MEDIA_FILTERS = [
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

export const METRIC_FILTERS = [
  { id: 'views', label: 'Views' },
  { id: 'interactions', label: 'Interactions' },
  { id: 'reach', label: 'Reach' },
  { id: 'likes', label: 'Likes' },
  { id: 'shares', label: 'Shares' },
  { id: 'profile_visits', label: 'Profile Visits' },
  { id: 'follows', label: 'Follows' },
];

export const ORDER_FILTERS = [
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
  { id: 'newest', label: 'Newest' },
];

export const RANGE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: '7d', label: 'Last 7 days' },
  { id: '14d', label: 'Last 14 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'custom', label: 'Custom Period' },
];

interface ContentInsightsFiltersProps {
  mediaFilter: 'all' | 'image' | 'reels' | 'carousel';
  setMediaFilter: (filter: 'all' | 'image' | 'reels' | 'carousel') => void;
  metricFilter: 'views' | 'interactions' | 'reach' | 'likes' | 'shares' | 'profile_visits' | 'follows';
  setMetricFilter: (filter: 'views' | 'interactions' | 'reach' | 'likes' | 'shares' | 'profile_visits' | 'follows') => void;
  orderFilter: 'highest' | 'lowest' | 'newest';
  setOrderFilter: (filter: 'highest' | 'lowest' | 'newest') => void;
  rangeFilter: 'all' | '7d' | '14d' | '30d' | '90d' | 'custom';
  setRangeFilter: (filter: 'all' | '7d' | '14d' | '30d' | '90d' | 'custom') => void;
  customStart: string;
  setCustomStart: (val: string) => void;
  customEnd: string;
  setCustomEnd: (val: string) => void;
  activeDropdown: 'media' | 'metric' | 'order' | 'range' | null;
  setActiveDropdown: (val: 'media' | 'metric' | 'order' | 'range' | null) => void;
}

export function ContentInsightsFilters({
  mediaFilter,
  setMediaFilter,
  metricFilter,
  setMetricFilter,
  orderFilter,
  setOrderFilter,
  rangeFilter,
  setRangeFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  activeDropdown,
  setActiveDropdown,
}: ContentInsightsFiltersProps) {
  const selectedMedia = MEDIA_FILTERS.find(m => m.id === mediaFilter);
  const selectedMetric = METRIC_FILTERS.find(m => m.id === metricFilter);
  const selectedOrder = ORDER_FILTERS.find(o => o.id === orderFilter);
  const selectedRange = RANGE_FILTERS.find(r => r.id === rangeFilter);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative select-none">
      <div className="flex items-center gap-3">
        {/* Media filter pill */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'media' ? null : 'media')}
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-full px-4.5 py-2 text-xs font-bold text-foreground/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
          >
            {selectedMedia?.icon('w-3.5 h-3.5 text-foreground/80')}
            <span>{selectedMedia?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform duration-200 ${activeDropdown === 'media' ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {activeDropdown === 'media' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[110%] left-0 bg-base-200/95 border border-foreground/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[140px] flex flex-col gap-0.5 backdrop-blur-xl"
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
                        ? 'text-foreground bg-foreground/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
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
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-full px-4.5 py-2 text-xs font-bold text-foreground/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
          >
            <span>{selectedMetric?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform duration-200 ${activeDropdown === 'metric' ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {activeDropdown === 'metric' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[110%] left-0 bg-base-200/95 border border-foreground/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[160px] flex flex-col gap-0.5 backdrop-blur-xl"
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
                        ? 'text-foreground bg-foreground/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
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
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-full px-4.5 py-2 text-xs font-bold text-foreground/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
          >
            <span>{selectedOrder?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform duration-200 ${activeDropdown === 'order' ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {activeDropdown === 'order' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[110%] left-0 bg-base-200/95 border border-foreground/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[120px] flex flex-col gap-0.5 backdrop-blur-xl"
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
                        ? 'text-foreground bg-foreground/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
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
          <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-full px-3 py-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent text-xs text-foreground outline-none scheme-dark"
            />
            <span className="text-foreground/20 text-xs">→</span>
            <input 
              type="date" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent text-xs text-foreground outline-none scheme-dark"
            />
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'range' ? null : 'range')}
            className="bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-full px-4.5 py-2 text-xs font-bold text-foreground/90 flex items-center gap-2 transition-all cursor-pointer shadow-inner"
          >
            <Calendar className="w-3.5 h-3.5 text-foreground/80" />
            <span>{selectedRange?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-foreground/40 transition-transform duration-200 ${activeDropdown === 'range' ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {activeDropdown === 'range' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[110%] right-0 bg-base-200/95 border border-foreground/10 rounded-2xl p-1.5 shadow-2xl z-50 min-w-[145px] flex flex-col gap-0.5 backdrop-blur-xl"
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
                        ? 'text-foreground bg-foreground/10'
                        : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                    }`}
                  >
                    <span>{r.label}</span>
                    {rangeFilter === r.id && (
                      <svg className="w-3.5 h-3.5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
  );
}
