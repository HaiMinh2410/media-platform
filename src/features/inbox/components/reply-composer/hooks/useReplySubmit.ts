import { useCallback } from 'react';
import { MessageWithSender, MessageAttachment } from '@features/inbox/types';
import { FileAttachment } from '../../attachment-preview';
import { API_ENDPOINTS } from '../reply-composer-utils';

type UseReplySubmitProps = {
  workspaceId: string;
  conversationId: string;
  replyOnChannel: string | null;
  selectedTone: string;
  replyToMessage: MessageWithSender | null;
  setReplyToMessage: (msg: MessageWithSender | null) => void;
  text: string;
  setText: (text: string) => void;
  files: FileAttachment[];
  clearFiles: () => void;
  onMessageSent?: (message: MessageWithSender) => void;
  onTypingStateChange?: (isTyping: boolean) => void;
  isCurrentlyTyping: React.MutableRefObject<boolean>;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setErrorMsg: (msg: string | null) => void;
};

export function useReplySubmit({
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
}: UseReplySubmitProps) {

  const clearTypingStatus = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isCurrentlyTyping.current && onTypingStateChange) {
      isCurrentlyTyping.current = false;
      onTypingStateChange(false);
    }
  }, [onTypingStateChange, isCurrentlyTyping, typingTimeoutRef]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    setErrorMsg(null);

    // Capture reactive states for async task closure
    const parentId = replyToMessage?.id;
    const parentMsg = replyToMessage;
    const currentFiles = [...files];

    // Generate unique temporary message ID for Optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

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
      } as unknown as MessageWithSender);
    }

    // Immediately clear inputs
    setText('');
    clearFiles();
    setReplyToMessage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    clearTypingStatus();

    // Perform file uploading and API message reply in the background
    (async () => {
      try {
        const uploadedAttachments: MessageAttachment[] = [];

        // 1. Upload files
        for (const f of currentFiles) {
          const formData = new FormData();
          formData.append('file', f.file);
          if (workspaceId) {
            formData.append('workspaceId', workspaceId);
          }

          const uploadRes = await fetch(API_ENDPOINTS.UPLOAD, {
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

        // 2. Submit reply
        const res = await fetch(API_ENDPOINTS.REPLY(conversationId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: trimmed,
            platform: replyOnChannel || '',
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
            } as unknown as MessageWithSender);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.error || `Send failed (${res.status})`;
          throw new Error(msg);
        }
      } catch (err) {
        const error = err as Error;
        console.error('[ReplyComposer] Error submitting reply in background:', error);
        setErrorMsg(error.message || 'Network error — failed to deliver message.');
      }
    })();
  }, [
    text,
    files,
    replyToMessage,
    workspaceId,
    conversationId,
    replyOnChannel,
    selectedTone,
    onMessageSent,
    setText,
    clearFiles,
    setReplyToMessage,
    textareaRef,
    clearTypingStatus,
    setErrorMsg,
  ]);

  const handleVoiceConfirm = useCallback(async (blob: Blob) => {
    setErrorMsg(null);

    const parentId = replyToMessage?.id;
    const parentMsg = replyToMessage;
    const file = new File([blob], 'voice-message.m4a', { type: 'audio/x-m4a' });

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
      } as unknown as MessageWithSender);
    }

    // Immediately clear reply state
    setReplyToMessage(null);
    clearTypingStatus();

    // Run upload and reply in background
    (async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (workspaceId) {
          formData.append('workspaceId', workspaceId);
        }

        const uploadRes = await fetch(API_ENDPOINTS.UPLOAD, {
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

        // Submit reply directly
        const res = await fetch(API_ENDPOINTS.REPLY(conversationId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '',
            platform: replyOnChannel || '',
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
              tempId: tempId
            } as unknown as MessageWithSender);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.error || `Send failed (${res.status})`;
          throw new Error(msg);
        }
      } catch (err) {
        const error = err as Error;
        console.error('[ReplyComposer] Error sending voice message in background:', error);
        setErrorMsg(error.message || 'Failed to send voice message.');
      }
    })();
  }, [
    replyToMessage,
    workspaceId,
    conversationId,
    replyOnChannel,
    selectedTone,
    onMessageSent,
    setReplyToMessage,
    clearTypingStatus,
    setErrorMsg,
  ]);

  return {
    handleSubmit,
    handleVoiceConfirm,
  };
}
