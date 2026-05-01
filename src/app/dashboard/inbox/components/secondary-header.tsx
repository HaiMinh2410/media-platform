'use client';

import React from 'react';
import styles from './secondary-header.module.css';
import { useInboxStore } from '../store/inbox.store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Inbox, Zap, ChevronDown, Check, Users } from 'lucide-react';
import { useUnreadRealtime } from '../hooks/use-unread-realtime';



import { getAccountGroupsAction } from '@/application/actions/account-group.actions';
import { getUnreadCountsAction, UnreadCounts } from '@/application/actions/unread-counts.actions';
import { AccountGroup } from '@/domain/types/account-group';

export function SecondaryHeader({ workspaceId }: { workspaceId: string }) {
  const { 
    viewMode, setViewMode,
    platform, setPlatform,
    segmentFilter, setSegmentFilter,
    selectedGroupId, setGroupId,
    accountGroups, setAccountGroups 
  } = useInboxStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
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

  // Real-time updates via Supabase
  useUnreadRealtime({ 
    workspaceId, 
    onRefresh: fetchCounts 
  });

  React.useEffect(() => {
    if (workspaceId) {
      fetchCounts();
      const interval = setInterval(fetchCounts, 15000); // Polling fallback every 15s
      return () => clearInterval(interval);
    }
  }, [workspaceId, fetchCounts]);

  const formatCount = (count: number) => count > 9 ? '9+' : count;

  return (
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
                  {unreadCounts.all > 0 && (
                    <div className={styles.badge}>
                      {unreadCounts.all > 9 ? '9+' : unreadCounts.all}
                    </div>
                  )}
                </div>
                <span className={styles.placeholderText}>Tất cả cụm</span>
              </div>
            )}
            <ChevronDown size={14} className={clsx(styles.chevron, isOpen && styles.chevronOpen)} />
          </button>

          {isOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.menuHeader}>Chọn cụm tài khoản</div>
              <button 
                className={clsx(styles.menuItem, !selectedGroupId && styles.activeItem)}
                onClick={() => {
                  setGroupId(null);
                  setIsOpen(false);
                }}
              >
                <div className={styles.placeholderIcon}>
                  <Users size={14} />
                  {unreadCounts.all > 0 && (
                    <div className={styles.badge}>
                      {unreadCounts.all > 9 ? '9+' : unreadCounts.all}
                    </div>
                  )}
                </div>
                <span className={styles.menuItemName}>Tất cả cụm</span>
                {!selectedGroupId && <Check size={14} className={styles.checkIcon} />}
              </button>

              <div className={styles.menuDivider} />

              {accountGroups.map(group => (
                <button 
                  key={group.id}
                  className={clsx(styles.menuItem, selectedGroupId === group.id && styles.activeItem)}
                  onClick={() => {
                    setGroupId(group.id);
                    setIsOpen(false);
                    router.push('/dashboard/inbox');
                  }}
                >
                  <CombinedAvatar group={group} unreadCount={group.unreadCount} />
                  <span className={styles.menuItemName}>{group.name}</span>
                  {selectedGroupId === group.id && <Check size={14} className={styles.checkIcon} />}
                </button>
              ))}
            </div>
          )}
        </div>


        <button 
          className={clsx(styles.tab, styles.flowTab, viewMode === 'daily_flow' && styles.active)}
          onClick={() => { setViewMode('daily_flow'); router.push('/dashboard/inbox/flow'); }}
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
        
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect}
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as any)}
          >
            <option value="all">All Segments</option>
            <option value="hot_lead">🔥 Hot Leads</option>
            <option value="cold">❄️ Cold</option>
            <option value="needs_reply">⏰ Needs Reply</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function CombinedAvatar({ group, unreadCount }: { group: AccountGroup; unreadCount?: number }) {
  const fbAccount = group.members.find(m => m.platform === 'facebook');
  const igAccount = group.members.find(m => m.platform === 'instagram');

  const renderAvatar = (account: any, isSub = false) => {
    const avatarUrl = account.metadata?.avatar_url;
    const initial = account.name?.[0] || account.platform_user_name?.[0] || '?';

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
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );
}

