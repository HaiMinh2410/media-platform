'use client';

import React from 'react';
import styles from './chat.module.css';
import { PlatformIcon } from '@/components/ui/inbox-shared';
import { PanelRight, MoreHorizontal } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import clsx from 'clsx';

type ChatHeaderProps = {
  customerName: string;
  customerAvatar?: string;
  platform: string;
  platformUserName: string;
};

export function ChatHeader({
  customerName,
  customerAvatar,
  platform,
  platformUserName,
}: ChatHeaderProps) {
  const toggleRightPanel = useInboxStore((state) => state.toggleRightPanel);
  const isRightPanelVisible = useInboxStore((state) => state.isRightPanelVisible);

  const getInitials = (name: string) => {
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {customerAvatar ? (
            <img src={customerAvatar} alt={customerName} className={styles.avatarImg} />
          ) : (
            getInitials(customerName)
          )}
        </div>
        <div>
          <h2 className={styles.userName}>{customerName}</h2>
          <div className={styles.platformDetails}>
            <PlatformIcon platform={platform as any} size={14} />
            <span className={styles.platformBadge}>{platform}</span>
            <span className={styles.status}>via {platformUserName}</span>
          </div>
        </div>
      </div>
      <div className={styles.headerActions}>
        <button 
          className={clsx(styles.actionBtn, isRightPanelVisible && styles.activeActionBtn)}
          onClick={toggleRightPanel}
          title="Toggle Right Panel"
        >
          <PanelRight size={20} />
        </button>
        <button className={styles.actionBtn}>
          <MoreHorizontal size={20} />
        </button>
      </div>
    </header>
  );
}
