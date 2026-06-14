'use client';

import { Icon } from "@shared/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { MessageWithSender } from '@features/inbox/types';
import { Loader2 } from 'lucide-react';
import { useInboxStore } from '../store/inbox.store';
import { createClient } from '@shared/api/supabase/client';

// Import sub-components and utils
import {
  MAX_TEXTAREA_HEIGHT,
  TIMEOUT_CLEAR_AI_STATUS_MS,
  TIMEOUT_CLEAR_TYPING_INDICATOR_MS,
  API_ENDPOINTS,
} from './reply-composer/reply-composer-utils';
import { ToneSelector } from './reply-composer/ToneSelector';
import { ReplyPreview } from './reply-composer/ReplyPreview';
import { VoiceRecorder } from './voice-recorder';

// Import newly refactored components & hooks
import { useFileAttachment } from './reply-composer/hooks/useFileAttachment';
import { useReplySubmit } from './reply-composer/hooks/useReplySubmit';
import { ComposerMainArea } from './reply-composer/components/ComposerMainArea';
import { ComposerActions } from './reply-composer/components/ComposerActions';

type SendState = 'idle' | 'sending' | 'error';

type ReplyComposerProps = {
  workspaceId: string;
  conversationId: string;
  fillText?: string;
  onMessageSent?: (message: MessageWithSender) => void;
  platform: string;
  platformUserName: string;
  onTypingStateChange?: (isTyping: boolean) => void;
  botConfig?: any;
};

export function ReplyComposer({
  workspaceId,
  conversationId,
  fillText,
  onMessageSent,
  platform,
  platformUserName,
  onTypingStateChange,
}: ReplyComposerProps) {
  const [text, setText] = useState('');
  const [aiStatusText, setAiStatusText] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const {
    selectedTone,
    setTone,
    replyAsId,
    setReplyAsId,
    replyOnChannel,
    setReplyOnChannel,
    replyToMessage,
    setReplyToMessage,
  } = useInboxStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCurrentlyTyping = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use Custom Hook for file attachments management
  const {
    files,
    isDragging,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
  } = useFileAttachment();

  // Use Custom Hook for submitting messages (ordinary or voice notes)
  const { handleSubmit, handleVoiceConfirm } = useReplySubmit({
    workspaceId,
    conversationId,
    replyOnChannel,
    selectedTone,
    replyToMessage,
    setReplyToMessage,
    text,
    setText,
    files,
    clearFiles,
    onMessageSent,
    onTypingStateChange,
    isCurrentlyTyping,
    typingTimeoutRef,
    textareaRef,
    setErrorMsg,
  });

  // Set up real-time broadcast listener for AI pipeline status updates
  useEffect(() => {
    if (!conversationId) {
      setAiStatusText('');
      setIsAiGenerating(false);
      return;
    }

    const supabase = createClient();
    const channelName = `ai_composer_status:${conversationId}:${Math.random().toString(36).substring(2, 11)}`;
    let clearTimer: NodeJS.Timeout;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'progress' }, (payload: any) => {
        console.log('[Composer Realtime Status] Received:', payload);
        const step = payload?.payload?.step;
        if (step) {
          setAiStatusText(step);

          // Show gradient border only during creation/generation steps
          if (step.includes('hoàn thành') || step.includes('lên lịch')) {
            setIsAiGenerating(false);
          } else {
            setIsAiGenerating(true);
          }

          // Clear status after timeout
          clearTimeout(clearTimer);
          clearTimer = setTimeout(() => {
            setAiStatusText('');
            setIsAiGenerating(false);
          }, TIMEOUT_CLEAR_AI_STATUS_MS);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(clearTimer);
    };
  }, [conversationId]);

  // Clean up typing timeouts on unmount or conversation change
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

  // Reset states when conversation changes
  useEffect(() => {
    setReplyToMessage(null);
    setText('');
    clearFiles();
    setSendState('idle');
    setErrorMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle fillText autofill
  useEffect(() => {
    if (!fillText) return;
    const pipeIdx = fillText.indexOf('|');
    const actualText = pipeIdx >= 0 ? fillText.substring(pipeIdx + 1) : fillText;
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
      }, TIMEOUT_CLEAR_TYPING_INDICATOR_MS);
    }
  };

  const handleSnippetClick = (snippetText: string) => {
    setText(snippetText);
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
      const res = await fetch(API_ENDPOINTS.REWRITE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          tone: selectedTone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setText(data.data);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(
              textareaRef.current.scrollHeight,
              MAX_TEXTAREA_HEIGHT
            )}px`;
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
    <div className="p-md p-4 pt-0">
      {errorMsg && (
        <div
          className="p-sm px-3 mb-2 bg-error/10 border border-error/20 rounded-md text-error text-sm"
          role="alert"
        >
          {errorMsg}
        </div>
      )}

      {/* AI Tone Selector & Rewrite Trigger */}
      <ToneSelector
        selectedTone={selectedTone}
        setTone={setTone}
        onRewrite={handleRewrite}
        isRewriting={isRewriting}
        text={text}
      />

      <div className="relative">
        {aiStatusText && (
          <div className="flex items-center gap-1.5 px-1 pb-2 text-2xs text-base-content/40 font-bold tracking-wide animate-pulse transition-all duration-300">
            <Loader2 size={11} className="animate-spin text-primary" />
            <span>{aiStatusText}</span>
          </div>
        )}

        {/* Original reply message quote preview banner */}
        <ReplyPreview
          replyToMessage={replyToMessage}
          onCancel={() => setReplyToMessage(null)}
        />

        {isRecording ? (
          <div className="pt-2">
            <VoiceRecorder
              onCancel={() => setIsRecording(false)}
              onConfirm={handleVoiceConfirm}
            />
          </div>
        ) : (
          <ComposerMainArea
            isAiGenerating={isAiGenerating}
            isRewriting={isRewriting}
            replyToMessage={replyToMessage}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            files={files}
            onRemoveFile={removeFile}
            textareaRef={textareaRef}
            isSending={isSending}
            text={text}
            onChange={handleChange}
            onSubmit={handleSubmit}
          >
            <ComposerActions
              onSnippetSelect={handleSnippetClick}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onRecordStart={() => setIsRecording(true)}
              isSending={isSending}
              text={text}
              filesCount={files.length}
              onSubmit={handleSubmit}
            />
          </ComposerMainArea>
        )}
      </div>
    </div>
  );
}
