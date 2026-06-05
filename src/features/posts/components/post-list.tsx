'use client';

import { SlidingTabs } from "@shared/ui";
import { cn } from "@shared/lib";

import React, { useState } from 'react';
import { Post, PostStatus } from '@features/posts/types';
import { PostCard } from './post-card';
import { PostEmptyState } from './post-empty-state';
import { Search, Loader2, RefreshCw } from 'lucide-react';

import { BatchPublishSummary, BatchPublishCard } from './publisher/batch-publish-card';
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
  const supabase = createClient();

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

  const filteredPosts = posts.filter(post => {
    const matchesStatus = filter === 'all' || post.status === filter;
    const matchesSearch = post.content?.toLowerCase().includes(search.toLowerCase()) || 
                         post.title?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredHistory = history.filter(batch => {
    const matchesStatus = filter === 'all' || 
                         (filter === 'published' && batch.status === 'SUCCESS') ||
                         (filter === 'failed' && (batch.status === 'FAILED' || batch.status === 'PARTIAL')) ||
                         (filter === 'scheduled' && batch.status === 'SCHEDULED');
    const matchesSearch = batch.content?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
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
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={14} />
            <input 
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-base-100 border border-base-content/10 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 rounded-xl pl-10 pr-4 py-2 text-sm text-base-content transition-all"
            />
          </div>
          
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
              <BatchPublishCard batch={batch} workspaceId={workspaceId} />
            </div>
          ))}
          {filteredPosts.map((post) => (
            <div key={post.id} className="break-inside-avoid mb-6 inline-block w-full">
              <PostCard post={post} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      ) : (
        <PostEmptyState 
          hasFilters={filter !== 'all' || search !== ''} 
          onClear={() => { setFilter('all'); setSearch(''); }} 
        />
      )}
    </div>
  );
}
