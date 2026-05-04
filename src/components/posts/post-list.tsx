'use client';

import React, { useState } from 'react';
import { Post, PostStatus } from '@/domain/types/posts';
import { PostCard } from './post-card';
import { PostEmptyState } from './post-empty-state';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type PostListProps = {
  initialPosts: Post[];
  workspaceId: string;
};

export function PostList({ initialPosts, workspaceId }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filter, setFilter] = useState<PostStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?workspaceId=${workspaceId}`);
      const result = await res.json();
      if (result.data) {
        setPosts(result.data);
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

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-1.5 glass-card rounded-2xl p-1.5 w-fit">
          {['all', 'scheduled', 'published', 'failed', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as PostStatus | 'all')}
              className={cn(
                "px-5 py-2.5 text-11 font-bold uppercase tracking-widest rounded-[14px] transition-all duration-300",
                filter === s 
                  ? "bg-primary text-primary-content shadow-xl shadow-primary/30" 
                  : "text-foreground-secondary hover:text-foreground hover:bg-foreground/5"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" size={14} />
            <input 
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          
          <button 
            onClick={fetchPosts}
            disabled={isLoading}
            className="p-2 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground-tertiary hover:text-foreground transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
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
