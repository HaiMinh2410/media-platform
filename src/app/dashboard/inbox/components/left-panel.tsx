'use client';

import React from 'react';
import styles from './left-panel.module.css';
import { useInboxStore } from '../store/inbox.store';
import { 
  Inbox, 
  Users, 
  MessageCircle, 
  Sparkles, 
  Filter,
  Flame,
  Snowflake,
  Clock,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';

export function LeftPanel() {
  const { 
    viewMode, setViewMode,
    platform, setPlatform,
    segmentFilter, setSegmentFilter
  } = useInboxStore();

  return (
    <div className={styles.leftPanel}>
      <div className={styles.header}>
        <h2>Views</h2>
      </div>

      <div className={styles.section}>
        <div className={styles.menuList}>
          <button 
            className={clsx(styles.menuItem, viewMode === 'all' && styles.active)}
            onClick={() => setViewMode('all')}
          >
            <Inbox size={18} />
            <span>Unified Inbox</span>
          </button>
          <button 
            className={clsx(styles.menuItem, viewMode === 'by_account' && styles.active)}
            onClick={() => setViewMode('by_account')}
          >
            <MessageCircle size={18} />
            <span>By Account</span>
          </button>
          <button 
            className={clsx(styles.menuItem, viewMode === 'by_contacts' && styles.active)}
            onClick={() => setViewMode('by_contacts')}
          >
            <Users size={18} />
            <span>By Contacts</span>
          </button>
          <button 
            className={clsx(styles.menuItem, viewMode === 'ai_priority' && styles.active)}
            onClick={() => setViewMode('ai_priority')}
          >
            <Sparkles size={18} />
            <span>AI Priority</span>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Account Matrix</h3>
          <ChevronDown size={14} />
        </div>
        <div className={styles.menuList}>
          <button 
            className={clsx(styles.menuItem, platform === 'all' && styles.active)}
            onClick={() => setPlatform('all')}
          >
            <div className={styles.iconPlaceholder}>A</div>
            <span>All Platforms</span>
          </button>
          <button 
            className={clsx(styles.menuItem, platform === 'facebook' && styles.active)}
            onClick={() => setPlatform('facebook')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className={styles.fbIcon}>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook Pages</span>
            <div className={clsx(styles.statusIndicator, styles.healthy)} />
          </button>
          <button 
            className={clsx(styles.menuItem, platform === 'instagram' && styles.active)}
            onClick={() => setPlatform('instagram')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.igIcon}>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <span>Instagram</span>
            <div className={clsx(styles.statusIndicator, styles.healthy)} />
          </button>
          <button 
            className={clsx(styles.menuItem, platform === 'tiktok' && styles.active)}
            onClick={() => setPlatform('tiktok')}
          >
            <div className={styles.tiktokIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
              </svg>
            </div>
            <span>TikTok</span>
            <div className={clsx(styles.statusIndicator, styles.warning)} />
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Smart Segments</h3>
          <Filter size={14} />
        </div>
        <div className={styles.menuList}>
          <button 
            className={clsx(styles.menuItem, segmentFilter === 'hot_lead' && styles.active)}
            onClick={() => setSegmentFilter('hot_lead')}
          >
            <Flame size={18} className={styles.hotIcon} />
            <span>Hot Leads</span>
          </button>
          <button 
            className={clsx(styles.menuItem, segmentFilter === 'cold' && styles.active)}
            onClick={() => setSegmentFilter('cold')}
          >
            <Snowflake size={18} className={styles.coldIcon} />
            <span>Cold</span>
          </button>
          <button 
            className={clsx(styles.menuItem, segmentFilter === 'needs_reply' && styles.active)}
            onClick={() => setSegmentFilter('needs_reply')}
          >
            <Clock size={18} className={styles.clockIcon} />
            <span>Needs Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
}
