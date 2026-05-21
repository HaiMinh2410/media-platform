import React from 'react';
import { TypingUser } from '../../../hooks/use-presence-typing';

type TypingIndicatorListProps = {
  typingUsers: TypingUser[];
};

export function TypingIndicatorList({ typingUsers }: TypingIndicatorListProps) {
  if (typingUsers.length === 0) return null;

  return (
    <>
      {typingUsers.map((u) => (
        <div key={u.senderId} className="flex items-center gap-2.5 px-3 py-1.5 mt-2 animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center font-bold text-xs border border-foreground/10 overflow-hidden shrink-0 shadow-sm">
            {u.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              u.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-background-secondary border border-foreground/10 px-4 py-2 rounded-2xl max-w-[70%] shadow-sm">
            <span className="text-sm font-medium text-foreground-secondary">{u.name} đang soạn tin</span>
            <div className="flex gap-1 items-center ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary typing-dot" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
