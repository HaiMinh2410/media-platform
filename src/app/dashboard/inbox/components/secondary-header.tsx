'use client';

import React from 'react';
import styles from './secondary-header.module.css';
import { useInboxStore } from '../store/inbox.store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Inbox, Zap, MessageCircle, Users, Sparkles } from 'lucide-react';

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

        {accountGroups.map(group => {

          const fbAccount = group.members.find(m => m.platform === 'facebook');
          const igAccount = group.members.find(m => m.platform === 'instagram');
          
          return (
            <button 
              key={group.id}
              className={clsx(styles.tab, selectedGroupId === group.id && styles.active)}
              onClick={() => { setGroupId(group.id); router.push('/dashboard/inbox'); }}
            >
              <div className={styles.avatarGroup}>
                {fbAccount && (
                  <div className={styles.mainAvatar}>
                    {fbAccount.metadata?.avatar_url ? (
                      <img src={fbAccount.metadata.avatar_url} alt="" />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{fbAccount.name[0]}</div>
                    )}
                  </div>
                )}
                {igAccount && (
                  <div className={styles.subAvatar}>
                    {igAccount.metadata?.avatar_url ? (
                      <img src={igAccount.metadata.avatar_url} alt="" />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{igAccount.name[0]}</div>
                    )}
                  </div>
                )}
                {/* Badge simulation */}
                <div className={styles.badge} />
              </div>
              <span className={styles.groupName}>{group.name}</span>
            </button>
          );
        })}

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
