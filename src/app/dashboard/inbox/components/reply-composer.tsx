'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './chat.module.css';
import { MessageWithSender } from '@/domain/types/messaging';

type SendState = 'idle' | 'sending' | 'error';

type ReplyComposerProps = {
  conversationId: string;
  fillText?: string;
  onMessageSent?: (message: MessageWithSender) => void;
  platform: string;
  platformUserName: string;
};

export function ReplyComposer({ 
  conversationId, 
  fillText, 
  onMessageSent,
  platform,
  platformUserName
}: ReplyComposerProps) {
  const [text, setText] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tone, setTone] = useState<string>('professional');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!fillText) return;
    const pipeIdx = fillText.indexOf('|');
    const actualText = pipeIdx >= 0 ? fillText.slice(pipeIdx + 1) : fillText;
    setText(actualText);
    setSendState('idle');
    setErrorMsg(null);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
        el.focus();
      }
    });
  }, [fillText]);

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
        const responseData = await res.json();
        setText('');
        setSendState('idle');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        if (onMessageSent && responseData.data) {
          onMessageSent({
            id: responseData.data.messageId,
            content: trimmed,
            senderId: 'agent',
            senderType: 'agent',
            createdAt: new Date(),
          });
        }
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
      
      <div className={styles.replyToolbar}>
        <div className={styles.replyAs}>
          <span className={styles.replyAsLabel}>Reply as:</span>
          <select className={styles.replyAsSelect} defaultValue={platformUserName}>
            <option value={platformUserName}>{platformUserName} ({platform})</option>
          </select>
        </div>
        
        <div className={styles.aiTones}>
          <button 
            className={`${styles.toneBtn} ${tone === 'professional' ? styles.toneActive : ''}`}
            onClick={() => setTone('professional')}
          >
            Professional
          </button>
          <button 
            className={`${styles.toneBtn} ${tone === 'friendly' ? styles.toneActive : ''}`}
            onClick={() => setTone('friendly')}
          >
            Friendly
          </button>
          <button 
            className={`${styles.toneBtn} ${tone === 'empathetic' ? styles.toneActive : ''}`}
            onClick={() => setTone('empathetic')}
          >
            Empathetic
          </button>
          <button className={styles.aiRewriteBtn}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Rewrite
          </button>
        </div>
      </div>

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
