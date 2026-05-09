'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageWithSender, MessageAttachment } from '@/domain/types/messaging';
import { Wand2, BookOpen, Paperclip, Mic, X, Reply } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { useInboxStore, ToneMode } from '../store/inbox.store';
import { cn } from '@/lib/utils';
import { AttachmentPreview, FileAttachment } from './attachment-preview';
import { VoiceRecorder } from './voice-recorder';
import { SendButton } from './send-button';
import { motion, AnimatePresence } from 'framer-motion';

type SendState = 'idle' | 'sending' | 'error';

type ReplyComposerProps = {
  workspaceId: string;
  conversationId: string;
  fillText?: string;
  onMessageSent?: (message: MessageWithSender) => void;
  platform: string;
  platformUserName: string;
  onTypingStateChange?: (isTyping: boolean) => void;
};

// Mock data for snippets
const SNIPPETS = [
  { id: '1', title: 'Welcome', text: 'Chào mừng bạn đến với Media Platform! Rất vui được hỗ trợ bạn.' },
  { id: '2', title: 'Pricing', text: 'Hiện tại chúng tôi có các gói: Basic (9$), Pro (29$) và Enterprise.' },
  { id: '3', title: 'Bye', text: 'Cảm ơn bạn. Chúc bạn một ngày tốt lành!' },
];

const MAX_TEXTAREA_HEIGHT = 320;

const getReplyMessagePreview = (message: MessageWithSender) => {
  if (message.content) return message.content;
  if (!message.attachments || message.attachments.length === 0) return '[Tệp đính kèm]';
  
  const first = message.attachments[0];
  switch (first.type) {
    case 'image':
      return '[Hình ảnh]';
    case 'video':
      return '[Video]';
    case 'audio':
      return '[Tin nhắn thoại]';
    case 'file':
      return '[Tài liệu]';
    default:
      return '[Tệp đính kèm]';
  }
};

export function ReplyComposer({ 
  workspaceId,
  conversationId, 
  fillText, 
  onMessageSent,
  platform,
  platformUserName,
  onTypingStateChange
}: ReplyComposerProps) {
  const [text, setText] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    selectedTone, 
    setTone, 
    replyAsId, 
    setReplyAsId, 
    replyOnChannel, 
    setReplyOnChannel,
    replyToMessage,
    setReplyToMessage
  } = useInboxStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const snippetsRef = useRef<HTMLDivElement>(null);

  const isCurrentlyTyping = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isCurrentlyTyping.current && onTypingStateChange) {
        onTypingStateChange(false);
      }
      isCurrentlyTyping.current = false;
    };
  }, [conversationId, onTypingStateChange]);

  // Reset replyToMessage, draft text, and uploaded files when conversation changes
  useEffect(() => {
    setReplyToMessage(null);
    setText('');
    setFiles([]);
    setSendState('idle');
    setErrorMsg(null);
  }, [conversationId, setReplyToMessage]);

  useEffect(() => {
    if (!replyAsId) setReplyAsId(platformUserName);
    if (!replyOnChannel) setReplyOnChannel(platform);
  }, [platform, platformUserName, replyAsId, replyOnChannel, setReplyAsId, setReplyOnChannel]);

  useEffect(() => {
    if (replyToMessage) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [replyToMessage]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    setErrorMsg(null);

    // Capture reactive reply states
    const parentId = replyToMessage?.id;
    const parentMsg = replyToMessage;
    const currentFiles = [...files];

    // Generate unique temporary message ID for Optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Map files to temporary attachments layout with local object URLs for immediate previewing
    const messageAttachments: MessageAttachment[] = currentFiles.map(f => ({
      type: f.type,
      payload: {
        url: f.previewUrl || '',
        title: f.file.name,
        fileSize: f.file.size
      }
    }));

    // Trigger optimistic update in ChatWindow instantly
    if (onMessageSent) {
      onMessageSent({
        id: tempId,
        content: trimmed,
        senderId: 'agent',
        senderType: 'agent',
        createdAt: new Date(),
        is_delivered: false,
        is_read: false,
        parentMessageId: parentId || null,
        parentMessage: parentMsg || undefined,
        attachments: messageAttachments,
        isSending: true
      } as any);
    }

    // Immediately clear input fields and state to allow typing next message right away
    setText('');
    setFiles([]);
    setReplyToMessage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Clear typing indicator status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isCurrentlyTyping.current && onTypingStateChange) {
      isCurrentlyTyping.current = false;
      onTypingStateChange(false);
    }

    // Perform file uploading and API message reply in the background
    (async () => {
      try {
        const uploadedAttachments: MessageAttachment[] = [];

        // 1. Upload files to our local Server API if any exist
        for (const f of currentFiles) {
          const formData = new FormData();
          formData.append('file', f.file);
          if (workspaceId) {
            formData.append('workspaceId', workspaceId);
          }

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const uploadErrData = await uploadRes.json().catch(() => ({}));
            const errMsg = uploadErrData.error || `Upload failed (${uploadRes.status})`;
            throw new Error(`Failed to upload file ${f.file.name}: ${errMsg}`);
          }

          const uploadData = await uploadRes.json();

          uploadedAttachments.push({
            type: f.type,
            payload: {
              url: uploadData.publicUrl,
              title: f.file.name,
              fileSize: f.file.size
            }
          });
        }

        // 2. Submit the message reply with uploaded public URLs
        const res = await fetch(`/api/conversations/${conversationId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: trimmed,
            platform: replyOnChannel,
            tone: selectedTone,
            parentMessageId: parentId,
            attachments: uploadedAttachments
          }),
        });

        if (res.ok || res.status === 207) {
          const responseData = await res.json();
          if (onMessageSent && responseData.data) {
            onMessageSent({
              id: responseData.data.messageId,
              content: trimmed,
              senderId: 'agent',
              senderType: 'agent',
              createdAt: new Date(),
              is_delivered: true,
              is_read: false,
              parentMessageId: parentId || null,
              parentMessage: parentMsg || undefined,
              attachments: uploadedAttachments,
              tempId: tempId // Send tempId to let ChatWindow replace the temporary message
            } as any);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.error || `Send failed (${res.status})`;
          throw new Error(msg);
        }
      } catch (err: any) {
        console.error('[ReplyComposer] Error submitting reply in background:', err);
        setErrorMsg(err.message || 'Network error — failed to deliver message.');
      }
    })();
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

    // Monitor agent keystrokes for typing indicator
    if (onTypingStateChange) {
      if (!isCurrentlyTyping.current) {
        isCurrentlyTyping.current = true;
        onTypingStateChange(true);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isCurrentlyTyping.current = false;
        onTypingStateChange(false);
      }, 3500); // 3.5 seconds of inactivity clears typing
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => {
        let type: FileAttachment['type'] = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type,
          previewUrl: URL.createObjectURL(file)
        };
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => {
        let type: FileAttachment['type'] = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type,
          previewUrl: URL.createObjectURL(file)
        };
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleVoiceConfirm = async (blob: Blob) => {
    setIsRecording(false);
    setErrorMsg(null);

    // Capture reactive states
    const parentId = replyToMessage?.id;
    const parentMsg = replyToMessage;
    const file = new File([blob], "voice-message.m4a", { type: "audio/x-m4a" });

    // Generate unique temporary message ID for voice optimistic UI
    const tempId = `temp-${Date.now()}-voice`;

    // Map audio attachment using local object URL for immediate playback capability
    const voiceUrl = URL.createObjectURL(blob);
    const messageAttachments: MessageAttachment[] = [{
      type: 'audio',
      payload: {
        url: voiceUrl,
        title: 'voice-message.m4a',
        fileSize: file.size
      }
    }];

    // Trigger optimistic update in ChatWindow instantly
    if (onMessageSent) {
      onMessageSent({
        id: tempId,
        content: '',
        senderId: 'agent',
        senderType: 'agent',
        createdAt: new Date(),
        is_delivered: false,
        is_read: false,
        parentMessageId: parentId || null,
        parentMessage: parentMsg || undefined,
        attachments: messageAttachments,
        isSending: true
      } as any);
    }

    // Immediately clear reply to message
    setReplyToMessage(null);

    // Clear typing status
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isCurrentlyTyping.current && onTypingStateChange) {
      isCurrentlyTyping.current = false;
      onTypingStateChange(false);
    }

    // Run upload and reply in the background
    (async () => {
      try {
        // 1. Upload file immediately via backend local proxy API
        const formData = new FormData();
        formData.append('file', file);
        if (workspaceId) {
          formData.append('workspaceId', workspaceId);
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadErrData = await uploadRes.json().catch(() => ({}));
          const errMsg = uploadErrData.error || `Upload failed (${uploadRes.status})`;
          throw new Error(`Failed to upload voice message: ${errMsg}`);
        }

        const uploadData = await uploadRes.json();
        const uploadedAttachments: MessageAttachment[] = [{
          type: 'audio',
          payload: {
            url: uploadData.publicUrl,
            title: 'voice-message.m4a',
            fileSize: file.size
          }
        }];

        // 2. Submit reply directly
        const res = await fetch(`/api/conversations/${conversationId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: '',
            platform: replyOnChannel,
            tone: selectedTone,
            parentMessageId: parentId,
            attachments: uploadedAttachments
          }),
        });

        if (res.ok || res.status === 207) {
          const responseData = await res.json();
          if (onMessageSent && responseData.data) {
            onMessageSent({
              id: responseData.data.messageId,
              content: '',
              senderId: 'agent',
              senderType: 'agent',
              createdAt: new Date(),
              is_delivered: true,
              is_read: false,
              parentMessageId: parentId || null,
              parentMessage: parentMsg || undefined,
              attachments: uploadedAttachments,
              tempId: tempId // Send tempId to replace temporary message with real database message
            } as any);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.error || `Send failed (${res.status})`;
          throw new Error(msg);
        }
      } catch (err: any) {
        console.error('[ReplyComposer] Error sending voice message in background:', err);
        setErrorMsg(err.message || 'Failed to send voice message.');
      }
    })();
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
    <div className="p-md px-4 pt-0">
      {errorMsg && (
        <div className="p-sm px-3 mb-2 bg-status-error/10 border border-status-error/30 rounded-sm text-status-error text-sm" role="alert">
          {errorMsg}
        </div>
      )}
      
      <div className="flex items-center justify-end gap-3 mb-2 px-1">
        <div className="flex items-center gap-1">
          {(['professional', 'sales', 'warm', 'flirty'] as ToneMode[]).map((t) => (
            <button 
              key={t}
              type="button"
              className={cn(
                "bg-transparent border-none text-foreground-tertiary text-xs px-2 py-1 rounded-sm cursor-pointer transition-all hover:text-foreground-secondary hover:bg-foreground/5",
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
        <AnimatePresence initial={false}>
          {replyToMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: 15 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between border-l-2 border-primary px-3 py-2 mb-0 text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary min-w-0">
                  <Reply size={14} className="shrink-0 text-indigo-500" />
                  <div className="truncate">
                    <span className="font-bold text-primary mr-1">Đang trả lời:</span>
                    {getReplyMessagePreview(replyToMessage)}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setReplyToMessage(null)}
                  className="text-foreground-tertiary hover:text-foreground transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isRecording ? (
          <div className="pt-2">
            <VoiceRecorder 
              onCancel={() => setIsRecording(false)} 
              onConfirm={handleVoiceConfirm} 
            />
          </div>
        ) : (
          <div 
            className={cn(
              "flex gap-3 items-end p-3 px-md transition-all rounded-lg bg-background-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] relative outline-none",
              replyToMessage && "rounded-tl-none"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 bg-indigo-500/10 backdrop-blur-[1px] flex items-center justify-center rounded-lg border-2 border-dashed border-indigo-500 text-indigo-500 font-medium">
                Thả tệp vào đây để đính kèm
              </div>
            )}
            
            <div className="flex-1 flex flex-col min-w-0">
              {files.length > 0 && (
                <AttachmentPreview attachments={files} onRemove={removeFile} />
              )}

              <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none text-foreground text-base resize-none outline-none max-h-[160px] min-h-[24px] overflow-y-auto placeholder:text-foreground-tertiary caret-primary"
                placeholder={isSending ? 'Sending…' : 'Type a message…'}
                rows={1}
                value={text}
                onChange={handleChange}
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              
              <div className="flex justify-between items-center pt-3 border-t border-foreground/5 mt-2">
                <div className="flex items-center gap-2">
                  <div className="relative" ref={snippetsRef}>
                    <button 
                      type="button" 
                      className="bg-transparent border-none text-foreground-tertiary size-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-foreground/5 text-primary"
                      onClick={() => setShowSnippets(!showSnippets)}
                      title="Saved Snippets"
                    >
                      <BookOpen size={18} />
                    </button>
                    
                    {showSnippets && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-base-200 border border-foreground/10 rounded-md shadow-2xl z-[100] py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-3 py-2 text-xs font-bold text-foreground-tertiary uppercase tracking-wider border-b border-foreground/5">Saved Snippets</div>
                        <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10">
                          {SNIPPETS.map(s => (
                            <button 
                              key={s.id} 
                              type="button" 
                              className="w-full px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-foreground/5 transition-colors"
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
                  
                  <button 
                    type="button" 
                    className="bg-transparent border-none text-foreground-tertiary size-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-foreground/5 text-primary" 
                    title="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={18} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={handleFileChange} 
                  />

                  <button 
                    type="button" 
                    className="bg-transparent border-none text-foreground-tertiary size-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-foreground/5 text-primary" 
                    title="Record voice note"
                    onClick={() => setIsRecording(true)}
                  >
                    <Mic size={18} />
                  </button>
                </div>

                <SendButton
                  type="submit"
                  className={cn(
                    "w-8 h-8 rounded-md bg-accent-gradient border-none text-foreground hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                    isSending && "opacity-70"
                  )}
                  disabled={(!text.trim() && files.length === 0)}
                  isSending={isSending}
                  aria-label="Send message"
                  onClick={() => handleSubmit()}
                  size={16}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {text.length > 0 && text.length < 5 && (
        <div className="mt-2 p-2 bg-accent-secondary/5 rounded-md border border-accent-secondary/10 animate-pulse">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent-secondary uppercase tracking-wide mb-1">
            <Icon name="ai-sparkles" size={14} />
            AI Suggestion
          </div>
          <p className="text-xs text-foreground-tertiary">Continue typing to see AI-powered drafts...</p>
        </div>
      )}
    </div>
  );
}
