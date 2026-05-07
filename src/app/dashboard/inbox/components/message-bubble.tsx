'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { MessageWithSender, MessageAttachment, MessageReaction } from '@/domain/types/messaging';
import { Sparkles, Play, Pause, FileText, Download, Check, CheckCheck, Loader2, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useInboxStore } from '../store/inbox.store';

// --- Format File Size Utility ---
const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// --- Custom Mini Audio Player for Voice Notes ---
const VoiceNotePlayer = ({ url }: { url: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
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

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-foreground min-w-[240px] shadow-sm backdrop-blur-sm">
      <button 
        type="button"
        onClick={togglePlay} 
        className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-md active:scale-95"
      >
        {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} className="ml-0.5" fill="white" />}
      </button>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Dynamic Waveform Visualizer */}
        <div className="flex items-end gap-[3px] h-6 px-1">
          {Array.from({ length: 18 }).map((_, i) => {
            const baseHeight = 12 + Math.sin(i * 0.5) * 8;
            const playHeight = baseHeight + (isPlaying ? Math.random() * 8 : 0);
            const isPassed = (i / 18) * 100 <= progress;
            return (
              <div 
                key={i} 
                className={cn(
                  "w-[3px] rounded-full transition-all duration-150", 
                  isPassed ? "bg-indigo-500" : "bg-foreground/20"
                )}
                style={{ height: `${Math.max(4, Math.min(24, playHeight))}px` }}
              />
            );
          })}
        </div>
        {/* Playback Controls & Time */}
        <div className="flex items-center justify-between gap-2 text-[10px] text-foreground-tertiary">
          <span>{formatTime(currentTime)}</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={handleSliderChange}
            className="flex-1 h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
    </div>
  );
};

// --- Multimedia Attachment Renderer ---
const AttachmentRenderer = ({ attachments }: { attachments: MessageAttachment[] }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-1 max-w-full">
      {attachments.map((att, idx) => {
        const { type, payload } = att;
        if (!payload?.url) return null;

        switch (type) {
          case 'image':
            return (
              <div key={idx} className="relative group overflow-hidden rounded-xl border border-foreground/5 shadow-md max-w-[280px]">
                <motion.img 
                  src={payload.url} 
                  alt={payload.title || "Image attachment"} 
                  className="max-h-[220px] object-cover cursor-pointer transition-all hover:brightness-95"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => window.open(payload.url, '_blank')}
                />
              </div>
            );
          case 'video':
            return (
              <div key={idx} className="rounded-xl overflow-hidden border border-foreground/5 shadow-md max-w-[280px] bg-black">
                <video 
                  src={payload.url} 
                  controls 
                  preload="metadata"
                  className="max-h-[220px] w-full object-cover"
                />
              </div>
            );
          case 'audio':
            return <VoiceNotePlayer key={idx} url={payload.url} />;
          case 'file':
          default:
            return (
              <a 
                key={idx}
                href={payload.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 p-3 rounded-xl bg-background-tertiary border border-foreground/10 hover:bg-background-secondary transition-colors text-foreground text-left max-w-[280px] shadow-sm"
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

// --- Hover Reaction Picker Panel ---
const HoverReactions = ({ 
  messageId, 
  conversationId, 
  existingReactions,
  onReactSuccess,
  onReplyClick
}: { 
  messageId: string; 
  conversationId: string; 
  existingReactions: MessageReaction[] | null;
  onReactSuccess: (updated: MessageReaction[]) => void;
  onReplyClick: () => void;
}) => {
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const handleReact = async (emoji: string) => {
    try {
      if (!conversationId) return;
      const isAlreadyReacted = existingReactions?.some(r => r.senderId === 'agent' && r.reaction === emoji) || false;
      const action = isAlreadyReacted ? 'unreact' : 'react';

      const res = await fetch(`/api/conversations/${conversationId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          reaction: emoji,
          action
        })
      });
      const data = await res.json();
      if (data.success && data.reactions) {
        onReactSuccess(data.reactions);
      } else {
        // Fallback Client-side update
        const updated = existingReactions ? [...existingReactions] : [];
        if (action === 'react') {
          updated.push({ senderId: 'agent', reaction: emoji });
        } else {
          const idx = updated.findIndex(r => r.senderId === 'agent' && r.reaction === emoji);
          if (idx !== -1) updated.splice(idx, 1);
        }
        onReactSuccess(updated);
      }
    } catch (err) {
      console.warn('[HoverReactions] Reaction error:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.85, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 5 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className="absolute -top-11 z-20 flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-background-secondary border border-foreground/10 shadow-[0_4px_25px_rgba(0,0,0,0.18)] backdrop-blur-md"
    >
      {emojis.map((emoji) => (
        <motion.button
          key={emoji}
          type="button"
          onClick={() => handleReact(emoji)}
          className="text-lg hover:text-2xl transition-all duration-100 flex items-center justify-center cursor-pointer select-none"
          whileHover={{ scale: 1.35, y: -4 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 12 }}
        >
          {emoji}
        </motion.button>
      ))}
      <div className="w-[1px] h-4 bg-foreground/10 mx-1" />
      <motion.button
        type="button"
        onClick={onReplyClick}
        className="text-foreground-secondary hover:text-foreground transition-all duration-100 flex items-center justify-center cursor-pointer p-1"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
      >
        <Reply size={15} />
      </motion.button>
    </motion.div>
  );
};

// --- Reaction List Displays ---
const ReactionDisplay = ({ reactions }: { reactions: MessageReaction[] }) => {
  if (!reactions || reactions.length === 0) return null;

  // Group unique emojis
  const counts: { [emoji: string]: number } = {};
  reactions.forEach(r => {
    counts[r.reaction] = (counts[r.reaction] || 0) + 1;
  });

  const uniqueEmojis = Object.keys(counts);

  return (
    <div className="absolute -bottom-2 right-4 z-10 flex items-center gap-1 p-0.5 px-1.5 rounded-full bg-background border border-foreground/10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[10px] select-none hover:scale-105 transition-all cursor-pointer">
      <div className="flex items-center gap-0.5">
        {uniqueEmojis.slice(0, 3).map((emoji) => (
          <span key={emoji} className="leading-none">{emoji}</span>
        ))}
      </div>
      {reactions.length > 1 && (
        <span className="font-semibold text-foreground-secondary text-[9px] ml-0.5">{reactions.length}</span>
      )}
    </div>
  );
};

// --- Quote Parent Message ---
const ParentMessageQuote = ({ 
  parent, 
  onScrollToParent 
}: { 
  parent: MessageWithSender; 
  onScrollToParent: () => void;
}) => {
  const isAgent = parent.senderType === 'agent';
  const isAi = parent.senderType === 'ai';
  const label = isAgent ? 'Bạn' : (isAi ? 'AI' : 'Khách hàng');

  return (
    <div 
      onClick={onScrollToParent}
      className="mb-1.5 p-2 rounded-lg bg-black/10 text-[11px] border-l-2 border-indigo-500 cursor-pointer hover:bg-black/15 transition-all text-left flex flex-col gap-0.5 max-w-full opacity-85 select-none"
    >
      <span className="font-bold text-indigo-400">{label}</span>
      <span className="truncate max-w-[200px] text-foreground/80">{parent.content || '[Tệp đính kèm]'}</span>
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
  conversationId = ''
}: { 
  message: MessageWithSender;
  showStatus?: boolean;
  conversationId?: string;
}) {
  const isUser = message.senderType === 'user';
  const isAi = message.senderType === 'ai';
  const isAgent = message.senderType === 'agent';

  const [isHovered, setIsHovered] = useState(false);
  const [reactions, setReactions] = useState<MessageReaction[]>(message.reactions || []);
  const setReplyToMessage = useInboxStore(state => state.setReplyToMessage);

  useEffect(() => {
    setReactions(message.reactions || []);
  }, [message.reactions]);

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

  return (
    <div 
      id={`msg-${message.id}`} 
      className={cn(
        "flex mb-5 max-w-full group/bubble relative",
        isUser ? "justify-start" : "justify-end"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Floating Hover Reaction Bar */}
      <AnimatePresence>
        {isHovered && conversationId && (
          <HoverReactions 
            messageId={message.id} 
            conversationId={conversationId} 
            existingReactions={reactions} 
            onReactSuccess={setReactions} 
            onReplyClick={() => setReplyToMessage(message)}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "flex flex-col max-w-[80%] gap-1.5 relative",
        isUser ? "items-start" : "items-end"
      )}>
        
        {/* Main Text & Media Bubble Container */}
        <div className={cn(
          "w-fit p-3 px-4.5 rounded-[22px] shadow-sm flex flex-col gap-1 relative break-words transition-all hover:-translate-y-px hover:shadow-md",
          isUser && "bg-background-secondary border border-foreground/10 rounded-bl-sm text-foreground",
          isAgent && "bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-br-sm text-white shadow-[0_3px_12px_rgba(99,102,241,0.25)]",
          isAi && "bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-500/35 rounded-br-sm text-foreground shadow-[0_4px_18px_rgba(168,85,247,0.12)] backdrop-blur-md"
        )}>
          {/* AI Robot Header Banner */}
          {isAi && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-purple-400 mb-1">
              <Sparkles size={11} className="text-purple-400 animate-pulse" />
              <span>AI Auto-Reply</span>
            </div>
          )}

          {/* Render Parent Quote if Threaded */}
          {message.parentMessage && (
            <ParentMessageQuote 
              parent={message.parentMessage} 
              onScrollToParent={onScrollToParent} 
            />
          )}

          {/* Main Message Text (if any) */}
          {message.content && (
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          )}

          {/* Render Attachments (Images, Videos, Files, Audio Waves) */}
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentRenderer attachments={message.attachments} />
          )}

          {/* Interactive Reactions Bubble (Bottom Right of Bubble) */}
          {reactions.length > 0 && (
            <ReactionDisplay reactions={reactions} />
          )}
        </div>

        {/* Message Delivery Status Footer */}
        {showStatus && (
          <div className="flex items-center gap-1.5 mt-0.5 select-none opacity-85">
            <span className="text-[10px] text-foreground-tertiary">
              {message.is_read ? 'Đã xem' : (message.is_delivered ? 'Đã nhận' : 'Đang gửi...')}
            </span>
            <StatusMarker 
              isRead={message.is_read} 
              isDelivered={message.is_delivered} 
              isSending={!message.is_delivered && !message.is_read} 
            />
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
