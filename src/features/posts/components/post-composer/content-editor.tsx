'use client';

import { cn } from "@shared/lib";
import { ValidationIssue } from "@shared/lib/validation/validation-engine";

import React, { useRef, useEffect } from 'react';
import { Image as ImageIcon, Film, Smile, Link as LinkIcon } from 'lucide-react';

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
        className="w-full min-h-36 bg-transparent border-0 p-4 text-sm text-base-content placeholder:text-base-content/40 focus:ring-0 focus:outline-none resize-none leading-relaxed"
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
      />
      
      <div className="flex flex-col gap-1 p-2 pt-0">
        <div className="flex flex-col items-end px-2">
          <span className={cn(
            "font-mono text-2xs",
            isError ? "text-error font-bold" : isWarning ? "text-warning" : "text-base-content/70"
          )}>
            {charCount} / {maxLength === Infinity ? '∞' : maxLength}
          </span>
          {platformCount > 1 && (
            <span className="text-2xs text-base-content/40 font-medium italic">
              * Giới hạn theo nền tảng khắt khe nhất
            </span>
          )}
        </div>

        <div className="flex items-center justify-between bg-base-300/40 rounded-b-2xl px-2 py-1.5 border-t border-base-content/5 mt-1">
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:bg-base-content/10 transition-colors cursor-pointer">
              <ImageIcon size={18} />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:bg-base-content/10 transition-colors cursor-pointer">
              <Film size={18} />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:bg-base-content/10 transition-colors cursor-pointer">
              <Smile size={18} />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:bg-base-content/10 transition-colors cursor-pointer">
              <LinkIcon size={18} />
            </button>
          </div>
          <div className="text-2xs text-base-content/50 pr-2 font-medium">
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
