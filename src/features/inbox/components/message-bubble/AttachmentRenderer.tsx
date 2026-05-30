import { cn } from "@shared/lib";

import React from 'react';
import { FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { MessageAttachment } from '@features/inbox/types';
import { useInboxStore } from '../../store/inbox.store';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { getDynamicCornersClass, formatFileSize } from './message-bubble-utils';

interface AttachmentRendererProps {
  attachments: MessageAttachment[];
  isUser: boolean;
  hasTextBubble: boolean;
  isPrevConsecutive?: boolean;
  isNextConsecutive?: boolean;
  isReply?: boolean;
}

export function AttachmentRenderer({
  attachments,
  isUser,
  hasTextBubble,
  isPrevConsecutive = false,
  isNextConsecutive = false,
  isReply = false,
}: AttachmentRendererProps) {
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
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
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
}
