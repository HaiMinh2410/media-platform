import React from 'react';
import { Paperclip, Mic } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { SnippetSelector } from '../SnippetSelector';
import { SendButton } from '../../send-button';

type ComposerActionsProps = {
  onSnippetSelect: (snippetText: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRecordStart: () => void;
  isSending: boolean;
  text: string;
  filesCount: number;
  onSubmit: () => void;
};

export function ComposerActions({
  onSnippetSelect,
  fileInputRef,
  onFileChange,
  onRecordStart,
  isSending,
  text,
  filesCount,
  onSubmit,
}: ComposerActionsProps) {
  const isSendDisabled = !text.trim() && filesCount === 0;

  return (
    <div className="flex justify-between items-center pt-3 border-t border-foreground/5 mt-2">
      <div className="flex items-center gap-2">
        {/* Saved Snippets Selector */}
        <SnippetSelector onSnippetSelect={onSnippetSelect} />

        <button
          type="button"
          className="bg-transparent border-none text-foreground-tertiary size-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-foreground/5"
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={18} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={onFileChange}
        />

        <button
          type="button"
          className="bg-transparent border-none text-foreground-tertiary size-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-foreground/5"
          title="Record voice note"
          onClick={onRecordStart}
        >
          <Mic size={18} />
        </button>
      </div>

      <SendButton
        type="submit"
        className={cn(
          'w-8 h-8 rounded-md bg-accent-gradient border-none text-foreground hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          isSending && 'opacity-70'
        )}
        disabled={isSendDisabled}
        isSending={isSending}
        aria-label="Send message"
        onClick={onSubmit}
        size={16}
      />
    </div>
  );
}
