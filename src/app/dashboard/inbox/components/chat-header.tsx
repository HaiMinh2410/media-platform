'use client';

import React from 'react';
import styles from './chat.module.css';
import { PlatformIcon } from '@/components/ui/inbox-shared';

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
        <button className={styles.actionBtn}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
