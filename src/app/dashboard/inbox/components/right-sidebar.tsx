'use client';

import React, { useState } from 'react';
import styles from './chat.module.css';
import { AiSuggestionPanel } from './ai-suggestion-panel';

type TabType = 'conversation' | 'notes' | 'ai' | 'profile';

type RightSidebarProps = {
  conversationId: string;
  tags: string[];
  priority: string | null;
  sentiment: string | null;
  suggestions: any[];
  loadingSuggestions: boolean;
  onUseSuggestion: (text: string) => void;
  onDismissSuggestion: (id: string) => void;
  onUpdateTags: (tags: string[]) => void;
  onUpdatePriority: (priority: string) => void;
  onUpdateSentiment: (sentiment: string) => void;
};

export function RightSidebar({
  conversationId,
  tags,
  priority,
  sentiment,
  suggestions,
  loadingSuggestions,
  onUseSuggestion,
  onDismissSuggestion,
  onUpdateTags,
  onUpdatePriority,
  onUpdateSentiment,
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('conversation');

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.workspaceTabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'conversation' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          Details
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI Assist
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'conversation' && (
          <div className={styles.intelSidebar}>
            <div className={styles.intelSection}>
              <h3>Contact Intel</h3>
              <div className={styles.intelGrid}>
                <div className={styles.intelCard}>
                  <span className={styles.intelLabel}>Lead Score</span>
                  <span className={styles.intelValue}>85/100</span>
                </div>
                <div className={styles.intelCard}>
                  <span className={styles.intelLabel}>Sentiment</span>
                  <span className={styles.intelValue}>{sentiment || 'Neutral'}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.intelSection}>
              <h3>Channel Activity</h3>
              <div className={styles.activityStats}>
                <div className={styles.statRow}>
                  <span>Total Messages</span>
                  <strong>24</strong>
                </div>
                <div className={styles.statRow}>
                  <span>Avg Response Time</span>
                  <strong>15m</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <AiSuggestionPanel
            suggestions={suggestions}
            tags={tags}
            priority={priority}
            sentiment={sentiment}
            loading={loadingSuggestions}
            onUse={onUseSuggestion}
            onDismiss={onDismissSuggestion}
            onUpdateTags={onUpdateTags}
            onUpdatePriority={onUpdatePriority}
            onUpdateSentiment={onUpdateSentiment}
          />
        )}

        {activeTab === 'notes' && (
          <div className={styles.notesSection}>
            <p className={styles.emptyText}>No notes yet. Add a note to collaborate with your team.</p>
            <textarea 
              className={styles.notesArea} 
              placeholder="Add internal note..."
            ></textarea>
            <button className={styles.saveNoteBtn}>Save Note</button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className={styles.profileSection}>
            <div className={styles.profileField}>
              <label>Email</label>
              <input type="email" placeholder="customer@example.com" className={styles.profileInput} />
            </div>
            <div className={styles.profileField}>
              <label>Phone</label>
              <input type="tel" placeholder="+1234567890" className={styles.profileInput} />
            </div>
            <button className={styles.saveNoteBtn}>Update CRM</button>
          </div>
        )}
      </div>
    </aside>
  );
}
