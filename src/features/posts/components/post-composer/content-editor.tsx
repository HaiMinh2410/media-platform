'use client';

import React, { useRef, useEffect } from 'react';
import { Image as ImageIcon, Film, Smile, Link as LinkIcon } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { ValidationIssue } from '@shared/lib/validation/validation-engine';

type ContentEditorProps = {
  content: string;
  onChange: (content: string) => void;
  maxLength: number;
  mediaCount: number;
  issues: ValidationIssue[];
  hasInstagram?: boolean;
  platformCount: number;
};

export function ContentEditor({ 
  content, 
  onChange, 
  maxLength, 
  mediaCount,
  issues, 
  hasInstagram,
  platformCount
}: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = content.length;
  const contentIssues = issues.filter(i => i.message.includes('ký tự') || i.message.includes('hashtag'));
  
  const isWarning = charCount > maxLength * 0.9;
  const isError = charCount > maxLength;

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div className="flex flex-col bg-base-200">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập nội dung bài đăng..."
        className="w-full min-h-[140px] bg-transparent border-0 p-4 text-sm text-foreground placeholder:text-foreground-tertiary focus:ring-0 focus:outline-none resize-none leading-relaxed font-sans"
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
      />
      
      <div className="flex flex-col gap-1 p-2 pt-0">
        <div className="flex flex-col items-end px-2">
          <span className={cn(
            "font-mono text-2xs",
            isError ? "text-error font-bold" : isWarning ? "text-warning" : "text-foreground-secondary"
          )}>
            {charCount} / {maxLength === Infinity ? '∞' : maxLength}
          </span>
          {platformCount > 1 && (
            <span className="text-2xs text-foreground-tertiary font-medium italic">
              * Giới hạn theo nền tảng khắt khe nhất
            </span>
          )}
        </div>

        <div className="flex items-center justify-between bg-base-300/50 rounded-b-md px-2 py-1.5 border-t border-foreground/10 mt-1">
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-md text-foreground-secondary hover:bg-base-300 hover:text-foreground transition-colors">
              <ImageIcon size={18} />
            </button>
            <button className="p-1.5 rounded-md text-foreground-secondary hover:bg-base-300 hover:text-foreground transition-colors">
              <Film size={18} />
            </button>
            <button className="p-1.5 rounded-md text-foreground-secondary hover:bg-base-300 hover:text-foreground transition-colors">
              <Smile size={18} />
            </button>
            <button className="p-1.5 rounded-md text-foreground-secondary hover:bg-base-300 hover:text-foreground transition-colors">
              <LinkIcon size={18} />
            </button>
          </div>
          <div className="text-2xs text-foreground-secondary pr-2 font-medium">
            {hasInstagram ? `${mediaCount}/10 ảnh (IG)` : ''}
          </div>
        </div>
      </div>
      
      {contentIssues.length > 0 && (
        <div className="flex flex-col gap-1 px-4 pb-3">
          {contentIssues.map((issue, idx) => (
            <span key={idx} className="text-xs font-medium text-error">{issue.message}</span>
          ))}
        </div>
      )}
    </div>
  );
}
