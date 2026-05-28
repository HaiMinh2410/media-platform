'use client';

import React from 'react';
import { 
  Check, Users, Plus, 
  MoreHorizontal, Trash2, RotateCcw
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { Reorder } from 'framer-motion';
import { RangeSelector } from '@shared/ui/range-selector';
import { 
  getAccountGroupsAction, 
  deleteAccountGroupAction,
  updateAccountGroupsOrderAction,
  resetAccountGroupsAction,
  AccountGroup
} from '@features/settings';
import { useInboxStore } from '../store/inbox.store';
import { CombinedAvatar } from './combined-avatar';
import { ReorderItem } from './reorder-item';
import { CreateClusterModal } from './modals/create-cluster-modal';

interface ClusterSelectorProps {
  workspaceId: string;
  selectedGroupId: string | null;
  onChangeGroup: (groupId: string | null) => void;
  triggerClassName?: string;
  dropdownClassName?: string;
  menuMinWidth?: string;
}

export function ClusterSelector({
  workspaceId,
  selectedGroupId,
  onChangeGroup,
  triggerClassName,
  dropdownClassName="bg-soft border border-foreground/10 shadow-2xl glass-shadow !p-2 rounded-lg",
  menuMinWidth = "w-[280px]"
}: ClusterSelectorProps) {
  const { accountGroups, setAccountGroups } = useInboxStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showManagementMenu, setShowManagementMenu] = React.useState(false);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedIdsForAction, setSelectedIdsForAction] = React.useState<string[]>([]);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

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
    getAccountGroupsAction(workspaceId).then((res: any) => {
      if (res.data) setAccountGroups(res.data);
    });
  }, [workspaceId, setAccountGroups]);

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

  React.useEffect(() => {
    if (workspaceId && !isReordering) {
      fetchCounts();
    }
  }, [workspaceId, fetchCounts, isReordering]);

  const clusterOptions = React.useMemo(() => [
    {
      id: 'all_clusters',
      label: 'Tất cả cụm',
      icon: (
        <div className="w-6 h-6 flex items-center justify-center text-base">
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
    <div ref={dropdownRef} className="relative">
      <RangeSelector
        value={selectedGroupId || 'all_clusters'}
        onChange={(val) => {
          onChangeGroup(val === 'all_clusters' ? null : val);
        }}
        options={clusterOptions}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        triggerClassName={triggerClassName || cn(
          "flex items-center gap-3 px-3.5 h-10 bg-background-secondary border border-base-300 rounded-xl text-foreground-secondary cursor-pointer transition-all duration-200 min-w-[180px] outline-none hover:border-base-content/10 hover:-translate-y-px text-sm font-semibold select-none shadow-sm",
          selectedGroupId && "bg-primary/10 border-primary/20 text-foreground"
        )}
        className="w-full"
        dropdownClassName={dropdownClassName}
        menuMinWidth={menuMinWidth}
        hideIcon={false}
      >
        <div className="p-[8px_12px_12px] text-xs font-bold text-foreground-tertiary uppercase tracking-[0.08em] flex items-center justify-between">
          <span>{isSelectionMode ? `Đã chọn ${selectedIdsForAction.length}` : 'Chọn cụm tài khoản'}</span>
          
          {!isSelectionMode ? (
            <RangeSelector
              isOpen={showManagementMenu}
              onOpenChange={setShowManagementMenu}
              menuAlign="right"
              dropdownClassName="rounded-lg"
              customTrigger={
                <button 
                  type="button"
                  className="btn btn-soft btn-sm btn-circle"
                >
                  <MoreHorizontal size={14} />
                </button>
              }
            >
              <button 
                type="button"
                className="w-full px-2.5 py-2 flex items-center gap-2.5 border-none text-base-content/80 text-sm rounded-lg hover:bg-foreground/5 hover:text-base-content transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                  setShowManagementMenu(false);
                  setIsOpen(false);
                }}
              >
                <Plus size={16} /> <span className="whitespace-nowrap">Add Cluster</span>
              </button>
              <button 
                type="button"
                className="w-full px-2.5 py-2 flex items-center gap-2.5 border-none text-base-content/80 text-sm rounded-lg hover:bg-foreground/5 hover:text-base-content transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectionMode(true);
                  setShowManagementMenu(false);
                }}
              >
                <Check size={14} /> <span className="whitespace-nowrap">Cluster management</span>
              </button>
              <button 
                type="button"
                className="w-full px-2.5 py-2 flex items-center gap-2.5 border-none text-base-content/80 text-sm rounded-lg hover:bg-foreground/5 hover:text-base-content transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Bạn có chắc chắn muốn khôi phục về các cụm tài khoản mặc định? Toàn bộ các cụm hiện tại sẽ bị xóa.')) {
                    resetAccountGroupsAction(workspaceId).then((res) => {
                      if (res.success) {
                        fetchCounts();
                        onChangeGroup(null);
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
            </RangeSelector>
          ) : (
            <div className="flex items-center gap-2 relative">
              <button 
                type="button"
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
                type="button"
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
          type="button"
          className={cn(
            "flex items-center gap-3 w-full p-[10px_12px] rounded-md border-none bg-transparent text-foreground-secondary cursor-pointer transition-all duration-150 text-left hover:bg-foreground/5 hover:text-foreground",
            !selectedGroupId && "bg-primary/10 text-foreground"
          )}
          onClick={() => {
            onChangeGroup(null);
            setIsOpen(false);
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
                onChangeGroup(id);
                setIsOpen(false);
              }}
            />
          ))}
        </Reorder.Group>
      </RangeSelector>

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
