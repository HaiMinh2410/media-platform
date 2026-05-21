import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConversationWithLastMessage } from '@features/inbox/types';
import { useInboxStore } from '../../../store/inbox.store';
import { getConversationAction } from '@features/inbox/actions/inbox.actions';
// eslint-disable-next-line import/no-restricted-paths
import { getCurrentWorkspaceUnreadCountAction } from '@features/settings/index';
import { useSidebarRealtime } from '../../../hooks/use-sidebar-realtime';
import { useUnreadRealtime } from '../../../hooks/use-unread-realtime';

type UseConversationsFetchProps = {
  workspaceId: string;
};

export function useConversationsFetch({ workspaceId }: UseConversationsFetchProps) {
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
  const [totalUnread, setTotalUnread] = useState(0);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef<(() => void) | null>(null);

  const params = useParams();
  const router = useRouter();
  const activeIdRef = useRef(params?.id as string | undefined);

  const {
    platform,
    segmentFilter,
    selectedGroupId,
    refreshCounter,
    setAvailableTags,
    addActiveThread,
  } = useInboxStore();

  // Sync active thread
  useEffect(() => {
    activeIdRef.current = params?.id as string | undefined;
    if (activeIdRef.current) {
      const conv = conversations.find(c => c.id === activeIdRef.current);
      if (conv) {
        addActiveThread(conv);
      }
    }
  }, [params?.id, conversations, addActiveThread]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Click outside for dropdowns
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

  const fetchConversations = useCallback(async (cursor?: string | null, reset = false) => {
    if (!workspaceId) return;
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

  // Sidebar Realtime Handlers
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
        const isFromCustomer = updatedConv.last_message_sender_type === 'user' && updatedConv.last_message_sender_id !== 'system';

        if (isNewer && updatedConv.id !== activeIdRef.current && isFromCustomer) {
          toast(`New message from ${existing.sender_name}`, {
            description: new Date(updatedConv.last_message_at).toLocaleTimeString()
          });
        }

        const updated = prev.map(c =>
          c.id === partial.id
            ? ({
                ...c,
                ...updatedConv,
              } as ConversationWithLastMessage)
            : c
        );

        return [...updated].sort((a, b) => {
          const isPinnedA = !!a.is_pinned;
          const isPinnedB = !!b.is_pinned;

          if (isPinnedA && !isPinnedB) return -1;
          if (!isPinnedA && isPinnedB) return 1;

          if (sortField === 'date') {
            const timeA = new Date(a.last_message_at).getTime();
            const timeB = new Date(b.last_message_at).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
          } else {
            const nameA = a.sender_name || '';
            const nameB = b.sender_name || '';
            return sortOrder === 'desc'
              ? nameB.localeCompare(nameA)
              : nameA.localeCompare(nameB);
          }
        });
      });
    },
    [sortField, sortOrder]
  );

  const handleMessageReceived = useCallback((payload: { conversationId: string; content: string; createdAt: Date; senderType?: 'user' | 'agent' | 'ai' | null }) => {
    setConversations(prev => {
      const existing = prev.find(c => c.id === payload.conversationId);
      if (!existing) return prev;

      const updated = prev.map(c =>
        c.id === payload.conversationId
          ? {
              ...c,
              last_message_content: payload.content,
              last_message_at: payload.createdAt,
              last_message_sender_type: payload.senderType
            }
          : c
      );

      return [...updated].sort((a, b) => {
        const isPinnedA = !!a.is_pinned;
        const isPinnedB = !!b.is_pinned;

        if (isPinnedA && !isPinnedB) return -1;
        if (!isPinnedA && isPinnedB) return 1;

        if (sortField === 'date') {
          const timeA = new Date(a.last_message_at).getTime();
          const timeB = new Date(b.last_message_at).getTime();
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        } else {
          const nameA = a.sender_name || '';
          const nameB = b.sender_name || '';
          return sortOrder === 'desc'
            ? nameB.localeCompare(nameA)
            : nameA.localeCompare(nameB);
        }
      });
    });
  }, [sortField, sortOrder]);

  const handleConversationDeleted = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));

    if (activeIdRef.current === conversationId) {
      router.push('/dashboard/inbox');
      toast.info('Conversation was deleted');
    }
  }, [router]);

  // Sidebar Realtime subscription
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

  // Unread Realtime subscription
  useUnreadRealtime({
    workspaceId,
    onRefresh: refreshTotalUnread
  });

  // Fetch Tags
  useEffect(() => {
    if (!workspaceId) return;
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

  return {
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
    totalUnread,
    filterRef,
    sortRef,
    fetchConversations
  };
}
