'use client';

import React from 'react';
import styles from './secondary-header.module.css';
import { useInboxStore } from '../store/inbox.store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { 
  Zap, ChevronDown, Check, Users, Plus, 
  MoreHorizontal, Trash2, Edit2,
  GripVertical
} from 'lucide-react';
import { CreateClusterModal } from './modals/create-cluster-modal';
import { useUnreadRealtime } from '../hooks/use-unread-realtime';
import { Reorder, useDragControls } from 'framer-motion';

import { 
  getAccountGroupsAction, 
  deleteAccountGroupAction,
  updateAccountGroupsOrderAction
} from '@/application/actions/account-group.actions';
import { getUnreadCountsAction, UnreadCounts } from '@/application/actions/unread-counts.actions';
import { AccountGroup } from '@/domain/types/account-group';

import { PlatformAccount } from '@/domain/types/platform-account';

export function SecondaryHeader({ workspaceId }: { workspaceId: string }) {
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

  const selectedGroup = accountGroups.find(g => g.id === selectedGroupId);

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
    
    getUnreadCountsAction(workspaceId, selectedGroupId).then(res => {
      if (res.data) setUnreadCounts(res.data);
    });
    
    getAccountGroupsAction(workspaceId).then(res => {
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

  return (
    <>
    <div className={styles.container}>
      <div className={styles.tabs}>

        <div className={styles.dropdownContainer} ref={dropdownRef}>
          <button 
            className={clsx(styles.dropdownTrigger, selectedGroupId && styles.activeTrigger)}
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedGroup ? (
              <div className={styles.activeSelection}>
                <CombinedAvatar group={selectedGroup} unreadCount={selectedGroup.unreadCount} />
                <span className={styles.triggerName}>{selectedGroup.name}</span>
              </div>
            ) : (
              <div className={styles.activeSelection}>
                <div className={styles.placeholderIcon}>
                  <Users size={14} />
                </div>
                <span className={styles.placeholderText}>Tất cả cụm</span>
              </div>
            )}
            <ChevronDown size={14} className={clsx(styles.chevron, isOpen && styles.chevronOpen)} />
          </button>

          {isOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.menuHeader}>
                <span>{isSelectionMode ? `Đã chọn ${selectedIdsForAction.length}` : 'Chọn cụm tài khoản'}</span>
                
                {!isSelectionMode ? (
                  <div className={styles.headerActions}>
                    <button 
                      className={styles.iconBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowManagementMenu(!showManagementMenu);
                      }}
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {showManagementMenu && (
                      <div className={styles.managementPopup}>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setShowCreateModal(true);
                          setShowManagementMenu(false);
                          setIsOpen(false);
                        }}>
                          <Plus size={14} /> Thêm cụm mới
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setIsSelectionMode(true);
                          setShowManagementMenu(false);
                        }}>
                          <Check size={14} /> Quản lý cụm
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.headerActions}>
                    <button 
                      className={clsx(styles.actionBtn, styles.deleteBtn)}
                      disabled={selectedIdsForAction.length === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Xóa ${selectedIdsForAction.length} cụm đã chọn?`)) {
                          // Handle bulk delete
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
                      className={styles.actionBtn}
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
                className={clsx(styles.menuItem, !selectedGroupId && styles.activeItem)}
                onClick={() => {
                  setGroupId(null);
                  setIsOpen(false);
                  setViewMode('all');
                  router.push('/dashboard/inbox');
                }}
              >
                <div className={styles.placeholderIcon}>
                  <Users size={14} />
                </div>
                <span className={styles.menuItemName}>Tất cả cụm</span>
                {!selectedGroupId && <Check size={14} className={styles.checkIcon} />}
              </button>

              <div className={styles.menuDivider} />

              <Reorder.Group 
                axis="y" 
                values={accountGroups} 
                onReorder={handleReorder}
                className={styles.reorderGroup}
              >
                {accountGroups.map(group => (
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
            </div>
          )}
        </div>


        <button 
          className={clsx(styles.tab, styles.flowTab, viewMode === 'daily_flow' && styles.active)}
          onClick={() => { 
            if (viewMode === 'daily_flow') {
              setViewMode('all');
              router.push('/dashboard/inbox');
            } else {
              setViewMode('daily_flow'); 
              router.push('/dashboard/inbox/flow'); 
            }
          }}
        >
          <Zap size={16} className={styles.icon} />
          <span>Daily Flow</span>
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.platformButtons}>
          <button 
            className={clsx(styles.platformBtn, platform === 'all' && styles.activePlatform)}
            onClick={() => setPlatform('all')}
          >
            Tất cả {unreadCounts.all > 0 && <span className={styles.countBadge}>{formatCount(unreadCounts.all)}</span>}
          </button>
          <button 
            className={clsx(styles.platformBtn, platform === 'facebook' && styles.activePlatform)}
            onClick={() => setPlatform('facebook')}
          >
            Messenger {unreadCounts.facebook > 0 && <span className={styles.countBadge}>{formatCount(unreadCounts.facebook)}</span>}
          </button>
          <button 
            className={clsx(styles.platformBtn, platform === 'instagram' && styles.activePlatform)}
            onClick={() => setPlatform('instagram')}
          >
            Instagram {unreadCounts.instagram > 0 && <span className={styles.countBadge}>{formatCount(unreadCounts.instagram)}</span>}
          </button>
        </div>
        

      </div>
    </div>

      {showCreateModal && (
        <CreateClusterModal 
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchCounts}
        />
      )}
    </>
  );
}

function ReorderItem({ 
  group, 
  selectedGroupId, 
  isSelectionMode, 
  isSelected, 
  onSelect, 
  onActivate 
}: { 
  group: AccountGroup; 
  selectedGroupId: string | null;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={group}
      dragListener={false}
      dragControls={controls}
      className={clsx(
        styles.menuItem, 
        selectedGroupId === group.id && !isSelectionMode && styles.activeItem,
        isSelectionMode && isSelected && styles.selectedItem
      )}
    >
      <div 
        className={styles.menuItemContent}
        onClick={() => {
          if (isSelectionMode) {
            onSelect(group.id);
          } else {
            onActivate(group.id);
          }
        }}
      >
        {isSelectionMode && (
          <div className={clsx(styles.checkbox, isSelected && styles.checkboxChecked)}>
            {isSelected && <Check size={10} color="#fff" />}
          </div>
        )}
        <CombinedAvatar group={group} unreadCount={group.unreadCount} />
        <span className={styles.menuItemName}>{group.name}</span>
        {!isSelectionMode && selectedGroupId === group.id && <Check size={14} className={styles.checkIcon} />}
      </div>
      
      <div className={styles.itemActions}>
        {isSelectionMode && isSelected && (
          <button className={styles.editBtn} onClick={(e) => {
            e.stopPropagation();
            alert('Tính năng Sửa đang được phát triển');
          }}>
            <Edit2 size={12} />
          </button>
        )}
        <div 
          className={styles.dragHandle}
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={14} />
        </div>
      </div>
    </Reorder.Item>
  );
}

function CombinedAvatar({ group, unreadCount }: { group: AccountGroup; unreadCount?: number }) {
  const fbAccount = group.members.find(m => m.platform === 'facebook');
  const igAccount = group.members.find(m => m.platform === 'instagram');

  const renderAvatar = (account: PlatformAccount | undefined, isSub = false) => {
    if (!account) return null;
    const avatarUrl = account.metadata?.avatar_url;
    const initial = account.name?.[0] || '?';

    return (
      <div className={isSub ? styles.subAvatar : styles.mainAvatar}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" />
        ) : (
          <div className={styles.avatarPlaceholder} style={isSub ? { fontSize: '0.5rem' } : {}}>
            {initial}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.avatarGroup}>
      {fbAccount && renderAvatar(fbAccount)}
      {igAccount && renderAvatar(igAccount, true)}
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className={styles.badge}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}

