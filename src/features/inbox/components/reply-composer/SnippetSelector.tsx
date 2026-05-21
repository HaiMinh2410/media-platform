'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { SNIPPETS } from './reply-composer-utils';

type SnippetSelectorProps = {
  onSnippetSelect: (text: string) => void;
};

export function SnippetSelector({ onSnippetSelect }: SnippetSelectorProps) {
  const [showSnippets, setShowSnippets] = useState(false);
  const snippetsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (snippetsRef.current && !snippetsRef.current.contains(event.target as Node)) {
        setShowSnippets(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSnippetClick = (text: string) => {
    onSnippetSelect(text);
    setShowSnippets(false);
  };

  return (
    <div className="relative" ref={snippetsRef}>
      <button 
        type="button" 
        className="bg-transparent border-none text-foreground-tertiary size-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-foreground/5"
        onClick={() => setShowSnippets(prev => !prev)}
        title="Saved Snippets"
      >
        <BookOpen size={18} />
      </button>
      
      {showSnippets && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-base-200 border border-foreground/10 rounded-md shadow-2xl z-100 py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-3 py-2 text-xs font-bold text-foreground-tertiary uppercase tracking-wider border-b border-foreground/5">
            Saved Snippets
          </div>
          <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10">
            {SNIPPETS.map(s => (
              <button 
                key={s.id} 
                type="button" 
                className="w-full px-3 py-2 flex flex-col gap-0.5 text-left hover:bg-foreground/5 transition-colors border-none bg-transparent cursor-pointer"
                onClick={() => handleSnippetClick(s.text)}
              >
                <span className="text-sm font-semibold text-foreground">{s.title}</span>
                <span className="text-xs text-foreground-tertiary truncate">{s.text.substring(0, 30)}...</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
