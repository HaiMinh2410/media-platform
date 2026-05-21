import React from 'react';
import { Reply, Pin } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { motion } from 'framer-motion';

interface HoverActionsProps {
  onReplyClick: () => void;
  isPinned: boolean;
  onPinClick: () => void;
  isUser: boolean;
}

export function HoverActions({
  onReplyClick,
  isPinned,
  onPinClick,
  isUser,
}: HoverActionsProps) {
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
      <div className="w-px h-3.5 bg-foreground/10" />
      <motion.button
        type="button"
        onClick={onPinClick}
        className={cn(
          "text-foreground-secondary hover:text-primary transition-all duration-100 flex items-center justify-center cursor-pointer p-1.5 rounded-full hover:bg-foreground/5",
          isPinned && "text-primary"
        )}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        title={isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
      >
        <Pin size={13} className={cn(isPinned && "fill-primary rotate-45")} />
      </motion.button>
    </motion.div>
  );
}
