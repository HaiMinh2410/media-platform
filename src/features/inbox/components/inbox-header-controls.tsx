'use client';

import React from 'react';
import { 
  ChevronDown, Check, Users, Plus, 
  MoreHorizontal, Trash2, RotateCcw
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { CreateClusterModal } from './modals/create-cluster-modal';
import { useUnreadRealtime } from '../hooks/use-unread-realtime';
import { Reorder } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useInboxStore } from '../store/inbox.store';
import { 
  getAccountGroupsAction, 
  deleteAccountGroupAction,
  updateAccountGroupsOrderAction,
  resetAccountGroupsAction,
  AccountGroup,
  PlatformAccount
} from '@features/settings';
import { getUnreadCountsAction, UnreadCounts } from '@features/inbox/actions/unread-counts.actions';
import { SlidingTabs } from '@shared/ui/sliding-tabs';
import { RangeSelector } from '@shared/ui/range-selector';
import { CombinedAvatar } from './combined-avatar';
import { ReorderItem } from './reorder-item';

interface InboxHeaderControlsProps {
  workspaceId: string;
}

export function InboxHeaderControls({ workspaceId }: InboxHeaderControlsProps) {
  const { 
    viewMode, setViewMode,
    platform, setPlatform,
    selectedGroupId, setGroupId,
    accountGroups, setAccountGroups 
  } = useInboxStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showManagementMenu, setShowManagementMenu] = React.useState(false);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedIdsForAction, setSelectedIdsForAction] = React.useState<string[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [unreadCounts, setUnreadCounts] = React.useState<UnreadCounts>({ all: 0, facebook: 0, instagram: 0 });

  const selectedGroup = accountGroups.find((g: AccountGroup) => g.id === selectedGroupId);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCounts = React.useCallback(() => {
    if (!workspaceId) return;
    
    getUnreadCountsAction(workspaceId, selectedGroupId).then((res: any) => {
      if (res.data) setUnreadCounts(res.data);
    });
    
    getAccountGroupsAction(workspaceId).then((res: any) => {
      if (res.data) setAccountGroups(res.data);
    });
  }, [workspaceId, selectedGroupId, setAccountGroups]);

  // Sync reorder to server with debounce
  const [isReordering, setIsReordering] = React.useState(false);
  const syncTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleReorder = (newOrder: AccountGroup[]) => {
    setAccountGroups(newOrder);
    setIsReordering(true);

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    
    syncTimerRef.current = setTimeout(() => {
      updateAccountGroupsOrderAction(workspaceId, newOrder.map(g => g.id))
        .finally(() => setIsReordering(false));
    }, 1000);
  };

  // Real-time updates via Supabase
  useUnreadRealtime({ 
    workspaceId, 
    onRefresh: () => !isReordering && fetchCounts()
  });

  React.useEffect(() => {
    if (workspaceId && !isReordering) {
      fetchCounts();
      const interval = setInterval(fetchCounts, 15000); 
      return () => clearInterval(interval);
    }
  }, [workspaceId, fetchCounts, isReordering]);

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

  const clusterOptions = React.useMemo(() => [
    {
      id: 'all_clusters',
      label: 'Tất cả cụm',
      icon: (
        <div className="w-6 h-6 flex items-center justify-center bg-background-tertiary rounded-md text-foreground-tertiary">
          <Users size={14} />
        </div>
      ),
    },
    ...accountGroups.map((group: AccountGroup) => ({
      id: group.id,
      label: group.name,
      icon: <CombinedAvatar group={group} unreadCount={group.unreadCount} />,
    })),
  ], [accountGroups]);

  return (
    <div className="flex items-center gap-4 h-full">
      <RangeSelector
        value={selectedGroupId || 'all_clusters'}
        onChange={(val) => {
          setGroupId(val === 'all_clusters' ? null : val);
          setViewMode('all');
          router.push('/dashboard/inbox');
        }}
        options={clusterOptions}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        triggerClassName={cn(
          "flex items-center gap-3 px-3.5 h-10 bg-background-secondary border border-base-content/5 rounded-xl text-foreground-secondary cursor-pointer transition-all duration-200 min-w-[180px] outline-none hover:border-base-content/10 hover:-translate-y-px text-sm font-semibold select-none shadow-sm",
          selectedGroupId && "bg-primary/10 border-primary/20 text-foreground"
        )}
        dropdownClassName="bg-base-100 border border-foreground/10 shadow-2xl glass-shadow !p-2"
        menuMinWidth="w-[280px]"
        hideIcon={false}
      >
        <div className="p-[8px_12px_12px] text-xs font-bold text-foreground-tertiary uppercase tracking-[0.08em] flex items-center justify-between">
          <span>{isSelectionMode ? `Đã chọn ${selectedIdsForAction.length}` : 'Chọn cụm tài khoản'}</span>
          
          {!isSelectionMode ? (
            <div className="flex items-center gap-2 relative">
              <button 
                className="bg-background-tertiary border border-foreground/10 text-foreground-secondary rounded-md w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-background-secondary hover:text-foreground hover:border-foreground/20 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowManagementMenu(!showManagementMenu);
                }}
              >
                <MoreHorizontal size={14} />
              </button>

              {showManagementMenu && (
                <div className="absolute top-full right-0 mt-2 bg-base-200 border border-foreground/10 rounded-lg shadow-2xl overflow-hidden z-101 p-2">
                  <button 
                    className="w-full p-[10px_12px] flex items-center gap-2.5 bg-transparent border-none text-foreground-secondary text-sm font-medium cursor-pointer rounded-md hover:bg-foreground/5 hover:text-foreground transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreateModal(true);
                      setShowManagementMenu(false);
                      setIsOpen(false);
                    }}
                  >
                    <Plus size={14} /> <span className="whitespace-nowrap">Add Cluster</span>
                  </button>
                  <button 
                    className="w-full p-[10px_12px] flex items-center gap-2.5 bg-transparent border-none text-foreground-secondary text-sm font-medium cursor-pointer rounded-md hover:bg-foreground/5 hover:text-foreground transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSelectionMode(true);
                      setShowManagementMenu(false);
                    }}
                  >
                    <Check size={14} /> <span className="whitespace-nowrap">Cluster management</span>
                  </button>
                  <button 
                    className="w-full p-[10px_12px] flex items-center gap-2.5 bg-transparent border-none text-foreground-secondary text-sm font-medium cursor-pointer rounded-md hover:bg-foreground/5 hover:text-foreground transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Bạn có chắc chắn muốn khôi phục về các cụm tài khoản mặc định? Toàn bộ các cụm hiện tại sẽ bị xóa.')) {
                        resetAccountGroupsAction(workspaceId).then((res) => {
                          if (res.success) {
                            fetchCounts();
                            setGroupId(null);
                          } else {
                            alert('Khôi phục thất bại: ' + res.error);
                          }
                        });
                        setShowManagementMenu(false);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <RotateCcw size={14} /> <span className="whitespace-nowrap">Reset to default</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 relative">
              <button 
                className={cn(
                  "p-[4px_10px] rounded-md text-xs font-semibold cursor-pointer transition-all bg-error/10 border border-error/20 text-error",
                  selectedIdsForAction.length === 0 && "opacity-30 cursor-not-allowed"
                )}
                disabled={selectedIdsForAction.length === 0}
                onClick={(e) => {
                  if (confirm(`Xóa ${selectedIdsForAction.length} cụm đã chọn?`)) {
                    Promise.all(selectedIdsForAction.map(id => deleteAccountGroupAction(id)))
                      .then(() => {
                        fetchCounts();
                        setIsSelectionMode(false);
                        setSelectedIdsForAction([]);
                      });
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
              <button 
                className="p-[4px_10px] rounded-md text-xs font-semibold cursor-pointer transition-all bg-foreground/5 border border-foreground/10 text-foreground hover:bg-foreground/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectionMode(false);
                  setSelectedIdsForAction([]);
                }}
              >
                Xong
              </button>
            </div>
          )}
        </div>
        <button 
          className={cn(
            "flex items-center gap-3 w-full p-[10px_12px] rounded-md border-none bg-transparent text-foreground-secondary cursor-pointer transition-all duration-150 text-left hover:bg-foreground/5 hover:text-foreground",
            !selectedGroupId && "bg-primary/10 text-foreground"
          )}
          onClick={() => {
            setGroupId(null);
            setIsOpen(false);
            setViewMode('all');
            router.push('/dashboard/inbox');
          }}
        >
          <div className="w-6 h-6 flex items-center justify-center bg-background-tertiary rounded-md text-foreground-tertiary">
            <Users size={14} />
          </div>
          <span className="flex-1 text-sm font-medium">Tất cả cụm</span>
          {!selectedGroupId && <Check size={14} className="text-primary" />}
        </button>

        <div className="h-px bg-foreground/5 m-[4px_8px]" />

        <Reorder.Group 
          axis="y" 
          values={accountGroups} 
          onReorder={handleReorder}
          className="list-none p-0 m-0 select-none"
        >
          {accountGroups.map((group: AccountGroup) => (
            <ReorderItem 
              key={group.id} 
              group={group} 
              selectedGroupId={selectedGroupId}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIdsForAction.includes(group.id)}
              onSelect={(id) => {
                setSelectedIdsForAction(prev => 
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                );
              }}
              onActivate={(id) => {
                setGroupId(id);
                setIsOpen(false);
                setViewMode('all');
                router.push('/dashboard/inbox');
              }}
            />
          ))}
        </Reorder.Group>
      </RangeSelector>

      <SlidingTabs
        items={tabItems}
        activeValue={platform}
        onChange={setPlatform}
        size="md"
        layoutId="inboxPlatformIndicator"
        className="btn bg-background-secondary"
      />



      {showCreateModal && (
        <CreateClusterModal 
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchCounts}
        />
      )}
    </div>
  );
}


