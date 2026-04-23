'use client';

import React from 'react';
import styles from './chat.module.css';

type ContextProps = {
  platform: string;
  externalId: string;
  lastMessageAt: Date;
  pageName: string;
};

export function ConversationContext({ platform, externalId, lastMessageAt, pageName }: ContextProps) {
  return (
    <>
      <div className={styles.sideSection}>
        <h3>Conversation Details</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Platform</span>
            <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>{platform}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>External ID</span>
            <span className={styles.infoValue}>{externalId}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Last Message</span>
            <span className={styles.infoValue}>{new Date(lastMessageAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className={styles.sideSection}>
        <h3>Account Context</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Connected Account</span>
            <span className={styles.infoValue}>{pageName}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status</span>
            <span className={styles.infoValue} style={{ color: 'var(--success)', fontWeight: 600 }}>Active</span>
          </div>
        </div>
      </div>
    </>
  );
}
