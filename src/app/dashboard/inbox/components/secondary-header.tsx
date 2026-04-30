'use client';

import React from 'react';
import styles from './secondary-header.module.css';
import { useInboxStore } from '../store/inbox.store';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Inbox, Zap, MessageCircle, Users, Sparkles } from 'lucide-react';

export function SecondaryHeader() {
  const { 
    viewMode, setViewMode,
    platform, setPlatform,
    segmentFilter, setSegmentFilter
  } = useInboxStore();
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button 
          className={clsx(styles.tab, viewMode === 'all' && styles.active)}
          onClick={() => { setViewMode('all'); router.push('/dashboard/inbox'); }}
        >
          <Inbox size={16} className={styles.icon} />
          <span>Unified Inbox</span>
        </button>
        <button 
          className={clsx(styles.tab, styles.flowTab, viewMode === 'daily_flow' && styles.active)}
          onClick={() => { setViewMode('daily_flow'); router.push('/dashboard/inbox/flow'); }}
        >
          <Zap size={16} className={styles.icon} />
          <span>Daily Flow</span>
        </button>
        <button 
          className={clsx(styles.tab, viewMode === 'by_account' && styles.active)}
          onClick={() => { setViewMode('by_account'); router.push('/dashboard/inbox'); }}
        >
          <MessageCircle size={16} className={styles.icon} />
          <span>By Account</span>
        </button>
        <button 
          className={clsx(styles.tab, viewMode === 'by_contacts' && styles.active)}
          onClick={() => { setViewMode('by_contacts'); router.push('/dashboard/inbox'); }}
        >
          <Users size={16} className={styles.icon} />
          <span>By Contacts</span>
        </button>
        <button 
          className={clsx(styles.tab, viewMode === 'ai_priority' && styles.active)}
          onClick={() => { setViewMode('ai_priority'); router.push('/dashboard/inbox'); }}
        >
          <Sparkles size={16} className={styles.icon} />
          <span>AI Priority</span>
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
