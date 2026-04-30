'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './chat.module.css';
import { MessageWithSender } from '@/domain/types/messaging';
import { useInboxStore, ToneMode } from '../store/inbox.store';

type SendState = 'idle' | 'sending' | 'error';

type ReplyComposerProps = {
  conversationId: string;
  fillText?: string;
  onMessageSent?: (message: MessageWithSender) => void;
  platform: string;
  platformUserName: string;
};

// Mock data for snippets
const SNIPPETS = [
  { id: '1', title: 'Welcome', text: 'Chào mừng bạn đến với Media Platform! Rất vui được hỗ trợ bạn.' },
  { id: '2', title: 'Pricing', text: 'Hiện tại chúng tôi có các gói: Basic (9$), Pro (29$) và Enterprise.' },
  { id: '3', title: 'Bye', text: 'Cảm ơn bạn. Chúc bạn một ngày tốt lành!' },
];

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
  const [showSnippets, setShowSnippets] = useState(false);

  const { 
    selectedTone, 
    setTone, 
    replyAsId, 
    setReplyAsId, 
    replyOnChannel, 
    setReplyOnChannel 
  } = useInboxStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const snippetsRef = useRef<HTMLDivElement>(null);

  // Initial state setup
  useEffect(() => {
    if (!replyAsId) setReplyAsId(platformUserName);
    if (!replyOnChannel) setReplyOnChannel(platform);
  }, [platform, platformUserName, replyAsId, replyOnChannel, setReplyAsId, setReplyOnChannel]);

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

  // Close snippets on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (snippetsRef.current && !snippetsRef.current.contains(event.target as Node)) {
        setShowSnippets(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        body: JSON.stringify({ 
          text: trimmed,
          platform: replyOnChannel,
          tone: selectedTone
        }),
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

  const handleSnippetClick = (snippetText: string) => {
    setText(snippetText);
    setShowSnippets(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
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
        <div className={styles.composerSelectors}>
          <div className={styles.selectorItem}>
            <span className={styles.selectorLabel}>Reply as:</span>
            <select 
              className={styles.composerSelect} 
              value={replyAsId || ''} 
              onChange={(e) => setReplyAsId(e.target.value)}
            >
              <option value={platformUserName}>{platformUserName}</option>
              <option value="system">AI Assistant</option>
            </select>
          </div>
          
          <div className={styles.selectorItem}>
            <span className={styles.selectorLabel}>Reply on:</span>
            <select 
              className={styles.composerSelect} 
              value={replyOnChannel || ''}
              onChange={(e) => setReplyOnChannel(e.target.value)}
            >
              <option value={platform}>{platform.toUpperCase()}</option>
              <option value="internal">Internal Note</option>
            </select>
          </div>
        </div>
        
        <div className={styles.aiTones}>
          {(['professional', 'sales', 'warm', 'flirty'] as ToneMode[]).map((t) => (
            <button 
              key={t}
              className={`${styles.toneBtn} ${selectedTone === t ? styles.toneActive : ''}`}
              onClick={() => setTone(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button className={styles.aiRewriteBtn}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Rewrite
          </button>
        </div>
      </div>

      <div className={styles.replyFormContainer}>
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
            
            <div className={styles.composerActions}>
              <div className={styles.snippetContainer} ref={snippetsRef}>
                <button 
                  type="button" 
                  className={styles.actionIconButton}
                  onClick={() => setShowSnippets(!showSnippets)}
                  title="Saved Snippets"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                </button>
                
                {showSnippets && (
                  <div className={styles.snippetsPopover}>
                    <div className={styles.popoverHeader}>Saved Snippets</div>
                    <div className={styles.popoverList}>
                      {SNIPPETS.map(s => (
                        <button 
                          key={s.id} 
                          type="button" 
                          className={styles.popoverItem}
                          onClick={() => handleSnippetClick(s.text)}
                        >
                          <span className={styles.snippetTitle}>{s.title}</span>
                          <span className={styles.snippetPreview}>{s.text.substring(0, 30)}...</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button type="button" className={styles.actionIconButton} title="Attach file">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
            </div>
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
      
      {/* AI Draft Suggestion Area */}
      {text.length > 0 && text.length < 5 && (
        <div className={styles.aiDraftArea}>
          <div className={styles.aiDraftLabel}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            AI Suggestion
          </div>
          <p className={styles.aiDraftText}>Continue typing to see AI-powered drafts...</p>
        </div>
      )}
    </div>
  );
}
