'use client';

import React from 'react';
import { 
  Zap, ChevronDown, Check, Users, Plus, 
  MoreHorizontal, Trash2, Edit2,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="flex items-center justify-between px-6 h-[56px] border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-xl sticky top-0 z-20 w-full">
      <div className="flex items-center gap-3 h-full">

        <div className="relative flex items-center" ref={dropdownRef}>
          <button 
            className={cn(
              "flex items-center gap-3 px-3.5 h-10 bg-white/5 border border-white/5 rounded-lg text-foreground-secondary cursor-pointer transition-all duration-200 min-w-[180px] outline-none hover:bg-white/10 hover:border-white/10 hover:-translate-y-px",
              selectedGroupId && "bg-accent-primary/10 border-accent-primary/20 text-foreground"
            )}
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedGroup ? (
              <div className="flex items-center gap-2.5 flex-1">
                <CombinedAvatar group={selectedGroup} unreadCount={selectedGroup.unreadCount} />
                <span className="text-sm font-semibold">{selectedGroup.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 flex-1">
                <div className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-md text-foreground-tertiary">
                  <Users size={14} />
                </div>
                <span className="text-sm opacity-60">Tất cả cụm</span>
              </div>
            )}
            <ChevronDown size={14} className={cn("transition-transform duration-200 opacity-50", isOpen && "rotate-180")} />
          </button>

          {isOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[280px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-[100] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-[8px_12px_12px] text-[0.6875rem] font-bold text-foreground-tertiary uppercase tracking-[0.08em] flex items-center justify-between">
                <span>{isSelectionMode ? `Đã chọn ${selectedIdsForAction.length}` : 'Chọn cụm tài khoản'}</span>
                
                {!isSelectionMode ? (
                  <div className="flex items-center gap-2 relative">
                    <button 
                      className="bg-white/5 border border-white/10 text-foreground-secondary rounded-md w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-white/10 hover:text-foreground hover:border-white/20 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowManagementMenu(!showManagementMenu);
                      }}
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {showManagementMenu && (
                      <div className="absolute top-full right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-40 overflow-hidden z-[101] p-1">
                        <button 
                          className="w-full p-[10px_12px] flex items-center gap-2.5 bg-transparent border-none text-foreground-secondary text-[0.8125rem] font-medium cursor-pointer rounded-lg hover:bg-white/5 hover:text-foreground transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateModal(true);
                            setShowManagementMenu(false);
                            setIsOpen(false);
                          }}
                        >
                          <Plus size={14} /> Thêm cụm mới
                        </button>
                        <button 
                          className="w-full p-[10px_12px] flex items-center gap-2.5 bg-transparent border-none text-foreground-secondary text-[0.8125rem] font-medium cursor-pointer rounded-lg hover:bg-white/5 hover:text-foreground transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSelectionMode(true);
                            setShowManagementMenu(false);
                          }}
                        >
                          <Check size={14} /> Quản lý cụm
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 relative">
                    <button 
                      className={cn(
                        "p-[4px_10px] rounded-md text-[0.75rem] font-semibold cursor-pointer transition-all bg-status-error/10 border border-status-error/20 text-status-error",
                        selectedIdsForAction.length === 0 && "opacity-30 cursor-not-allowed"
                      )}
                      disabled={selectedIdsForAction.length === 0}
                      onClick={(e) => {
                        e.stopPropagation();
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
                      className="p-[4px_10px] rounded-md text-[0.75rem] font-semibold cursor-pointer transition-all bg-white/5 border border-white/10 text-foreground hover:bg-white/10"
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
                  "flex items-center gap-3 w-full p-[10px_12px] rounded-xl border-none bg-transparent text-foreground-secondary cursor-pointer transition-all duration-150 text-left hover:bg-white/5 hover:text-foreground",
                  !selectedGroupId && "bg-accent-primary/10 text-foreground"
                )}
                onClick={() => {
                  setGroupId(null);
                  setIsOpen(false);
                  setViewMode('all');
                  router.push('/dashboard/inbox');
                }}
              >
                <div className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-md text-foreground-tertiary">
                  <Users size={14} />
                </div>
                <span className="flex-1 text-[0.875rem] font-medium">Tất cả cụm</span>
                {!selectedGroupId && <Check size={14} className="text-accent-primary" />}
              </button>

              <div className="h-px bg-white/5 m-[4px_8px]" />

              <Reorder.Group 
                axis="y" 
                values={accountGroups} 
                onReorder={handleReorder}
                className="list-none p-0 m-0 select-none"
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
          className={cn(
            "flex items-center gap-2.5 px-3 h-10 text-foreground-secondary text-sm font-medium border border-transparent bg-transparent cursor-pointer relative transition-all duration-250 rounded-lg hover:text-foreground hover:bg-white/5 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
            viewMode === 'daily_flow' && "text-foreground bg-accent-primary/10 border-accent-primary/20 shadow-md"
          )}
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
          <Zap size={16} className="text-[#fbbf24] opacity-100" />
          <span>Daily Flow</span>
        </button>
      </div>

      <div className="flex items-center gap-3 pl-4 border-l border-white/10">
        <div className="flex items-center bg-white/5 p-1 rounded-[14px] border border-white/5">
          <button 
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg border-none bg-transparent text-foreground-secondary text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:text-foreground hover:bg-white/5",
              platform === 'all' && "bg-accent-primary/10 text-accent-primary shadow-sm"
            )}
            onClick={() => setPlatform('all')}
          >
            Tất cả {unreadCounts.all > 0 && <span className="bg-[#ff4757] text-white text-[0.625rem] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_0_10px_rgba(255,71,87,0.4)] ml-1">{formatCount(unreadCounts.all)}</span>}
          </button>
          <button 
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg border-none bg-transparent text-foreground-secondary text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:text-foreground hover:bg-white/5",
              platform === 'facebook' && "bg-accent-primary/10 text-accent-primary shadow-sm"
            )}
            onClick={() => setPlatform('facebook')}
          >
            Messenger {unreadCounts.facebook > 0 && <span className="bg-[#ff4757] text-white text-[0.625rem] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_0_10px_rgba(255,71,87,0.4)] ml-1">{formatCount(unreadCounts.facebook)}</span>}
          </button>
          <button 
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg border-none bg-transparent text-foreground-secondary text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:text-foreground hover:bg-white/5",
              platform === 'instagram' && "bg-accent-primary/10 text-accent-primary shadow-sm"
            )}
            onClick={() => setPlatform('instagram')}
          >
            Instagram {unreadCounts.instagram > 0 && <span className="bg-[#ff4757] text-white text-[0.625rem] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-[0_0_10px_rgba(255,71,87,0.4)] ml-1">{formatCount(unreadCounts.instagram)}</span>}
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
      className={cn(
        "flex items-center gap-3 w-full p-[10px_12px] rounded-xl border-none bg-transparent text-foreground-secondary cursor-pointer transition-all duration-150 text-left hover:bg-white/5 hover:text-foreground group",
        selectedGroupId === group.id && !isSelectionMode && "bg-accent-primary/10 text-foreground",
        isSelectionMode && isSelected && "bg-accent-primary/5"
      )}
    >
      <div 
        className="flex items-center gap-3 flex-1"
        onClick={() => {
          if (isSelectionMode) {
            onSelect(group.id);
          } else {
            onActivate(group.id);
          }
        }}
      >
        {isSelectionMode && (
          <div className={cn(
            "w-[18px] h-[18px] rounded-[5px] border-2 border-white/10 flex items-center justify-center transition-all shrink-0",
            isSelected && "bg-accent-primary border-accent-primary"
          )}>
            {isSelected && <Check size={10} color="#fff" />}
          </div>
        )}
        <CombinedAvatar group={group} unreadCount={group.unreadCount} />
        <span className="flex-1 text-[0.875rem] font-medium">{group.name}</span>
        {!isSelectionMode && selectedGroupId === group.id && <Check size={14} className="text-accent-primary" />}
      </div>
      
      <div className="flex items-center gap-1">
        {isSelectionMode && isSelected && (
          <button className="w-6 h-6 rounded-md flex items-center justify-center bg-white/5 border border-white/10 text-foreground-secondary cursor-pointer transition-all hover:bg-white/10 hover:text-foreground" onClick={(e) => {
            e.stopPropagation();
            alert('Tính năng Sửa đang được phát triển');
          }}>
            <Edit2 size={12} />
          </button>
        )}
        <div 
          className="cursor-grab text-foreground-tertiary opacity-0 transition-opacity duration-200 p-1 rounded-md hover:bg-white/5 group-hover:opacity-50 hover:opacity-100 active:cursor-grabbing"
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
      <div className={isSub ? "w-[18px] h-[18px] rounded-sm overflow-hidden border-[1.5px] border-[#0f0f0f] bg-[#2a2a2a] z-[3] absolute -bottom-0.5 -right-0.5 shadow-md transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[2px]" : "w-6 h-6 rounded-md overflow-hidden border-[1.5px] border-[#0f0f0f] bg-[#1a1a1a] z-[2] absolute top-0 left-0 shadow-sm"}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/15 to-white/5 text-white font-bold text-[0.75rem] uppercase rounded-inherit" style={isSub ? { fontSize: '0.5rem' } : {}}>
            {initial}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-7 h-7 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
      {fbAccount && renderAvatar(fbAccount)}
      {igAccount && renderAvatar(igAccount, true)}
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[#ff4757] text-white rounded-full border-[1.5px] border-[#0f0f0f] z-[4] shadow-[0_2px_6px_rgba(255,71,87,0.4)] text-[0.625rem] font-extrabold flex items-center justify-center leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}

