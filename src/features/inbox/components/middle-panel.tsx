'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ThreadCard } from './thread-card';
import { ConversationSkeleton } from './skeletons';
import { useVirtualizer } from '@tanstack/react-virtual';

// Import newly refactored custom hooks and components
import { usePanelResizing } from './middle-panel/hooks/usePanelResizing';
import { useConversationsFetch } from './middle-panel/hooks/useConversationsFetch';
import { PanelHeader } from './middle-panel/components/PanelHeader';

export function MiddlePanel({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const parentRef = useRef<HTMLDivElement>(null);

  // 1. Manage resizing behavior
  const { middlePanelWidth, panelRef, startResizing } = usePanelResizing();

  // 2. Manage fetching conversations, tags, search, filtering, sorting, realtime, etc.
  const {
    conversations,
    loading,
    nextCursor,
    searchInput,
    setSearchInput,
    filterBy,
    setFilterBy,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    isFilterOpen,
    setIsFilterOpen,
    isSortOpen,
    setIsSortOpen,
    usedTags,
    filterRef,
    sortRef,
    fetchConversations,
  } = useConversationsFetch({ workspaceId });

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: nextCursor ? conversations.length + 1 : conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Scroll load more triggers
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();
    if (!lastItem) return;
    if (lastItem.index >= conversations.length - 1 && nextCursor && !loading) {
      fetchConversations(nextCursor, false);
    }
  }, [virtualItems, conversations.length, nextCursor, loading, fetchConversations]);

  if (pathname?.includes('/flow')) return null;

  return (
    <aside
      className="relative min-w-[280px] max-w-[500px] border-r border-base-content/5 bg-base-200/30 flex flex-col h-full shrink-0"
      ref={panelRef}
      style={{ width: middlePanelWidth }}
    >
      <div
        className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize z-30 transition-colors hover:bg-primary/20"
        onMouseDown={startResizing}
      />

      <PanelHeader
        conversationsCount={conversations.length}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        usedTags={usedTags}
        filterRef={filterRef}
        sortField={sortField}
        setSortField={setSortField}
        isSortOpen={isSortOpen}
        setIsSortOpen={setIsSortOpen}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortRef={sortRef}
      />

      <div
        className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-base-content/10 scrollbar-track-transparent"
        ref={parentRef}
      >
        {loading && conversations.length === 0 ? (
          <div className="p-4 space-y-2">
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-10 text-center text-base-content/40">
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
                    <div className="p-4 text-center text-base-content/40">Loading more...</div>
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
