'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { MessageWithSender, MessageAttachment } from '@/domain/types/messaging';
import { Sparkles, Play, Pause, FileText, Download, Check, CheckCheck, Loader2, Reply, Pin, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useInboxStore } from '../store/inbox.store';
import { createPortal } from 'react-dom';

// --- Format File Size Utility ---
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// --- Extract Initials Utility ---
const getInitials = (name: string) => {
  const split = name.trim().split(' ');
  if (split.length > 1) {
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// --- Dynamic Border Radius Utility (Messenger-style grouping) ---
const getDynamicCornersClass = (
  isUser: boolean,
  isPrevConsecutive: boolean,
  isNextConsecutive: boolean,
  defaultBase: string = "rounded-2xl",
  isReply: boolean = false
) => {
  if (isReply) {
    return defaultBase; // Trả về góc bo tròn hoàn hảo đầy đủ 100% không dẹt cạnh nào đối với tin nhắn phản hồi
  }

  if (isUser) {
    // Tin nhắn gửi đến (Trái)
    if (isPrevConsecutive && isNextConsecutive) {
      return `${defaultBase} rounded-tl-sm rounded-bl-sm`; // Tin nhắn ở giữa
    }
    if (isPrevConsecutive && !isNextConsecutive) {
      return `${defaultBase} rounded-tl-sm`; // Tin nhắn cuối nhóm
    }
    return `${defaultBase} rounded-bl-sm`; // Tin nhắn đầu nhóm hoặc đơn lẻ
  } else {
    // Tin nhắn gửi đi (Phải)
    if (isPrevConsecutive && isNextConsecutive) {
      return `${defaultBase} rounded-tr-sm rounded-br-sm`; // Tin nhắn ở giữa
    }
    if (isPrevConsecutive && !isNextConsecutive) {
      return `${defaultBase} rounded-tr-sm`; // Tin nhắn cuối nhóm
    }
    return `${defaultBase} rounded-br-sm`; // Tin nhắn đầu nhóm hoặc đơn lẻ
  }
};

// --- Custom Mini Audio Player for Voice Notes ---
const VoiceNotePlayer = ({ 
  url, 
  isUser,
  isPrevConsecutive = false,
  isNextConsecutive = false
}: { 
  url: string; 
  isUser: boolean;
  isPrevConsecutive?: boolean;
  isNextConsecutive?: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      // Fallback update
      if (!isPlaying) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url]);

  // Buttery-smooth 60fps loop for rendering playback progress & bar animation
  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animRef.current = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      animRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    }

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.warn('[Audio] Play error:', err));
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const pct = parseFloat(e.target.value);
    const newTime = (pct / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const barHeights = [6, 10, 14, 8, 4, 12, 16, 10, 6, 14, 12, 8, 16, 10, 4, 12, 14, 8, 6, 10, 8, 4];

  return (
    <div className={cn(
      "flex items-center gap-3 py-6 px-4.5 min-w-40 w-56 h-11 shadow-sm relative select-none",
      getDynamicCornersClass(isUser, isPrevConsecutive, isNextConsecutive, "rounded-2xl"),
      isUser 
        ? "bg-[#e4e6eb] dark:bg-[#242526] text-[#050505] dark:text-white border-none" 
        : "bg-[#7c3aed] text-white border-none"
    )}>
      {/* Play/Pause Button */}
      <button 
        type="button"
        onClick={togglePlay} 
        className="flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer"
      >
        {isPlaying ? (
          <Pause 
            size={15} 
            fill="currentColor" 
            className={isUser ? "text-[#050505] dark:text-white" : "text-white"} 
          />
        ) : (
          <Play 
            size={15} 
            fill="currentColor" 
            className={cn(
              "ml-0.5",
              isUser ? "text-[#050505] dark:text-white" : "text-white"
            )} 
          />
        )}
      </button>

      {/* Waveform & Playhead Container */}
      <div className="flex-1 flex items-center relative h-6 min-w-0 mx-1">
        {/* Waveform Bars */}
        <div className="w-full flex items-center justify-between gap-[2px] h-4">
          {barHeights.map((barHeight, i) => {
            const animHeight = isPlaying 
              ? barHeight * (0.8 + Math.sin(currentTime * 8 + i * 0.5) * 0.2) 
              : barHeight;

            // Compute exact relative sub-range progress for this bar
            const barCount = barHeights.length;
            const startPct = (i / barCount) * 100;
            const endPct = ((i + 1) / barCount) * 100;

            let fillPct = 0;
            if (progress >= endPct) {
              fillPct = 100;
            } else if (progress <= startPct) {
              fillPct = 0;
            } else {
              fillPct = ((progress - startPct) / (endPct - startPct)) * 100;
            }

            // High-contrast adaptivity using modern native CSS color-mix
            const activeColor = isUser ? "currentColor" : "#ffffff";
            const inactiveColor = isUser ? "color-mix(in srgb, currentColor 25%, transparent)" : "rgba(255, 255, 255, 0.3)";

            return (
              <div 
                key={i} 
                className="w-[2px] rounded-full transition-all duration-75" 
                style={{ 
                  height: `${Math.max(3, Math.min(16, animHeight))}px`,
                  background: `linear-gradient(to right, ${activeColor} ${fillPct}%, ${inactiveColor} ${fillPct}%)`
                }}
              />
            );
          })}
        </div>

        {/* Transparent Range Slider for Seeking */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress} 
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />
      </div>

      {/* Playback Time / Duration */}
      <span className={cn(
        "text-[11px] font-semibold select-none tabular-nums shrink-0 ml-1.5",
        isUser ? "text-[#050505]/80 dark:text-white/80" : "text-white/95"
      )}>
        {formatTime(
          currentTime > 0 
            ? Math.max(0, Math.ceil(duration - currentTime)) 
            : Math.ceil(duration || 0)
        )}
      </span>
    </div>
  );
};

// --- Multimedia Attachment Renderer ---
const AttachmentRenderer = ({ 
  attachments, 
  isUser,
  hasTextBubble,
  isPrevConsecutive = false,
  isNextConsecutive = false,
  isReply = false
}: { 
  attachments: MessageAttachment[]; 
  isUser: boolean;
  hasTextBubble: boolean;
  isPrevConsecutive?: boolean;
  isNextConsecutive?: boolean;
  isReply?: boolean;
}) => {
  const setLightboxImage = useInboxStore(state => state.setLightboxImage);
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-col gap-2 max-w-full",
      hasTextBubble ? "-mt-1" : "mt-1"
    )}>
      {attachments.map((att, idx) => {
        const { type, payload } = att;
        if (!payload?.url) return null;

        switch (type) {
          case 'image':
            return (
              <div 
                key={idx} 
                className={cn(
                  "relative group overflow-hidden border border-foreground/5 shadow-md max-w-96",
                  hasTextBubble
                    ? (isUser 
                        ? cn("rounded-tr-xl rounded-br-xl rounded-tl-sm", isNextConsecutive ? "rounded-bl-sm" : "rounded-bl-xl")
                        : cn("rounded-tl-xl rounded-bl-xl rounded-tr-sm", isNextConsecutive ? "rounded-br-sm" : "rounded-br-xl"))
                    : getDynamicCornersClass(isUser, isPrevConsecutive, isNextConsecutive, "rounded-2xl", isReply)
                )}
              >
                <motion.img 
                  src={payload.url} 
                  alt={payload.title || "Image attachment"} 
                  className="max-h-72 w-full object-cover cursor-pointer transition-all hover:brightness-95"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => setLightboxImage(payload.url)}
                />
              </div>
            );
          case 'video':
            return (
              <div 
                key={idx} 
                className={cn(
                  "overflow-hidden border border-foreground/5 shadow-md max-w-72 bg-black",
                  hasTextBubble
                    ? (isUser 
                        ? cn("rounded-tr-xl rounded-br-xl rounded-tl-sm", isNextConsecutive ? "rounded-bl-sm" : "rounded-bl-xl")
                        : cn("rounded-tl-xl rounded-bl-xl rounded-tr-sm", isNextConsecutive ? "rounded-br-sm" : "rounded-br-xl"))
                    : getDynamicCornersClass(isUser, isPrevConsecutive, isNextConsecutive, "rounded-2xl", isReply)
                )}
              >
                <video 
                  src={payload.url} 
                  controls 
                  muted
                  preload="metadata"
                  className="max-h-56 w-full object-cover"
                />
              </div>
            );
          case 'audio':
            return (
              <VoiceNotePlayer 
                key={idx} 
                url={payload.url} 
                isUser={isUser} 
                isPrevConsecutive={isPrevConsecutive}
                isNextConsecutive={isNextConsecutive}
              />
            );
          case 'file':
          default:
            return (
              <a 
                key={idx}
                href={payload.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={cn(
                  "flex items-center gap-3 p-3 bg-background-tertiary border border-foreground/10 hover:bg-background-secondary transition-colors text-foreground text-left max-w-72 shadow-sm",
                  getDynamicCornersClass(isUser, isPrevConsecutive, isNextConsecutive, "rounded-xl", isReply)
                )}
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{payload.title || 'Attached File'}</span>
                  {payload.fileSize && (
                    <span className="text-xs text-foreground-tertiary">
                      {formatFileSize(payload.fileSize)}
                    </span>
                  )}
                </div>
                <Download size={16} className="text-foreground-tertiary hover:text-foreground transition-colors ml-1" />
              </a>
            );
        }
      })}
    </div>
  );
};

// --- Format Bubble Time Utility ---
const formatBubbleTime = (dateInput?: Date | string) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// --- Format Full Bubble Time Utility ---
const formatFullBubbleTime = (dateInput?: Date | string) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = days[date.getDay()];
  
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'CH' : 'SA';
  if (hours > 12) {
    hours = hours - 12;
  }
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${dayName} ${hours}:${minutes} ${ampm}`;
};

// --- Hover Actions Panel ---
const HoverActions = ({ 
  onReplyClick,
  isPinned,
  onPinClick,
  isUser
}: { 
  onReplyClick: () => void;
  isPinned: boolean;
  onPinClick: () => void;
  isUser: boolean;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.85, x: isUser ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.85, x: isUser ? 8 : -8 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={cn(
        "absolute top-full -translate-y-full z-20 flex items-center gap-1 p-1 rounded-full bg-background-secondary border border-foreground/10 shadow-[0_4px_18px_rgba(0,0,0,0.12)] backdrop-blur-md",
        isUser ? "left-full ml-3" : "right-full mr-3"
      )}
    >
      <motion.button
        type="button"
        onClick={onReplyClick}
        className="text-foreground-secondary hover:text-foreground transition-all duration-100 flex items-center justify-center cursor-pointer p-1.5 rounded-full hover:bg-foreground/5"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        title="Trả lời"
      >
        <Reply size={14} />
      </motion.button>
      <div className="w-[1px] h-3.5 bg-foreground/10" />
      <motion.button
        type="button"
        onClick={onPinClick}
        className={cn(
          "text-foreground-secondary hover:text-indigo-500 transition-all duration-100 flex items-center justify-center cursor-pointer p-1.5 rounded-full hover:bg-foreground/5",
          isPinned && "text-indigo-500"
        )}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        title={isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
      >
        <Pin size={13} className={cn(isPinned && "fill-indigo-500 rotate-45")} />
      </motion.button>
    </motion.div>
  );
};

// --- Quote Parent Message ---
const ParentMessageBubble = ({ 
  parent, 
  onScrollToParent,
  isUser
}: { 
  parent: MessageWithSender; 
  onScrollToParent: () => void;
  isUser: boolean;
}) => {
  const hasContent = !!parent.content;

  return (
    <div 
      onClick={onScrollToParent}
      className={cn(
        "p-2 px-3.5 pb-4.5 text-xs leading-relaxed cursor-pointer transition-all duration-200 select-none max-w-60 border-none",
        "opacity-55 hover:opacity-85 active:scale-[0.98]",
        "rounded-2xl",
        "bg-foreground/[0.08] text-foreground/70 backdrop-blur-[0.5px]",   isUser ? "rounded-bl-sm" : "rounded-br-sm"
      )}
    >
      <div className={cn(
        "flex items-center gap-1.5",
        !hasContent && "italic text-foreground/60"
      )}>
        {!hasContent && <Paperclip size={12} className="shrink-0 opacity-70" />}
        <span className="line-clamp-2 break-words">
          {parent.content || 'File đính kèm'}
        </span>
      </div>
    </div>
  );
};

// --- Delivery Status Marker ---
const StatusMarker = ({ 
  isRead, 
  isDelivered, 
  isSending 
}: { 
  isRead?: boolean; 
  isDelivered?: boolean; 
  isSending?: boolean;
}) => {
  if (isSending) {
    return <Loader2 size={12} className="animate-spin text-foreground-tertiary" />;
  }
  if (isRead) {
    return <CheckCheck size={12} className="text-emerald-500 font-bold animate-pulse" />;
  }
  if (isDelivered) {
    return <CheckCheck size={12} className="text-foreground-tertiary" />;
  }
  return <Check size={12} className="text-foreground-tertiary" />;
};

// --- MAIN MESSAGE BUBBLE COMPONENT ---
export const MessageBubble = memo(function MessageBubble({ 
  message, 
  showStatus = false,
  conversationId = '',
  isNextConsecutive = false,
  isPrevConsecutive = false,
  customerAvatar,
  customerName,
  showSeparator = false
}: { 
  message: MessageWithSender;
  showStatus?: boolean;
  conversationId?: string;
  isNextConsecutive?: boolean;
  isPrevConsecutive?: boolean;
  customerAvatar?: string;
  customerName?: string;
  showSeparator?: boolean;
}) {
  const isUser = message.senderType === 'user';
  const isAi = message.senderType === 'ai';
  const isAgent = message.senderType === 'agent';

  // Dynamic Border Radius (Bo góc dẹt phẳng thông minh chuẩn Messenger)
  const getBubbleCornersClass = () => {
    return getDynamicCornersClass(isUser, isPrevConsecutive, isNextConsecutive, "rounded-2xl", !!message.parentMessageId);
  };

  const bubbleRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

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
  const setReplyToMessage = useInboxStore(state => state.setReplyToMessage);
  const triggerRefresh = useInboxStore(state => state.triggerRefresh);

  useEffect(() => {
    console.log("TimePill Debug - isRowHovered changed:", isRowHovered, "ref ready:", !!bubbleRef.current);
    if (isRowHovered && bubbleRef.current) {
      const updatePosition = () => {
        const rect = bubbleRef.current?.getBoundingClientRect();
        console.log("TimePill Debug - getBoundingClientRect:", rect);
        if (rect) {
          setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      };

      updatePosition();

      const scrollContainer = bubbleRef.current.closest(".overflow-y-auto");
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", updatePosition, { passive: true });
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
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add("ring-2", "ring-indigo-500", "ring-offset-2", "ring-offset-background", "rounded-[20px]", "animate-pulse");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2", "ring-offset-background", "rounded-[20px]", "animate-pulse");
      }, 2000);
    }
  };

  const handlePinClick = async () => {
    try {
      const newPinnedState = !isPinned;
      setIsPinned(newPinnedState);
      
      const res = await fetch(`/api/conversations/${conversationId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'message',
          messageId: message.id,
          isPinned: newPinnedState
        })
      });
      if (res.ok) {
        triggerRefresh();
      } else {
        setIsPinned(!newPinnedState);
      }
    } catch (err) {
      console.error('[MessageBubble] Pin error:', err);
      setIsPinned(isPinned);
    }
  };

  return (
    <div 
      id={`msg-${message.id}`} 
      className={cn(
        "flex max-w-full group/bubble relative gap-2.5",
        isNextConsecutive ? "mb-1.5" : "mb-4",
        isUser ? "justify-start items-end" : "justify-end items-end"
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

      <div className={cn(
        "flex flex-col gap-1 relative",
        isUser ? "items-start max-w-[calc(80%-40px)]" : "items-end max-w-4/5"
      )}>
        
        {/* Render Reply Header & Parent Bubble if Threaded */}
        {message.parentMessage && (
          <>
            {/* Header hiển thị "[Tên] đã trả lời" */}
            <div className={cn(
              "flex items-center gap-1 text-xs text-foreground-tertiary select-none opacity-80 mb-1 font-medium transition-all duration-150",
              isUser ? "justify-start pl-1" : "justify-end pr-1"
            )}>
              <Reply size={11} className="shrink-0 opacity-70" />
              <span>
                {(() => {
                  const isParentUser = message.parentMessage?.senderType === 'user';
                  if (isUser) {
                    return isParentUser ? "Khách hàng đã trả lời chính mình" : "Khách hàng đã trả lời bạn";
                  } else {
                    return isParentUser ? "Bạn đã trả lời khách hàng" : "Bạn đã trả lời chính mình";
                  }
                })()}
              </span>
            </div>

            {/* Parent Bubble mờ xếp ngay trên bong bóng chính, thụt lề so với bong bóng chính để bám sát Ảnh 1 */}
            <div className={cn(
              "w-fit max-w-full relative z-10"
            )}>
              <ParentMessageBubble 
                parent={message.parentMessage} 
                onScrollToParent={onScrollToParent}
                isUser={isUser}
              />
            </div>
          </>
        )}

        {/* Core Bubble Content Area (Bao gồm Text Bubble và Attachments để căn lề HoverActions + TimePill thẳng hàng dọc chính giữa) */}
        <div 
          ref={bubbleRef} 
          className={cn(
            "w-fit max-w-full flex flex-col gap-1",
            message.parentMessage ? "relative z-20 -mt-4" : "relative z-10"
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
          {/* 1. Text Bubble (Renders only if there's content or is AI auto-reply) */}
          {(message.content || isAi) && (
            <div 
              className={cn(
                "w-fit p-2 px-3.5 flex flex-col gap-1 relative break-words transition-all hover:-translate-y-px cursor-pointer",
                message.parentMessage 
                  ? "shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.22)]" 
                  : "shadow-sm hover:shadow-md",
                getBubbleCornersClass(),
                isUser && "bg-background-secondary border border-foreground/10 text-foreground",
                isAgent && "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25",
                isAi && "bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-500/35 text-foreground shadow-md shadow-purple-500/15 backdrop-blur-md"
              )}
            >
              {/* AI Robot Header Banner */}
              {isAi && (
                <div className="flex items-center gap-1.5 text-2xs font-bold uppercase text-purple-400 mb-1">
                  <Sparkles size={11} className="text-purple-400 animate-pulse" />
                  <span>AI Auto-Reply</span>
                </div>
              )}

              {/* Main Message Text */}
              {message.content && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
              )}
            </div>
          )}

          {/* 2. Render Attachments Outside the Text Bubble (Images, Videos, Files, Audio Waves) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="relative w-fit cursor-pointer">
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

          {(() => {
            if (showTimePill) {
              console.log("TimePill Render Check - showTimePill:", showTimePill, "coords:", coords, "window defined:", typeof window !== 'undefined');
            }
            return null;
          })()}
          {typeof window !== 'undefined' && createPortal(
            <AnimatePresence>
              {showTimePill && coords && (
                <div
                  key={`timepill-portal-${message.id}`}
                  style={{
                    position: 'fixed',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    width: `${coords.width}px`,
                    height: `${coords.height}px`,
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, x: isUser ? -6 : 6 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85, x: isUser ? -6 : 6 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    className={cn(
                      "absolute top-full -translate-y-full flex items-center justify-center select-none",
                      "bg-foreground/80 backdrop-blur-lg text-background text-xs font-semibold px-2.5 py-1 rounded-md shadow-md border border-background/10 whitespace-nowrap",
                      isUser ? "right-full mr-2" : "left-full ml-2"
                    )}
                  >
                    {showSeparator ? formatFullBubbleTime(message.createdAt) : formatBubbleTime(message.createdAt)}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}
        </div>

        {/* Message Delivery Status Footer */}
        {(showStatus || isPinned) && (
          <div className="flex items-center gap-1.5 mt-0.5 select-none opacity-85">
            {showStatus && (
              <>
                <span className="text-[10px] text-foreground-tertiary">
                  {message.is_read ? 'Đã xem' : (message.is_delivered ? 'Đã nhận' : 'Đang gửi...')}
                </span>
                <StatusMarker 
                  isRead={message.is_read} 
                  isDelivered={message.is_delivered} 
                  isSending={!message.is_delivered && !message.is_read} 
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
