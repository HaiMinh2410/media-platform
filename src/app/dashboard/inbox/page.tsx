import React from 'react';
import styles from './inbox.module.css';

export default function InboxEmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon} style={{ background: 'var(--accent-gradient)', border: 'none', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <polyline points="22 7 12 14 2 7" />
        </svg>
      </div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Pulse Inbox</h3>
      <p style={{ opacity: 0.7, fontSize: '1rem' }}>Your synchronized message hub. Select a conversation to start engaging.</p>
      <div style={{ marginTop: '32px', display: 'flex', gap: '8px' }}>
        <div className="glass" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem' }}>Meta</div>
        <div className="glass" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem' }}>Instagram</div>
        <div className="glass" style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem' }}>TikTok</div>
      </div>
    </div>
  );
}
