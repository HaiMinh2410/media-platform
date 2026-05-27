'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { MessageWithSender } from '@features/inbox/types';
import { MessageBubble } from './message-bubble';
import { ChatSkeleton } from './skeletons';
import { formatChatSeparator } from '@shared/lib/utils';
import { useInboxStore } from '../store/inbox.store';
import { TypingUser } from '../hooks/use-presence-typing';

// Import existing sub-components
import { PinnedMessageBanner } from './chat-window/PinnedMessageBanner';
import { LightboxOverlay } from './chat-window/LightboxOverlay';
import { PinnedMessagesModal } from './chat-window/PinnedMessagesModal';

// Import newly refactored custom hooks and sub-components
import { usePinnedMessages } from './chat-window/hooks/usePinnedMessages';
import { useChatMessages } from './chat-window/hooks/useChatMessages';
import { TypingIndicatorList } from './chat-window/components/TypingIndicatorList';
import { SystemMessage } from './chat-window/components/SystemMessage';

export type ChatWindowRef = {
  addMessage: (message: MessageWithSender) => void;
  scrollToMessage: (messageId: string) => void;
};

export const ChatWindow = forwardRef<ChatWindowRef, {
  conversationId: string;
  typingUsers?: TypingUser[];
  customerAvatar?: string;
  customerName?: string;
}>(
  ({ conversationId, typingUsers = [], customerAvatar, customerName }, ref) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      const handle = requestAnimationFrame(() => {
        setIsMounted(true);
      });
      return () => cancelAnimationFrame(handle);
    }, []);

    const lightboxImage = useInboxStore(state => state.lightboxImage);
    const setLightboxImage = useInboxStore(state => state.setLightboxImage);

    // Escape listener for Lightbox
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setLightboxImage(null);
        }
      };
      if (lightboxImage) {
        window.addEventListener('keydown', handleKeyDown);
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [lightboxImage, setLightboxImage]);

    // 1. Manage pinned messages state and logic
    const {
      pinnedMessages,
      isPinnedModalOpen,
      setIsPinnedModalOpen,
      fetchPinnedMessages,
      handleUnpin,
    } = usePinnedMessages({ conversationId });

    // 2. Manage all messages state, loading, pagination, scrolling, realtime, etc.
    const {
      messages,
      loading,
      nextCursor,
      scrollRef,
      observerTarget,
      handleNewMessage,
      scrollToMessage,
    } = useChatMessages({
      conversationId,
      typingUsersCount: typingUsers.length,
      fetchPinnedMessages,
    });

    // Expose ref functions to parent (Inbox dashboard / RightSidePanel)
    useImperativeHandle(ref, () => ({
      addMessage: (message: MessageWithSender) => {
        handleNewMessage(message);
      },
      scrollToMessage: (messageId: string) => {
        scrollToMessage(messageId);
      },
    }), [handleNewMessage, scrollToMessage]);

    // Identify latest outgoing and read outgoing messages for read receipts
    const outgoingMessages = messages.filter(m => m.senderType === 'ai' || m.senderType === 'agent');
    const latestOutgoingMessageId = outgoingMessages.length > 0
      ? outgoingMessages[outgoingMessages.length - 1].id
      : null;
    const readOutgoingMessages = outgoingMessages.filter(m => m.is_read);
    const latestReadOutgoingMessageId = readOutgoingMessages.length > 0
      ? readOutgoingMessages[readOutgoingMessages.length - 1].id
      : null;

    return (
      <div className="flex-1 flex flex-col overflow-y-auto relative">
        {/* Glassmorphic Sticky Pinned Message Banner */}
        {pinnedMessages.length > 0 && (
          <PinnedMessageBanner
            pinnedMessages={pinnedMessages}
            customerName={customerName}
            onJumpToMessage={scrollToMessage}
            onUnpin={handleUnpin}
          />
        )}

        {/* Main scrolling chat window */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-md px-4 flex flex-col bg-transparent scrollbar-thin scrollbar-thumb-base-content/10 scrollbar-track-transparent"
          ref={scrollRef}
        >
          <div ref={observerTarget} style={{ height: '1px', opacity: 0 }} />

          {loading && nextCursor && (
            <div className="p-4 text-center text-base-content/40 text-sm">Loading older messages...</div>
          )}

          {loading && messages.length === 0 && <ChatSkeleton />}

          {messages.map((msg, index) => {
            if (msg.senderId === 'system') {
              return (
                <SystemMessage
                  key={msg.id}
                  content={msg.content}
                  onViewAllPinned={() => setIsPinnedModalOpen(true)}
                />
              );
            }

            const prevMsg = index > 0 ? messages[index - 1] : null;
            const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

            let showSeparator = false;
            if (!prevMsg) {
              showSeparator = true;
            } else {
              const currDate = new Date(msg.createdAt);
              const prevDate = new Date(prevMsg.createdAt);
              const isSameDay = currDate.toDateString() === prevDate.toDateString();
              const diffMins = (currDate.getTime() - prevDate.getTime()) / (1000 * 60);

              if (!isSameDay || diffMins > 10) {
                showSeparator = true;
              }
            }

            let showNextSeparator = false;
            if (nextMsg) {
              const currDate = new Date(msg.createdAt);
              const nextDate = new Date(nextMsg.createdAt);
              const isNextSameDay = currDate.toDateString() === nextDate.toDateString();
              const diffNextMins = (nextDate.getTime() - currDate.getTime()) / (1000 * 60);

              if (!isNextSameDay || diffNextMins > 10) {
                showNextSeparator = true;
              }
            } else {
              showNextSeparator = true;
            }

            const isLastMessage = index === messages.length - 1;
            const isOutgoing = msg.senderType === 'ai' || msg.senderType === 'agent';
            const showStatus = isLastMessage && isOutgoing;

            const isPrevMsgOutgoing = prevMsg ? (prevMsg.senderType === 'ai' || prevMsg.senderType === 'agent') : false;
            const isPrevConsecutive = !!(prevMsg && !showSeparator && (
              (isOutgoing && isPrevMsgOutgoing) ||
              (!isOutgoing && !isPrevMsgOutgoing)
            ));

            const isNextMsgOutgoing = nextMsg ? (nextMsg.senderType === 'ai' || nextMsg.senderType === 'agent') : false;
            const isNextConsecutive = !!(nextMsg && !showNextSeparator && (
              (isOutgoing && isNextMsgOutgoing) ||
              (!isOutgoing && !isNextMsgOutgoing)
            ));

            return (
              <React.Fragment key={msg.id}>
                {showSeparator && (
                  <div className="flex justify-center items-center my-6 relative">
                    <span className="px-4 py-1 rounded-full text-xs font-semibold text-base-content/80 relative z-10">
                      {formatChatSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  showStatus={showStatus}
                  conversationId={conversationId}
                  isNextConsecutive={isNextConsecutive}
                  isPrevConsecutive={isPrevConsecutive}
                  customerAvatar={customerAvatar}
                  customerName={customerName}
                  showSeparator={showSeparator}
                  isLatestOutgoing={msg.id === latestOutgoingMessageId}
                  isLatestReadOutgoing={msg.id === latestReadOutgoingMessageId}
                />
              </React.Fragment>
            );
          })}

          {/* Typing Indicators list */}
          <TypingIndicatorList typingUsers={typingUsers} />

          {!loading && messages.length === 0 && (
            <div className="p-4 text-center text-base-content/40 text-sm">
              No messages found for this conversation.
            </div>
          )}
        </div>

        {/* Premium Lightbox Overlay and Pinned Messages Modal Portals */}
        {isMounted && (
          <>
            <LightboxOverlay
              imageUrl={lightboxImage}
              onClose={() => setLightboxImage(null)}
            />

            <PinnedMessagesModal
              isOpen={isPinnedModalOpen}
              onClose={() => setIsPinnedModalOpen(false)}
              pinnedMessages={pinnedMessages}
              customerName={customerName}
              customerAvatar={customerAvatar}
              onJumpToMessage={scrollToMessage}
              onUnpin={handleUnpin}
            />
          </>
        )}
      </div>
    );
  }
);

ChatWindow.displayName = 'ChatWindow';
