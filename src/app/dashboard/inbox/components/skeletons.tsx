'use client';

import React from 'react';
import styles from './skeletons.module.css';

export function ConversationSkeleton() {
  return (
    <div className={styles.itemSkeleton}>
      <div className={`${styles.skeleton} ${styles.avatarSkeleton}`} />
      <div className={styles.textSkeleton}>
        <div className={`${styles.skeleton} ${styles.titleSkeleton}`} />
        <div className={`${styles.skeleton} ${styles.descSkeleton}`} />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
      <div className={`${styles.skeleton} ${styles.bubbleSkeleton} ${styles.bubbleSkeletonLeft}`} />
      <div className={`${styles.skeleton} ${styles.bubbleSkeleton} ${styles.bubbleSkeletonRight}`} style={{ width: '45%' }} />
      <div className={`${styles.skeleton} ${styles.bubbleSkeleton} ${styles.bubbleSkeletonLeft}`} style={{ width: '70%' }} />
      <div className={`${styles.skeleton} ${styles.bubbleSkeleton} ${styles.bubbleSkeletonRight}`} />
    </div>
  );
}
