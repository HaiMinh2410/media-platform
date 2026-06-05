'use client';

import { SlidingTabs, FilterGroup } from "@shared/ui";
import { cn } from "@shared/lib";

import React, { useState } from 'react';
import { ClusterSelector } from '@features/inbox/components/cluster-selector';
import { DoubleCalendarPicker } from '@features/leads/components/double-calendar-picker';
import { useInboxStore } from '@features/inbox/store/inbox.store';
import { Post, PostStatus } from '@features/posts/types';
import { PostCard, BatchPublishSummary } from './post-card';
import { PostEmptyState } from './post-empty-state';
import { Loader2, RefreshCw } from 'lucide-react';

import { createClient } from '@shared/api/supabase/client';
import { useEffect } from 'react';

type PostListProps = {
  initialPosts: (Post & { account?: { name: string; platform: string; avatarUrl?: string } })[];
  initialHistory?: BatchPublishSummary[];
  workspaceId: string;
};

export function PostList({ initialPosts, initialHistory = [], workspaceId }: PostListProps) {
  const [posts, setPosts] = useState<(Post & { account?: { name: string; platform: string; avatarUrl?: string } })[]>(initialPosts);
  const [history, setHistory] = useState<BatchPublishSummary[]>(initialHistory);
  const [filter, setFilter] = useState<PostStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ date: string }>({ date: 'all' });
  const { accountGroups } = useInboxStore();
  const supabase = createClient();

  const onChangeGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
  };

  const onFilterChange = (key: 'date', value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const checkMatchesDate = (dateVal: Date | string | null | undefined) => {
    if (filters.date === 'all') return true;
    if (!dateVal) return false;

    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return false;
    
    dateObj.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const referenceToday = now.getFullYear() >= 2026 ? now : new Date(2026, 4, 28);
    referenceToday.setHours(0, 0, 0, 0);

    const getFormattedDate = (d: Date) => {
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const dateValFormatted = getFormattedDate(dateObj);

    if (filters.date === 'Hôm nay') {
      return dateValFormatted === getFormattedDate(referenceToday);
    } else if (filters.date === 'Hôm qua') {
      const yesterday = new Date(referenceToday);
      yesterday.setDate(referenceToday.getDate() - 1);
      return dateValFormatted === getFormattedDate(yesterday);
    } else if (filters.date === '7 ngày qua') {
      const past7Days = new Date(referenceToday);
      past7Days.setDate(referenceToday.getDate() - 7);
      return dateObj >= past7Days && dateObj <= referenceToday;
    } else if (filters.date === '14 ngày qua') {
      const past14Days = new Date(referenceToday);
      past14Days.setDate(referenceToday.getDate() - 14);
      return dateObj >= past14Days && dateObj <= referenceToday;
    } else if (filters.date === '30 ngày qua') {
      const past30Days = new Date(referenceToday);
      past30Days.setDate(referenceToday.getDate() - 30);
      return dateObj >= past30Days && dateObj <= referenceToday;
    } else if (filters.date === '90 ngày qua') {
      const past90Days = new Date(referenceToday);
      past90Days.setDate(referenceToday.getDate() - 90);
      return dateObj >= past90Days && dateObj <= referenceToday;
    } else if (filters.date === 'Tháng này') {
      return (
        dateObj.getMonth() === referenceToday.getMonth() &&
        dateObj.getFullYear() === referenceToday.getFullYear()
      );
    } else if (filters.date.includes(' - ')) {
      const parts = filters.date.split(' - ');
      const startParts = parts[0].split('/');
      const endParts = parts[1].split('/');
      
      const startDate = new Date(
        parseInt(startParts[2]),
        parseInt(startParts[1]) - 1,
        parseInt(startParts[0])
      );
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(
        parseInt(endParts[2]),
        parseInt(endParts[1]) - 1,
        parseInt(endParts[0])
      );
      endDate.setHours(23, 59, 59, 999);

      return dateObj >= startDate && dateObj <= endDate;
    } else {
      return dateValFormatted === filters.date;
    }
  };

  useEffect(() => {
    // Subscribe to realtime updates for publish_jobs
    const channel = supabase
      .channel('public:publish_jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'publish_jobs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newJob = payload.new as any;
            setHistory((prev) => {
              const bId = newJob.batch_id || newJob.id;
              const existingBatch = prev.find(b => b.batchId === bId);
              
              if (existingBatch) {
                // If batch exists, just add the account if not already there
                return prev.map(b => {
                  if (b.batchId === bId) {
                    if (b.accounts.some(a => a.id === newJob.account_id)) return b;
                    return {
                      ...b,
                      accounts: [...b.accounts, {
                        id: newJob.account_id,
                        name: 'Loading...', // Temporary until refresh
                        platform: newJob.platform,
                        status: 'SCHEDULED'
                      }]
                    };
                  }
                  return b;
                });
              } else {
                // Create new batch entry
                const newBatch: BatchPublishSummary = {
                  id: newJob.id,
                  batchId: bId,
                  content: newJob.content || '',
                  mediaUrls: newJob.media_urls || [],
                  createdAt: new Date(newJob.created_at),
                  status: 'SCHEDULED',
                  accounts: [{
                    id: newJob.account_id,
                    name: 'Loading...', 
                    platform: newJob.platform,
                    status: 'SCHEDULED'
                  }]
                };
                return [newBatch, ...prev];
              }
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as any;
            
            setHistory((prev) => {
              return prev.map((batch) => {
                if (batch.batchId !== (updatedJob.batch_id || updatedJob.id)) {
                  return batch;
                }

                // Find and update the specific account
                const updatedAccounts = batch.accounts.map((acc) => {
                  if (acc.id === updatedJob.account_id) {
                    let accountStatus: 'SUCCESS' | 'FAILED' | 'SCHEDULED' = 'FAILED';
                    if (updatedJob.status === 'COMPLETED') accountStatus = 'SUCCESS';
                    else if (updatedJob.status === 'PENDING' && updatedJob.scheduled_at) accountStatus = 'SCHEDULED';
                    else if (updatedJob.status === 'PENDING' || updatedJob.status === 'RUNNING') accountStatus = 'SCHEDULED';
                    
                    return { ...acc, status: accountStatus };
                  }
                  return acc;
                });

                // Recalculate aggregate status
                const total = updatedAccounts.length;
                const success = updatedAccounts.filter((a) => a.status === 'SUCCESS').length;
                const failed = updatedAccounts.filter((a) => a.status === 'FAILED').length;
                const scheduled = updatedAccounts.filter((a) => a.status === 'SCHEDULED').length;

                let newBatchStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SCHEDULED' = 'FAILED';
                if (scheduled > 0) newBatchStatus = 'SCHEDULED';
                else if (success === total) newBatchStatus = 'SUCCESS';
                else if (failed === total) newBatchStatus = 'FAILED';
                else newBatchStatus = 'PARTIAL';

                return {
                  ...batch,
                  status: newBatchStatus,
                  accounts: updatedAccounts
                };
              });
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?workspaceId=${workspaceId}`);
      const result = await res.json();
      if (result.data) {
        setPosts(result.data);
      }
      
      // Also refresh history manually if needed
      const historyRes = await fetch(`/api/publish/history?workspaceId=${workspaceId}`);
      const historyResult = await historyRes.json();
      if (historyResult.data) {
        setHistory(historyResult.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGroup = accountGroups.find((g) => g.id === selectedGroupId);
  const groupAccountIds = selectedGroup ? selectedGroup.members.map((m) => m.id) : [];

  const filteredPosts = posts.filter(post => {
    const matchesStatus = filter === 'all' || post.status === filter;
    const matchesSearch = post.content?.toLowerCase().includes(search.toLowerCase()) || 
                         post.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCluster = !selectedGroupId || groupAccountIds.includes(post.accountId);
    const matchesDate = checkMatchesDate(post.createdAt || post.scheduledAt || post.publishedAt);
    return matchesStatus && matchesSearch && matchesCluster && matchesDate;
  });

  const filteredHistory = history.filter(batch => {
    const matchesStatus = filter === 'all' || 
                         (filter === 'published' && batch.status === 'SUCCESS') ||
                         (filter === 'failed' && (batch.status === 'FAILED' || batch.status === 'PARTIAL')) ||
                         (filter === 'scheduled' && batch.status === 'SCHEDULED');
    const matchesSearch = batch.content?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCluster = !selectedGroupId || !selectedGroup || batch.accounts.some(acc => 
      selectedGroup.members.some(member => 
        (acc.platformId && member.externalId === acc.platformId && member.platform.toLowerCase() === acc.platform.toLowerCase()) ||
        (member.name.toLowerCase() === acc.name.toLowerCase() && member.platform.toLowerCase() === acc.platform.toLowerCase()) ||
        member.id === acc.id
      )
    );
    
    const matchesDate = checkMatchesDate(batch.createdAt || batch.scheduledAt);
    return matchesStatus && matchesSearch && matchesCluster && matchesDate;
  });

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <SlidingTabs
          items={[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'published', label: 'Published' },
            { value: 'failed', label: 'Failed' },
          ]}
          activeValue={filter}
          onChange={(val) => setFilter(val as PostStatus | 'all')}
          size="sm"
          layoutId="postListFilterTabs"
        />

        <div className="flex items-center gap-3">
          <FilterGroup>
            <ClusterSelector
              workspaceId={workspaceId}
              selectedGroupId={selectedGroupId}
              onChangeGroup={onChangeGroup}
              triggerClassName={cn(
                "btn btn-soft btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
                selectedGroupId &&
                  "text-primary bg-primary/10 font-bold hover:bg-primary/15",
              )}
            />

            {/* Bộ lọc Chọn ngày (Double Calendar Picker) */}
            <DoubleCalendarPicker
              selectedDate={filters.date}
              onSelectDate={(date) => onFilterChange("date", date)}
              triggerClassName={cn(
                "btn btn-ghost btn-sm bg-transparent hover:bg-base-100/60 rounded-sm border-none text-xs text-base-content/80",
                filters.date !== "all" &&
                  "text-primary bg-primary/10 font-bold hover:bg-primary/15",
              )}
            />
          </FilterGroup>
          
          <button 
            onClick={fetchPosts}
            disabled={isLoading}
            className="btn btn-ghost border border-base-content/5 bg-base-200/30 hover:bg-base-200 rounded-xl p-2.5 text-base-content/60 hover:text-base-content transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          </button>
        </div>
      </div>

      {/* Grid */}
      {(filteredPosts.length > 0 || filteredHistory.length > 0) ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:balance] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredHistory.map((batch) => (
            <div key={batch.batchId} className="break-inside-avoid mb-6 inline-block w-full">
              <PostCard batch={batch} workspaceId={workspaceId} />
            </div>
          ))}
          {filteredPosts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-6 inline-block w-full">
              <PostCard post={post} onDelete={handleDelete} workspaceId={workspaceId} />
            </div>
          ))}
        </div>
      ) : (
        <PostEmptyState 
          hasFilters={filter !== 'all' || search !== '' || selectedGroupId !== null || filters.date !== 'all'} 
          onClear={() => { 
            setFilter('all'); 
            setSearch(''); 
            setSelectedGroupId(null);
            setFilters({ date: 'all' });
          }} 
        />
      )}
    </div>
  );
}
