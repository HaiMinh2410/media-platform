import React from 'react';

type SystemMessageProps = {
  content: string;
  onViewAllPinned: () => void;
};

export function SystemMessage({ content, onViewAllPinned }: SystemMessageProps) {
  return (
    <div className="flex justify-center items-center my-1.5 select-none animate-in fade-in duration-300">
      <span className="text-xs font-medium text-foreground-secondary/75 flex items-center gap-1.5">
        <span>{content}</span>
        <button
          onClick={onViewAllPinned}
          className="text-primary transition-colors hover:underline cursor-pointer border-0 bg-transparent p-0"
        >
          Xem tất cả
        </button>
      </span>
    </div>
  );
}
