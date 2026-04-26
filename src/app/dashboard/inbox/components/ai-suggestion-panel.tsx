'use client';

import React from 'react';
import type { AiSuggestion } from '@/domain/types/messaging';
import styles from './ai-suggestion-panel.module.css';

type Props = {
  suggestions: AiSuggestion[];
  tags: string[];
  priority: string | null;
  sentiment: string | null;
  loading: boolean;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
  onUpdateTags?: (tags: string[]) => void;
  onUpdatePriority?: (priority: string) => void;
  onUpdateSentiment?: (sentiment: string) => void;
};

function formatModel(model: string): string {
  if (model.includes('llama-3.3-70b')) return 'LLaMA 3.3 70B';
  if (model.includes('llama-3.1-8b')) return 'LLaMA 3.1 8B';
  if (model.includes('qwen-qwq-32b')) return 'Qwen3 32B';
  if (model.includes('gpt-oss-120b')) return 'GPT-OSS 120B';
  return model;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SuggestionCard({ suggestion, onUse, onDismiss }: {
  suggestion: AiSuggestion;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.aiLabel}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>AI Reply</span>
          <span className={styles.modelBadge}>{formatModel(suggestion.model)}</span>
        </div>
        <span className={styles.timeAgo}>{timeAgo(suggestion.createdAt)}</span>
      </div>

      <p className={styles.suggestionText}>{suggestion.response}</p>

      <div className={styles.cardActions}>
        <button
          className={styles.useBtn}
          onClick={() => onUse(suggestion.response)}
        >
          Use this
        </button>
        <button
          className={styles.dismissBtn}
          onClick={() => onDismiss(suggestion.id)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * AiSuggestionPanel
 *
 * Enhanced in T080 to include Smart Tagging and Conversation Insights.
 */
export function AiSuggestionPanel({ 
  suggestions, 
  tags, 
  priority, 
  sentiment, 
  loading, 
  onUse, 
  onDismiss,
  onUpdateTags,
  onUpdatePriority,
  onUpdateSentiment
}: Props) {
  const visible = suggestions.slice(0, 5);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newTag = e.currentTarget.value.trim();
      if (!tags.includes(newTag)) {
        onUpdateTags?.([...tags, newTag]);
      }
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateTags?.(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className={styles.panel}>
      {/* --- Insights Section --- */}
      <div className={styles.insightsSection}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
            <span>Insights</span>
          </div>
        </div>
        
        <div className={styles.insightsRow}>
          <div className={styles.insightItem}>
            <span className={styles.insightLabel}>Priority</span>
            <select 
              className={`${styles.insightSelect} ${styles['prio_' + priority?.toLowerCase()]}`}
              value={priority || 'none'}
              onChange={(e) => onUpdatePriority?.(e.target.value)}
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className={styles.insightItem}>
            <span className={styles.insightLabel}>Sentiment</span>
            <select 
              className={styles.insightSelect}
              value={sentiment || 'neutral'}
              onChange={(e) => onUpdateSentiment?.(e.target.value)}
            >
              <option value="positive">Positive 😊</option>
              <option value="neutral">Neutral 😐</option>
              <option value="frustrated">Frustrated 😠</option>
              <option value="negative">Negative 😟</option>
            </select>
          </div>
        </div>

        <div className={styles.tagSection}>
          <div className={styles.tagList}>
            {tags.map(tag => (
              <span key={tag} className={styles.tagChip}>
                {tag}
                <button onClick={() => removeTag(tag)} className={styles.tagRemove}>&times;</button>
              </span>
            ))}
            <input 
              className={styles.tagInput} 
              placeholder="+ Add tag..." 
              onKeyDown={handleAddTag}
            />
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* --- Suggestions Section --- */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>AI Suggestions</span>
        </div>
        {visible.length > 0 && (
          <span className={styles.badge}>{visible.length}</span>
        )}
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.shimmer} />
          <div className={styles.shimmer} style={{ width: '80%' }} />
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className={styles.emptyState}>
          <p>No suggestions yet</p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className={styles.cardList}>
          {visible.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onUse={onUse}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
