'use client';

import React from 'react';
import styles from './secondary-header.module.css';
import { useInboxStore } from '../store/inbox.store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Inbox, Zap, ChevronDown, Check, Users } from 'lucide-react';



import { getAccountGroupsAction } from '@/application/actions/account-group.actions';
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

  React.useEffect(() => {
    if (workspaceId && accountGroups.length === 0) {
      getAccountGroupsAction(workspaceId).then(res => {
        if (res.data) setAccountGroups(res.data);
      });
    }
  }, [workspaceId, accountGroups.length, setAccountGroups]);

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button 
          className={clsx(styles.tab, !selectedGroupId && styles.active)}
          onClick={() => { setGroupId(null); router.push('/dashboard/inbox'); }}
        >
          <Inbox size={16} className={styles.icon} />
          <span>Tất cả tin nhắn</span>
        </button>

        <div className={styles.dropdownContainer} ref={dropdownRef}>
          <button 
            className={clsx(styles.dropdownTrigger, selectedGroupId && styles.activeTrigger)}
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedGroup ? (
              <div className={styles.activeSelection}>
                <CombinedAvatar group={selectedGroup} />
                <span className={styles.triggerName}>{selectedGroup.name}</span>
              </div>
            ) : (
              <div className={styles.activeSelection}>
                <div className={styles.placeholderIcon}><Users size={14} /></div>
                <span className={styles.placeholderText}>Cụm tài khoản</span>
              </div>
            )}
            <ChevronDown size={14} className={clsx(styles.chevron, isOpen && styles.chevronOpen)} />
          </button>

          {isOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.menuHeader}>Chọn cụm tài khoản</div>
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
                  <CombinedAvatar group={group} />
                  <span className={styles.menuItemName}>{group.name}</span>
                  {selectedGroupId === group.id && <Check size={14} className={styles.checkIcon} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.divider} />

        <button 
          className={clsx(styles.tab, styles.flowTab, viewMode === 'daily_flow' && styles.active)}
          onClick={() => { setViewMode('daily_flow'); router.push('/dashboard/inbox/flow'); }}
        >
          <Zap size={16} className={styles.icon} />
          <span>Daily Flow</span>
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <select 
            className={styles.filterSelect}
            value={platform}
            onChange={(e) => setPlatform(e.target.value as any)}
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook Pages</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
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

function CombinedAvatar({ group }: { group: AccountGroup }) {
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
      <div className={styles.badge} />
    </div>
  );
}

