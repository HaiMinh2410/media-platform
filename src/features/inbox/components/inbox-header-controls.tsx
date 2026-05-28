'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useInboxStore } from '../store/inbox.store';
import { 
  getAccountGroupsAction, 
  AccountGroup
} from '@features/settings';
import { getUnreadCountsAction, UnreadCounts } from '@features/inbox/actions/unread-counts.actions';
import { SlidingTabs } from '@shared/ui/sliding-tabs';
import { ClusterSelector } from './cluster-selector';
import { useUnreadRealtime } from '../hooks/use-unread-realtime';

interface InboxHeaderControlsProps {
  workspaceId: string;
}

export function InboxHeaderControls({ workspaceId }: InboxHeaderControlsProps) {
  const { 
    setViewMode,
    platform, setPlatform,
    selectedGroupId, setGroupId,
    setAccountGroups 
  } = useInboxStore();
  const router = useRouter();

  const [unreadCounts, setUnreadCounts] = React.useState<UnreadCounts>({ all: 0, facebook: 0, instagram: 0 });

  const fetchCounts = React.useCallback(() => {
    if (!workspaceId) return;
    
    getUnreadCountsAction(workspaceId, selectedGroupId).then((res: any) => {
      if (res.data) setUnreadCounts(res.data);
    });
    
    getAccountGroupsAction(workspaceId).then((res: any) => {
      if (res.data) setAccountGroups(res.data);
    });
  }, [workspaceId, selectedGroupId, setAccountGroups]);

  // Real-time updates via Supabase
  useUnreadRealtime({ 
    workspaceId, 
    onRefresh: () => fetchCounts()
  });

  React.useEffect(() => {
    if (workspaceId) {
      fetchCounts();
      const interval = setInterval(fetchCounts, 15000); 
      return () => clearInterval(interval);
    }
  }, [workspaceId, fetchCounts]);

  const formatCount = (count: number) => count > 99 ? '99+' : count;

  const tabItems = React.useMemo(() => [
    {
      value: 'all' as const,
      label: (
        <span className="flex items-center gap-2">
          Tất cả
          {unreadCounts.all > 0 && (
            <span className="badge badge-sm badge-error">
              {formatCount(unreadCounts.all)}
            </span>
          )}
        </span>
      ),
      activeBgClass: 'bg-primary/10 shadow-sm',
      activeTextClass: 'text-primary',
    },
    {
      value: 'facebook' as const,
      label: (
        <span className="flex items-center gap-1.5">
          Messenger
          {unreadCounts.facebook > 0 && (
            <span className="badge badge-sm badge-error">
              {formatCount(unreadCounts.facebook)}
            </span>
          )}
        </span>
      ),
      activeBgClass: 'bg-primary/10 shadow-sm',
      activeTextClass: 'text-primary',
    },
    {
      value: 'instagram' as const,
      label: (
        <span className="flex items-center gap-1.5">
          Instagram
          {unreadCounts.instagram > 0 && (
            <span className="badge badge-sm badge-error">
              {formatCount(unreadCounts.instagram)}
            </span>
          )}
        </span>
      ),
      activeBgClass: 'bg-primary/10 shadow-sm',
      activeTextClass: 'text-primary',
    },
  ], [unreadCounts]);

  return (
    <div className="flex items-center gap-4 h-full">
      <ClusterSelector
        workspaceId={workspaceId}
        selectedGroupId={selectedGroupId}
        onChangeGroup={(id) => {
          setGroupId(id);
          setViewMode('all');
          router.push('/dashboard/inbox');
        }}
      />

      <SlidingTabs
        items={tabItems}
        activeValue={platform}
        onChange={setPlatform}
        size="md"
        layoutId="inboxPlatformIndicator"
        className="btn bg-background-secondary"
      />
    </div>
  );
}


