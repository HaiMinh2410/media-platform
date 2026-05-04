'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { ConversationWithLastMessage } from '@/domain/types/messaging';
import { ThreadCard } from './thread-card';
import { ConversationSkeleton } from './skeletons';
import { useSidebarRealtime } from '../hooks/use-sidebar-realtime';
import { useUnreadRealtime } from '../hooks/use-unread-realtime';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, MoreHorizontal, Settings, Plus, Filter, TrendingUp, TrendingDown, ChevronDown, Check } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import { getConversationAction } from '@/application/actions/inbox.actions';
import { getCurrentWorkspaceUnreadCountAction } from '@/application/actions/workspace.actions';
import { cn } from '@/lib/utils';

export function MiddlePanel({ workspaceId }: { workspaceId: string }) {
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [usedTags, setUsedTags] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  
  const { 
    viewMode, platform, segmentFilter, 
    middlePanelWidth, setMiddlePanelWidth, 
    selectedGroupId, accountGroups,
    refreshCounter, availableTags, setAvailableTags,
    activeThreads, addActiveThread
  } = useInboxStore();
  
  const [totalUnread, setTotalUnread] = useState(0);

  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeIdRef = useRef(params?.id as string | undefined);
  const isResizing = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth > 280 && newWidth < 500) {
        setMiddlePanelWidth(newWidth);
      }
    }
  }, [setMiddlePanelWidth]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    activeIdRef.current = params?.id as string | undefined;
    
    // Add to active threads if not present
    if (activeIdRef.current) {
      const conv = conversations.find(c => c.id === activeIdRef.current);
      if (conv) {
        addActiveThread(conv);
      }
    }
  }, [params?.id, conversations, addActiveThread]);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef<(() => void) | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);
  
  const fetchConversations = useCallback(async (cursor?: string | null, reset = false) => {
    try {
      setLoading(true);
      const url = new URL('/api/conversations', window.location.origin);
      url.searchParams.set('workspaceId', workspaceId);
      url.searchParams.set('limit', '20');
      if (cursor) url.searchParams.set('cursor', cursor);
      if (searchQuery) url.searchParams.set('search', searchQuery);
      
      if (segmentFilter === 'unread') url.searchParams.set('unread', 'true');
      if (segmentFilter === 'vip') url.searchParams.set('is_vip', 'true');
      if (segmentFilter === 'needs_reply') url.searchParams.set('status', 'open');
      if (segmentFilter === 'hot_lead') url.searchParams.set('priority', 'high');
      if (segmentFilter === 'cold') url.searchParams.set('priority', 'low');

      if (selectedGroupId) url.searchParams.set('groupId', selectedGroupId);
      if (platform !== 'all') url.searchParams.set('platform', platform);

      if (filterBy === 'unread') {
        url.searchParams.set('unread', 'true');
      } else if (filterBy === 'priority') {
        url.searchParams.set('priority', 'high');
      } else if (filterBy !== 'all') {
        url.searchParams.set('tag', filterBy);
      }

      url.searchParams.set('sortBy', sortField === 'date' ? 'lastMessageAt' : 'customer_name');
      url.searchParams.set('sortOrder', sortOrder);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.data) {
        setConversations(prev => reset ? data.data : [...prev, ...data.data]);
        setNextCursor(data.meta?.nextCursor || null);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, searchQuery, filterBy, sortField, sortOrder, platform, segmentFilter, selectedGroupId]);

  useEffect(() => {
    fetchRef.current = () => fetchConversations(null, true);
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations(null, true);
  }, [fetchConversations, refreshCounter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const virtualizer = useVirtualizer({
    count: nextCursor ? conversations.length + 1 : conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();
    if (!lastItem) return;
    if (lastItem.index >= conversations.length - 1 && nextCursor && !loading) {
      fetchConversations(nextCursor, false);
    }
  }, [virtualItems, conversations.length, nextCursor, loading, fetchConversations]);

  const handleConversationUpdated = useCallback(
    async (
      eventType: 'INSERT' | 'UPDATE',
      partial: Pick<ConversationWithLastMessage, 'id' | 'platform_conversation_id' | 'last_message_at' | 'status' | 'priority' | 'sentiment'>
    ) => {
      if (eventType === 'INSERT') {
        fetchRef.current?.();
        return;
      }

      const { data: updatedConv } = await getConversationAction(partial.id);
      if (!updatedConv) return;

      setConversations(prev => {
        const existing = prev.find(c => c.id === partial.id);
        if (!existing) return prev;

        const isNewer = new Date(updatedConv.last_message_at).getTime() > new Date(existing.last_message_at).getTime();
        
        if (isNewer && updatedConv.id !== activeIdRef.current) {
          toast(`New message from ${existing.sender_name}`, {
            description: new Date(updatedConv.last_message_at).toLocaleTimeString()
          });
        }

        const updated = prev.map(c =>
          c.id === partial.id
            ? {
                ...c,
                ...updatedConv,
              } as ConversationWithLastMessage
            : c
        );

        if (sortField === 'date' && sortOrder === 'desc') {
          return [...updated].sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );
        }
        return updated;
      });
    },
    [filterBy, sortField, sortOrder]
  );

  const handleMessageReceived = useCallback((payload: { conversationId: string; content: string; createdAt: Date }) => {
    setConversations(prev => {
      const existing = prev.find(c => c.id === payload.conversationId);
      if (!existing) return prev;

      const updated = prev.map(c => 
        c.id === payload.conversationId 
          ? { 
              ...c, 
              last_message_content: payload.content,
              last_message_at: payload.createdAt
            } 
          : c
      );

      if (sortField === 'date' && sortOrder === 'desc') {
        return [...updated].sort(
          (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      }
      return updated;
    });
  }, [filterBy, sortField, sortOrder]);

  const handleConversationDeleted = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    if (activeIdRef.current === conversationId) {
      router.push('/dashboard/inbox');
      toast.info('Conversation was deleted');
    }
  }, [router]);

  useSidebarRealtime({ 
    workspaceId, 
    onConversationUpdated: handleConversationUpdated,
    onConversationDeleted: handleConversationDeleted,
    onMessageReceived: handleMessageReceived
  });

  const refreshTotalUnread = useCallback(() => {
    getCurrentWorkspaceUnreadCountAction().then(res => {
      if (res.data !== null) setTotalUnread(res.data);
    });
  }, []);

  useEffect(() => {
    refreshTotalUnread();
  }, [workspaceId, refreshTotalUnread]);

  useUnreadRealtime({
    workspaceId,
    onRefresh: refreshTotalUnread
  });

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
        const json = await res.json();
        if (json.data) setAvailableTags(json.data);

        const usedRes = await fetch(`/api/tags?workspaceId=${workspaceId}&onlyUsed=true`);
        const usedJson = await usedRes.json();
        if (usedJson.data) setUsedTags(usedJson.data);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    };
    fetchTags();
  }, [workspaceId, setAvailableTags, refreshCounter]);

  if (pathname?.includes('/flow')) return null;

  return (
    <aside 
      className="relative min-w-[280px] max-w-[500px] border-r border-foreground/10 bg-background/5 flex flex-col h-full shrink-0" 
      ref={panelRef}
      style={{ width: middlePanelWidth }}
    >
      <div 
        className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize z-30 transition-colors hover:bg-indigo-500/30" 
        onMouseDown={startResizing}
      />

      <div className="p-[16px_20px_12px]">
        <div className="relative w-full mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary pointer-events-none" size={16} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full p-[10px_16px_10px_38px] rounded-md border border-foreground/10 bg-background-secondary text-foreground text-base outline-none transition-all focus:border-accent-primary focus:bg-background-tertiary focus:ring-3 focus:ring-accent-primary/20"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="flex justify-between items-center pb-2 border-b border-foreground/10 text-xs text-foreground-tertiary">
          <div className="font-medium text-foreground-tertiary">
            <span>{conversations.length} items</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-background-secondary p-[2px_6px] rounded-md border border-foreground/10 shrink-0 relative" ref={filterRef}>
              <div 
                className="flex items-center justify-between gap-1 cursor-pointer text-xs font-medium text-foreground-secondary w-[90px] min-w-0" 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <span className="truncate">
                  {filterBy === 'all' ? 'Tất cả' : 
                   filterBy === 'unread' ? 'Chưa đọc' : 
                   filterBy.split('::')[0]}
                </span>
                <ChevronDown size={12} className={cn("transition-transform duration-200 text-foreground-tertiary", isFilterOpen && "rotate-180")} />
              </div>

              {isFilterOpen && (
                <div className="absolute top-full left-0 mt-1 bg-base-200 border border-foreground/10 rounded-lg shadow-2xl z-[100] w-[180px] overflow-hidden flex flex-col">
                  <div 
                    className={cn("p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground", filterBy === 'all' && "bg-accent-primary/10 text-accent-primary")}
                    onClick={() => { setFilterBy('all'); setIsFilterOpen(false); }}
                  >
                    Tất cả
                  </div>
                  <div 
                    className={cn("p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground", filterBy === 'unread' && "bg-accent-primary/10 text-accent-primary")}
                    onClick={() => { setFilterBy('unread'); setIsFilterOpen(false); }}
                  >
                    Chưa đọc
                  </div>
                  
                  <div className="p-[8px_12px_4px] text-3xs font-bold text-foreground-tertiary uppercase tracking-wider border-top border-foreground/10 mt-1">Lọc theo nhãn</div>
                  <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10">
                    {usedTags.map(tag => {
                      const name = tag.split('::')[0];
                      const isActive = filterBy === tag;
                      return (
                        <div 
                          key={tag} 
                          className={cn("p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground", isActive && "bg-accent-primary/10 text-accent-primary")}
                          onClick={() => { setFilterBy(tag); setIsFilterOpen(false); }}
                        >
                          {name}
                          {isActive && <Check size={10} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 bg-foreground/5 p-[2px_6px] rounded-md border border-foreground/10 shrink-0 relative" ref={sortRef}>
              <div 
                className="flex items-center justify-between gap-1 cursor-pointer text-xs font-medium text-foreground-secondary w-[50px] min-w-0" 
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <span className="truncate">
                  {sortField === 'date' ? 'Date' : 'Name'}
                </span>
                <ChevronDown size={12} className={cn("transition-transform duration-200 text-foreground-tertiary", isSortOpen && "rotate-180")} />
              </div>

              {isSortOpen && (
                <div className="absolute top-full left-0 mt-1 bg-base-200 border border-foreground/10 rounded-lg shadow-2xl z-[100] w-[100px] overflow-hidden flex flex-col">
                  <div 
                    className={cn("p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground", sortField === 'date' && "bg-accent-primary/10 text-accent-primary")}
                    onClick={() => { setSortField('date'); setIsSortOpen(false); }}
                  >
                    Date
                  </div>
                  <div 
                    className={cn("p-[8px_12px] text-xs text-foreground-secondary cursor-pointer flex items-center justify-between transition-all hover:bg-foreground/5 hover:text-foreground", sortField === 'name' && "bg-accent-primary/10 text-accent-primary")}
                    onClick={() => { setSortField('name'); setIsSortOpen(false); }}
                  >
                    Name
                  </div>
                </div>
              )}

              <button 
                className="flex items-center justify-center bg-transparent border-none text-foreground-tertiary cursor-pointer p-0.5 rounded transition-all hover:text-foreground hover:bg-foreground/5"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent" ref={parentRef}>
        {loading && conversations.length === 0 ? (
          <div className="p-4 space-y-2">
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-10 text-center text-foreground-tertiary">
            <p>No conversations found</p>
          </div>
        ) : (
          <div 
            className="w-full relative px-3 py-2"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualItem) => {
              const isLoaderRow = virtualItem.index > conversations.length - 1;
              const conv = conversations[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    <div className="p-4 text-center text-foreground-tertiary">Loading more...</div>
                  ) : (
                    <ThreadCard 
                      conversation={conv} 
                      style={{ height: `${virtualItem.size - 4}px` }} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
