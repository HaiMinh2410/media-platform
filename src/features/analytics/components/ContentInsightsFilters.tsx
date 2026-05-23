import React from 'react';
import { RangeSelector } from '@shared/ui/range-selector';
import { LayoutGrid, Image, Clapperboard, Layers } from 'lucide-react';

export const MEDIA_FILTERS = [
  { 
    id: 'all', 
    label: 'All', 
    icon: (className?: string) => <LayoutGrid className={className} strokeWidth={2.5} />
  },
  { 
    id: 'image', 
    label: 'Images', 
    icon: (className?: string) => <Image className={className} strokeWidth={2.5} />
  },
  { 
    id: 'reels', 
    label: 'Reels', 
    icon: (className?: string) => <Clapperboard className={className} strokeWidth={2.5} />
  },
  { 
    id: 'carousel', 
    label: 'Carousels', 
    icon: (className?: string) => <Layers className={className} strokeWidth={2.5} />
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
  { id: 'newest', label: 'Newest' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
];

interface ContentInsightsFiltersProps {
  mediaFilter: 'all' | 'image' | 'reels' | 'carousel';
  setMediaFilter: (filter: 'all' | 'image' | 'reels' | 'carousel') => void;
  metricFilter: 'views' | 'interactions' | 'reach' | 'likes' | 'shares' | 'profile_visits' | 'follows';
  setMetricFilter: (filter: 'views' | 'interactions' | 'reach' | 'likes' | 'shares' | 'profile_visits' | 'follows') => void;
  orderFilter: 'newest' | 'highest' | 'lowest';
  setOrderFilter: (filter: 'newest' | 'highest' | 'lowest') => void;
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
  activeDropdown,
  setActiveDropdown,
}: ContentInsightsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative select-none">
      <div className="flex items-center gap-2">
        {/* Media filter pill */}
        <RangeSelector 
          value={mediaFilter}
          onChange={setMediaFilter}
          options={MEDIA_FILTERS}
          isOpen={activeDropdown === 'media'}
          onOpenChange={(open) => setActiveDropdown(open ? 'media' : null)}
          menuMinWidth="min-w-[140px]"
        />

        {/* Metric filter pill */}
        <RangeSelector 
          value={metricFilter}
          onChange={setMetricFilter}
          options={METRIC_FILTERS}
          isOpen={activeDropdown === 'metric'}
          onOpenChange={(open) => setActiveDropdown(open ? 'metric' : null)}
          hideIcon={true}
          menuMinWidth="min-w-[160px]"
        />

        {/* Order filter pill */}
        <RangeSelector 
          value={orderFilter}
          onChange={setOrderFilter}
          options={ORDER_FILTERS}
          isOpen={activeDropdown === 'order'}
          onOpenChange={(open) => setActiveDropdown(open ? 'order' : null)}
          hideIcon={true}
          menuMinWidth="min-w-[120px]"
        />
      </div>
    </div>
  );
}
