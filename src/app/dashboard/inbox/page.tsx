import React from 'react';
import styles from './inbox.module.css';

export default function InboxEmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <polyline points="22 7 12 14 2 7" />
        </svg>
      </div>
      <h3>Your Inbox</h3>
      <p>Select a conversation from the list to start messaging.</p>
    </div>
  );
}
