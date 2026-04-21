'use client';

import React, { useState } from 'react';
import styles from './chat.module.css';

export function ReplyBox({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    // In static UI phase, we just clear the input
    console.log(`Sending message to ${conversationId}: ${text}`);
    setText('');
  };

  return (
    <div className={styles.replyArea}>
      <form className={styles.replyForm} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.textArea}
            placeholder="Type a message..."
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <button type="submit" className={styles.sendButton} disabled={!text.trim()}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
