'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageWithSender } from '@/domain/types/messaging';
import { Wand2, BookOpen, Paperclip, Send } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { useInboxStore, ToneMode } from '../store/inbox.store';
import { cn } from '@/lib/utils';

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

const MAX_TEXTAREA_HEIGHT = 320;

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
  const [isRewriting, setIsRewriting] = useState(false);

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
        el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
        el.focus();
      }
    });
  }, [fillText]);

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
            is_delivered: true,
            is_read: false,
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
      el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
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
  
  const handleRewrite = async () => {
    const trimmed = text.trim();
    if (!trimmed || isRewriting) return;

    setIsRewriting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: trimmed,
          tone: selectedTone
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setText(data.data);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
          }
        });
      } else {
        setErrorMsg(data.error || 'Failed to rewrite text.');
      }
    } catch {
      setErrorMsg('Network error while rewriting.');
    } finally {
      setIsRewriting(false);
    }
  };

  const isSending = sendState === 'sending';

  return (
    <div className="p-md px-lg border-t border-white/10 bg-background-tertiary/40">
      {errorMsg && (
        <div className="p-sm px-3 mb-2 bg-status-error/10 border border-status-error/30 rounded-sm text-status-error text-[0.8125rem]" role="alert">
          {errorMsg}
        </div>
      )}
      
      <div className="flex items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-1">
          {(['professional', 'sales', 'warm', 'flirty'] as ToneMode[]).map((t) => (
            <button 
              key={t}
              type="button"
              className={cn(
                "bg-transparent border-none text-foreground-tertiary text-xs px-2 py-1 rounded-sm cursor-pointer transition-all hover:text-foreground-secondary hover:bg-white/5",
                selectedTone === t && "text-accent-primary bg-accent-primary/10"
              )}
              onClick={() => setTone(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button 
          type="button"
          className={cn(
            "flex items-center gap-1.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-200 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all shadow-[0_2px_8px_rgba(168,85,247,0.1)] hover:from-purple-500/30 hover:to-indigo-500/30 hover:shadow-[0_4px_12px_rgba(168,85,247,0.2)] hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
            isRewriting && "opacity-80 cursor-wait"
          )}
          onClick={handleRewrite}
          disabled={isRewriting || !text.trim()}
        >
          <Wand2 size={14} className={cn(isRewriting && "animate-spin")} />
          {isRewriting ? 'Rewriting...' : 'AI Rewrite'}
        </button>
      </div>
      
      <div className="relative">
        <form className="flex gap-3 items-end" onSubmit={handleSubmit}>
          <div className="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 px-md transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] focus-within:border-accent-primary/50 focus-within:bg-black/40 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1),inset_0_2px_4px_rgba(0,0,0,0.2)]">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-none text-foreground text-[15px] resize-none outline-none max-h-[160px] min-h-[24px] overflow-y-auto"
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
            
            <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2">
              <div className="flex items-center gap-2">
                <div className="relative" ref={snippetsRef}>
                  <button 
                    type="button" 
                    className="bg-transparent border-none text-foreground-tertiary w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-all hover:text-foreground hover:bg-white/5"
                    onClick={() => setShowSnippets(!showSnippets)}
                    title="Saved Snippets"
                  >
                    <BookOpen size={18} />
                  </button>
                  
                  {showSnippets && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-background-base border border-white/10 rounded-md shadow-2xl z-[100] py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="px-3 py-2 text-[0.7rem] font-bold text-foreground-tertiary uppercase tracking-wider border-b border-white/5">Saved Snippets</div>
                      <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        {SNIPPETS.map(s => (
                          <button 
                            key={s.id} 
                            type="button" 
                            className="w-full px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-white/5 transition-colors"
                            onClick={() => handleSnippetClick(s.text)}
                          >
                            <span className="text-sm font-semibold text-foreground">{s.title}</span>
                            <span className="text-xs text-foreground-tertiary truncate">{s.text.substring(0, 30)}...</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button type="button" className="bg-transparent border-none text-foreground-tertiary w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-all hover:text-foreground hover:bg-white/5" title="Attach file">
                  <Paperclip size={18} />
                </button>
              </div>

              <button
                type="submit"
                className={cn(
                  "w-8 h-8 rounded-md bg-accent-gradient border-none text-white flex items-center justify-center cursor-pointer transition-all shrink-0 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-accent-primary/20",
                  isSending && "opacity-70"
                )}
                disabled={!text.trim() || isSending}
                aria-label="Send message"
              >
                {isSending ? (
                  <div className="animate-spin">
                    <Send size={16} className="opacity-50" />
                  </div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {text.length > 0 && text.length < 5 && (
        <div className="mt-2 p-2 bg-accent-secondary/5 rounded-md border border-accent-secondary/10 animate-pulse">
          <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-accent-secondary uppercase tracking-wide mb-1">
            <Icon name="ai-sparkles" size={14} />
            AI Suggestion
          </div>
          <p className="text-xs text-foreground-tertiary">Continue typing to see AI-powered drafts...</p>
        </div>
      )}
    </div>
  );
}
