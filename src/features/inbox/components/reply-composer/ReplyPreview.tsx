'use client';

import React from 'react';
import { Reply as ReplyIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageWithSender } from '@features/inbox/types';
import { getReplyMessagePreview } from './reply-composer-utils';

type ReplyPreviewProps = {
  replyToMessage: MessageWithSender | null;
  onCancel: () => void;
};

export function ReplyPreview({ replyToMessage, onCancel }: ReplyPreviewProps) {
  return (
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
              <ReplyIcon size={14} className="shrink-0 text-primary" />
              <div className="truncate">
                <span className="font-bold text-primary mr-1">Đang trả lời:</span>
                {getReplyMessagePreview(replyToMessage)}
              </div>
            </div>
            <button 
              type="button"
              onClick={onCancel}
              className="text-foreground-tertiary hover:text-foreground transition-colors p-1 border-none bg-transparent cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
