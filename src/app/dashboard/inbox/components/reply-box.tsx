'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';

type SendState = 'idle' | 'sending' | 'error';

type ReplyBoxProps = {
  conversationId: string;
  /** When set, pre-fills the textarea with this text (for AI suggestion injection). */
  fillText?: string;
};

export function ReplyBox({ conversationId, fillText }: ReplyBoxProps) {
  const [text, setText] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync external fillText into the textarea (from AI suggestion).
  // fillText format: "<seq>|<actualText>" to allow re-injection of the same text.
  useEffect(() => {
    if (!fillText) return;
    const pipeIdx = fillText.indexOf('|');
    const actualText = pipeIdx >= 0 ? fillText.slice(pipeIdx + 1) : fillText;
    setText(actualText);
    setSendState('idle');
    setErrorMsg(null);
    // Resize textarea to fit the injected content
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
        el.focus();
      }
    });
  }, [fillText]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sendState === 'sending') return;

    setSendState('sending');
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (res.ok || res.status === 207) {
        // 201 Created or 207 Multi-Status (sent but DB persist partial failure)
        setText('');
        setSendState('idle');
        // Reset textarea height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || `Send failed (${res.status})`;
        setErrorMsg(msg);
        setSendState('error');
      }
    } catch {
      setErrorMsg('Network error — please try again.');
      setSendState('error');
    }
  };

  // Auto-resize textarea
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
    if (sendState === 'error') {
      setSendState('idle');
      setErrorMsg(null);
    }
  };

  const isSending = sendState === 'sending';

  return (
    <div className={styles.replyArea}>
      {errorMsg && (
        <div className={styles.replyError} role="alert">
          {errorMsg}
        </div>
      )}
      <form className={styles.replyForm} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.textArea}
            placeholder={isSending ? 'Sending…' : 'Type a message…'}
            rows={1}
            value={text}
            onChange={handleChange}
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        <button
          type="submit"
          className={`${styles.sendButton} ${isSending ? styles.sendButtonSending : ''}`}
          disabled={!text.trim() || isSending}
          aria-label="Send message"
        >
          {isSending ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
