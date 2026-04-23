'use client';

import React from 'react';
import type { AiSuggestion } from '@/domain/types/messaging';
import styles from './ai-suggestion-panel.module.css';

type Props = {
  suggestions: AiSuggestion[];
  loading: boolean;
  onUse: (text: string) => void;
  onDismiss: (id: string) => void;
};

function formatModel(model: string): string {
  if (model.includes('llama-3.3-70b')) return 'LLaMA 3.3 70B';
  if (model.includes('llama-3.1-8b')) return 'LLaMA 3.1 8B';
  if (model.includes('qwen-qwq-32b')) return 'Qwen3 32B';
  if (model.includes('gpt-oss-120b')) return 'GPT-OSS 120B';
  // Legacy fallbacks
  if (model.includes('llama3-70b')) return 'LLaMA 3 70B';
  if (model.includes('llama3-8b')) return 'LLaMA 3 8B';
  if (model.includes('mixtral')) return 'Mixtral 8×7B';
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
          <span>AI</span>
          <span className={styles.modelBadge}>{formatModel(suggestion.model)}</span>
        </div>
        <span className={styles.timeAgo}>{timeAgo(suggestion.createdAt)}</span>
      </div>

      <p className={styles.suggestionText}>{suggestion.response}</p>

      <div className={styles.cardActions}>
        <button
          className={styles.useBtn}
          onClick={() => onUse(suggestion.response)}
          aria-label="Use this suggestion"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Use this
        </button>
        <button
          className={styles.dismissBtn}
          onClick={() => onDismiss(suggestion.id)}
          aria-label="Dismiss suggestion"
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
 * Renders the AI Suggestions section in the conversation sidebar.
 * Shows up to 5 most recent AI-generated reply suggestions. Each card
 * has "Use this" (injects text into ReplyBox) and a dismiss button.
 */
export function AiSuggestionPanel({ suggestions, loading, onUse, onDismiss }: Props) {
  const visible = suggestions.slice(0, 5);

  return (
    <div className={styles.panel}>
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
          <div className={styles.shimmer} style={{ width: '60%' }} />
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <p>No suggestions yet</p>
          <span>AI will suggest replies based on incoming messages.</span>
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
