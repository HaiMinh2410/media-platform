'use client';

import { cn } from "@shared/lib";

import React, { memo, useState, useEffect, useRef } from "react";
import { MessageWithSender } from "@features/inbox/types";
import { Pin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInboxStore } from "../store/inbox.store";
import { createPortal } from "react-dom";

// --- Sub-components and utilities ---
import { VoiceNotePlayer } from "./message-bubble/VoiceNotePlayer";
import { AttachmentRenderer } from "./message-bubble/AttachmentRenderer";
import { ParentMessageBubble } from "./message-bubble/ParentMessageBubble";
import { HoverActions } from "./message-bubble/HoverActions";
import { StatusMarker } from "./message-bubble/StatusMarker";
import {
  getInitials,
  getDynamicCornersClass,
  formatBubbleTime,
  formatFullBubbleTime,
} from "./message-bubble/message-bubble-utils";

// --- MAIN MESSAGE BUBBLE COMPONENT ---
export const MessageBubble = memo(function MessageBubble({
  message,
  showStatus = false,
  conversationId = "",
  isNextConsecutive = false,
  isPrevConsecutive = false,
  customerAvatar,
  customerName,
  showSeparator = false,
  isLatestOutgoing = false,
  isLatestReadOutgoing = false,
}: {
  message: MessageWithSender;
  showStatus?: boolean;
  conversationId?: string;
  isNextConsecutive?: boolean;
  isPrevConsecutive?: boolean;
  customerAvatar?: string;
  customerName?: string;
  showSeparator?: boolean;
  isLatestOutgoing?: boolean;
  isLatestReadOutgoing?: boolean;
}) {
  const isUser = message.senderType === "user";
  const isAi = message.senderType === "ai";
  const isAgent = message.senderType === "agent";

  // Dynamic Border Radius
  const getBubbleCornersClass = () => {
    return getDynamicCornersClass(
      isUser,
      isPrevConsecutive,
      isNextConsecutive,
      "rounded-2xl",
      !!message.parentMessageId,
    );
  };

  const bubbleRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const [isRowHovered, setIsRowHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(message.is_pinned || false);
  const [showTimePill, setShowTimePill] = useState(false);
  const timePillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timePillTimerRef.current) {
        clearTimeout(timePillTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRowHovered) {
      if (timePillTimerRef.current) {
        clearTimeout(timePillTimerRef.current);
        timePillTimerRef.current = null;
      }
      setShowTimePill(false);
    }
  }, [isRowHovered]);

  const hasTextBubble = !!(message.content || isAi);
  const setReplyToMessage = useInboxStore((state) => state.setReplyToMessage);
  const triggerRefresh = useInboxStore((state) => state.triggerRefresh);

  useEffect(() => {
    if (isRowHovered && bubbleRef.current) {
      const updatePosition = () => {
        const rect = bubbleRef.current?.getBoundingClientRect();
        if (rect) {
          setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }
      };

      updatePosition();

      const scrollContainer = bubbleRef.current.closest(".overflow-y-auto");
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", updatePosition, {
          passive: true,
        });
      }
      window.addEventListener("resize", updatePosition, { passive: true });

      return () => {
        if (scrollContainer) {
          scrollContainer.removeEventListener("scroll", updatePosition);
        }
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setCoords(null);
    }
  }, [isRowHovered]);

  useEffect(() => {
    setIsPinned(message.is_pinned || false);
  }, [message.is_pinned]);

  const onScrollToParent = () => {
    if (!message.parentMessageId) return;
    const element = document.getElementById(`msg-${message.parentMessageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      const targets = element.querySelectorAll(".bubble-highlight-target");
      if (targets.length > 0) {
        targets.forEach((target) => {
          target.classList.add(
            "ring",
            "ring-primary",
            "ring-offset-2",
            "ring-offset-background",
            "scale-[1.03]",
            "shadow-lg",
            "z-30",
          );
        });
        setTimeout(() => {
          targets.forEach((target) => {
            target.classList.remove(
              "ring",
              "ring-primary",
              "ring-offset-2",
              "ring-offset-background",
              "scale-[1.03]",
              "shadow-lg",
              "z-30",
            );
          });
        }, 2000);
      } else {
        element.classList.add("animate-pulse");
        setTimeout(() => {
          element.classList.remove("animate-pulse");
        }, 2000);
      }
    }
  };

  const handlePinClick = async () => {
    try {
      const newPinnedState = !isPinned;
      setIsPinned(newPinnedState);

      const res = await fetch(`/api/conversations/${conversationId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "message",
          messageId: message.id,
          isPinned: newPinnedState,
        }),
      });
      if (res.ok) {
        triggerRefresh();
      } else {
        setIsPinned(!newPinnedState);
      }
    } catch (err) {
      console.error("[MessageBubble] Pin error:", err);
      setIsPinned(isPinned);
    }
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        "flex max-w-full group/bubble relative gap-2.5",
        isNextConsecutive ? "mb-1.5" : "mb-4",
        isUser ? "justify-start items-end" : "justify-end items-end",
      )}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => {
        setIsRowHovered(false);
      }}
    >
      {/* Khách hàng Avatar cột bên trái */}
      {isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 select-none">
          {!isNextConsecutive ? (
            customerAvatar ? (
              <img
                src={customerAvatar}
                alt={customerName || "Customer"}
                className="w-full h-full rounded-full object-cover shadow-sm border border-foreground/10"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-background-tertiary flex items-center justify-center font-semibold text-xs border border-foreground/10 text-foreground">
                {getInitials(customerName || "Khách hàng")}
              </div>
            )
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-1 relative",
          isUser ? "items-start max-w-[calc(80%-40px)]" : "items-end max-w-4/5",
        )}
      >
        {/* Render Reply Header & Parent Bubble if Threaded */}
        {message.parentMessage && (
          <>
            {/* Header hiển thị "[Tên] đã trả lời" */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs text-foreground-tertiary select-none opacity-80 mb-1 font-medium transition-all duration-150",
                isUser ? "justify-start pl-1" : "justify-end pr-1",
              )}
            >
              <span className="shrink-0 opacity-70">↪</span>
              <span>
                {(() => {
                  const isParentUser =
                    message.parentMessage?.senderType === "user";
                  if (isUser) {
                    return isParentUser
                      ? "Khách hàng đã trả lời chính mình"
                      : "Khách hàng đã trả lời bạn";
                  } else {
                    return isParentUser
                      ? "Bạn đã trả lời khách hàng"
                      : "Bạn đã trả lời chính mình";
                  }
                })()}
              </span>
            </div>

            {/* Parent Bubble mờ xếp ngay trên bong bóng chính */}
            <div className="w-fit max-w-full relative z-10">
              <ParentMessageBubble
                parent={message.parentMessage}
                onScrollToParent={onScrollToParent}
                isUser={isUser}
              />
            </div>
          </>
        )}

        {/* Core Bubble Content Area */}
        <div
          ref={bubbleRef}
          className={cn(
            "w-fit max-w-full flex flex-col gap-1",
            message.parentMessage ? "relative z-20 -mt-4" : "relative z-10",
          )}
          onMouseEnter={() => {
            if (timePillTimerRef.current) {
              clearTimeout(timePillTimerRef.current);
            }
            timePillTimerRef.current = setTimeout(() => {
              setShowTimePill(true);
            }, 300);
          }}
          onMouseLeave={() => {
            if (timePillTimerRef.current) {
              clearTimeout(timePillTimerRef.current);
              timePillTimerRef.current = null;
            }
            setShowTimePill(false);
          }}
        >
          {/* 1. Text Bubble */}
          {(message.content || isAi) && (
            <div
              className={cn(
                "w-fit p-2 px-3.5 flex flex-col gap-1 relative wrap-break-word transition-all duration-300 hover:-translate-y-px cursor-pointer bubble-highlight-target",
                message.parentMessage
                  ? "shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.22)]"
                  : "shadow-sm hover:shadow-md",
                getBubbleCornersClass(),
                isUser &&
                  "bg-background-secondary border border-foreground/10 text-foreground",
                isAgent &&
                  "bg-linear-to-br from-primary to-secondary text-primary-content shadow-md shadow-primary/25",
                isAi &&
                  "bg-linear-to-br from-accent/15 to-accent/5 border border-accent/35 text-foreground shadow-md shadow-accent/15 backdrop-blur-md",
              )}
            >
              {/* Main Message Text */}
              {message.content && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              )}
            </div>
          )}

          {/* 2. Render Attachments Outside the Text Bubble */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="relative w-fit cursor-pointer transition-all duration-300 bubble-highlight-target">
              <AttachmentRenderer
                attachments={message.attachments}
                isUser={isUser}
                hasTextBubble={hasTextBubble}
                isPrevConsecutive={isPrevConsecutive}
                isNextConsecutive={isNextConsecutive}
                isReply={!!message.parentMessageId}
              />
            </div>
          )}

          {/* Interactive Floating Hover Action Bar */}
          <AnimatePresence>
            {isRowHovered && conversationId && (
              <HoverActions
                onReplyClick={() => setReplyToMessage(message)}
                isPinned={isPinned}
                onPinClick={handlePinClick}
                isUser={isUser}
              />
            )}
          </AnimatePresence>

          {typeof window !== "undefined" &&
            createPortal(
              <AnimatePresence>
                {showTimePill && coords && (
                  <div
                    key={`timepill-portal-${message.id}`}
                    style={{
                      position: "fixed",
                      top: `${coords.top}px`,
                      left: `${coords.left}px`,
                      width: `${coords.width}px`,
                      height: `${coords.height}px`,
                      pointerEvents: "none",
                      zIndex: 9999,
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, x: isUser ? -6 : 6 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.85, x: isUser ? -6 : 6 }}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 25,
                      }}
                      className={cn(
                        "absolute top-full -translate-y-full flex items-center justify-center select-none",
                        "bg-foreground/80 backdrop-blur-lg text-background text-xs font-semibold px-2.5 py-1 rounded-md shadow-md border border-background/10 whitespace-nowrap",
                        isUser ? "right-full mr-2" : "left-full ml-2",
                      )}
                    >
                      {showSeparator
                        ? formatFullBubbleTime(message.createdAt)
                        : formatBubbleTime(message.createdAt)}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>,
              document.body,
            )}
        </div>

        {/* Message Delivery Status Footer */}
        {(isLatestOutgoing || isLatestReadOutgoing || isPinned) && (
          <div className="flex items-center gap-1.5 mt-0.5 select-none opacity-85 animate-in fade-in duration-200">
            {/* 1. Tin nhắn cuối cùng đã gửi và chưa đọc */}
            {isLatestOutgoing && !message.is_read && (
              <>
                <span className="text-2xs text-foreground-tertiary">
                  {message.id.startsWith("temp-") || (message as any).isSending
                    ? "Đang gửi..."
                    : message.is_delivered
                      ? "Đã nhận"
                      : "Đã gửi"}
                </span>
                <StatusMarker
                  isRead={false}
                  isDelivered={message.is_delivered}
                  isSending={
                    message.id.startsWith("temp-") || (message as any).isSending
                  }
                />
              </>
            )}

            {/* 2. Tin nhắn mới nhất đã được xem */}
            {isLatestReadOutgoing && (
              <motion.div
                layoutId="seen-avatar"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 22 }}
                className="flex items-center justify-center shrink-0 ml-1 select-none"
                title="Đã xem"
              >
                {customerAvatar ? (
                  <img
                    src={customerAvatar}
                    alt={customerName || "Customer"}
                    className="size-5 rounded-full object-cover shadow-sm border border-foreground/10"
                  />
                ) : (
                  <div className="size-5 rounded-full bg-background-tertiary flex items-center justify-center font-bold text-[8px] border border-foreground/10 text-foreground">
                    {getInitials(customerName || "Khách hàng")}
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. Ghim indicator */}
            {isPinned && (
              <div className="flex items-center gap-1 text-primary bg-primary/10 px-1.5 py-0.5 rounded-full text-3xs font-semibold">
                <Pin size={9} fill="currentColor" className="rotate-45" />
                <span>Đã ghim</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
