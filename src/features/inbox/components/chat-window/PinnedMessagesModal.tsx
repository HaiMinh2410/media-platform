'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pin, Paperclip, MoreHorizontal } from 'lucide-react';
import { MessageWithSender } from '@features/inbox/types';
import { getInitials, formatBubbleTime } from './chat-window-utils';

type PinnedMessagesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pinnedMessages: MessageWithSender[];
  customerName?: string;
  customerAvatar?: string;
  onJumpToMessage: (id: string) => void;
  onUnpin: (id: string) => void;
};

export function PinnedMessagesModal({
  isOpen,
  onClose,
  pinnedMessages,
  customerName,
  customerAvatar,
  onJumpToMessage,
  onUnpin
}: PinnedMessagesModalProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-99998 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="bg-background-secondary border border-foreground/10 text-foreground rounded-xl shadow-2xl flex flex-col w-full max-w-[500px] h-[550px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-center relative border-b border-foreground/10 shrink-0">
              <h3 className="text-lg font-bold text-foreground">Tin nhắn đã ghim</h3>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 w-9 h-9 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground border-none bg-transparent cursor-pointer"
                title="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body / List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
              {pinnedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-foreground-tertiary space-y-2 py-12 select-none">
                  <Pin className="rotate-45 size-10 stroke-[1.5]" />
                  <p className="text-sm font-medium">Không có tin nhắn được ghim</p>
                </div>
              ) : (
                pinnedMessages.map((msg, index) => {
                  const isMsgUser = msg.senderType === 'user';
                  const senderName = isMsgUser ? (customerName || 'Khách hàng') : 'Bạn';
                  const avatarSrc = isMsgUser ? customerAvatar : undefined;
                  const formattedTime = formatBubbleTime(msg.createdAt);

                  return (
                    <React.Fragment key={`modal-pinned-${msg.id}`}>
                      <div className="flex items-end px-2 gap-3 rounded-xl select-none group relative">
                        {/* Avatar */}
                        {avatarSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={avatarSrc} 
                            alt={senderName} 
                            className="size-8 rounded-full object-cover shadow-sm border border-foreground/10 shrink-0" 
                          />
                        ) : (
                          <div className="size-8 rounded-full bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center border border-foreground/10 shrink-0 select-none">
                            {getInitials(senderName)}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-foreground-secondary truncate pr-2">{senderName}</span>
                            <span className="text-[12px] text-foreground-tertiary font-medium select-none shrink-0 pr-1">
                              {formattedTime}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 relative">
                            {/* Content text */}
                            {msg.content && (
                              <div className="inline-block px-3 py-2 rounded-2xl bg-foreground/5 text-[14px] text-foreground max-w-[85%] wrap-break-word border border-foreground/5 shadow-sm">
                                {msg.content}
                              </div>
                            )}

                            {/* Attachments preview */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="space-y-1">
                                {msg.attachments.map((att, attIdx) => {
                                  const payload = att.payload as unknown as { url?: string; title?: string };
                                  if (att.type === 'image') {
                                    return (
                                      <div key={attIdx} className="overflow-hidden rounded-xl border border-foreground/5 max-w-[150px] max-h-[150px]">
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={payload.url} alt="Attachment" className="object-cover w-full h-full" />
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={attIdx} className="flex items-center gap-1.5 text-xs text-foreground-tertiary">
                                      <Paperclip size={12} />
                                      <span className="truncate">{payload.title || 'Tệp đính kèm'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Custom Options dropdown (Three dots) */}
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                                className="w-8 h-8 rounded-full text-foreground-tertiary hover:text-foreground hover:bg-foreground/10 flex items-center justify-center cursor-pointer border-none bg-transparent transition-all duration-150 font-bold"
                                title="Tùy chọn"
                              >
                                <MoreHorizontal size={18} />
                              </button>

                              {/* Popover Menu matching image */}
                              {activeMenuId === msg.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-99999" 
                                    onClick={() => setActiveMenuId(null)} 
                                  />
                                  <div className="absolute left-0 mt-2 w-48 rounded-lg bg-background-tertiary border border-foreground/10 shadow-2xl z-100000 p-2 text-foreground select-none overflow-hidden">
                                    {/* Arrow pointer */}
                                    <div className="absolute top-[-5px] left-3 w-2.5 h-2.5 bg-background-tertiary border-t border-l border-foreground/10 rotate-45" />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        onJumpToMessage(msg.id);
                                        onClose();
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-foreground/10 transition-colors flex items-center gap-2 border-none bg-transparent text-foreground cursor-pointer rounded-md"
                                    >
                                      Xem trong đoạn chat
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onUnpin(msg.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm font-semibold hover:bg-foreground/10 transition-colors flex items-center gap-2 border-none bg-transparent text-foreground cursor-pointer rounded-md"
                                    >
                                      Bỏ ghim
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < pinnedMessages.length - 1 && (
                        <div className="border-b border-foreground/10 my-4" />
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
