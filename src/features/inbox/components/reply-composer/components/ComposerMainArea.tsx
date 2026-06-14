import { cn } from "@shared/lib";

import React from 'react';
import { MessageWithSender } from '@features/inbox/types';
import { AttachmentPreview, FileAttachment } from '../../attachment-preview';

type ComposerMainAreaProps = {
  isAiGenerating: boolean;
  isRewriting: boolean;
  replyToMessage: MessageWithSender | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  files: FileAttachment[];
  onRemoveFile: (id: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isSending: boolean;
  text: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  children?: React.ReactNode;
};

export function ComposerMainArea({
  isAiGenerating,
  isRewriting,
  replyToMessage,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  files,
  onRemoveFile,
  textareaRef,
  isSending,
  text,
  onChange,
  onSubmit,
  children,
}: ComposerMainAreaProps) {
  return (
    <div
      className={cn(
        'flex gap-3 items-end p-3 px-md transition-all rounded-lg bg-base-200 relative outline-none',
        replyToMessage && 'rounded-tl-none',
        (isAiGenerating || isRewriting) === true && 'rounded-[8.5px] bg-background-base'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center rounded-lg border-2 border-dashed border-primary text-primary font-medium">
          Thả tệp vào đây để đính kèm
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {files.length > 0 && (
          <AttachmentPreview attachments={files} onRemove={onRemoveFile} />
        )}

        <textarea
          ref={textareaRef}
          className="w-full bg-transparent border-none text-foreground text-base resize-none outline-none max-h-[160px] min-h-lg overflow-y-auto placeholder:text-foreground-tertiary caret-primary"
          placeholder={isSending ? 'Sending…' : 'Type a message…'}
          rows={1}
          value={text}
          onChange={onChange}
          disabled={isSending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />

        {children}
      </div>
    </div>
  );
}
