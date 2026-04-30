import React from 'react';
import { PlatformIcon } from './platform-icon';
import { cn } from '@/lib/utils';

type AccountBadgeProps = {
  platform: string;
  accountName: string;
  className?: string;
};

export const AccountBadge: React.FC<AccountBadgeProps> = ({ platform, accountName, className }) => {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
      "bg-bg-tertiary border border-glass-border",
      "transition-all hover:border-glass-border/40",
      className
    )}>
      <PlatformIcon platform={platform} size={12} />
      <span className="text-[10px] font-mono uppercase tracking-wider text-fg-secondary font-bold">
        {accountName}
      </span>
    </div>
  );
};
