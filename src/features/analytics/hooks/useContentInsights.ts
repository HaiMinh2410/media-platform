/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTopPostsAction } from '@features/analytics/actions/analytics.actions';

export const formatMetricValue = (val: number): string => {
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'K';
  return val.toString();
};

export interface UseContentInsightsProps {
  accountId: string;
}

export function useContentInsights({ accountId }: UseContentInsightsProps) {
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

  const processedPosts = useMemo(() => {
    const posts = result?.data || [];
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
  }, [result?.data, mediaFilter, orderFilter, rangeFilter, customStart, customEnd]);

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

  return {
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
    selectedPost,
    setSelectedPost,
    processedPosts,
    getMetricValue,
    isPending,
    isError,
    dropdownRef,
  };
}
