'use client';

import React from 'react';
import { AccountGroup, PlatformAccount } from '@features/settings';

interface CombinedAvatarProps {
  group: AccountGroup;
  unreadCount?: number;
}

export function CombinedAvatar({ group, unreadCount }: CombinedAvatarProps) {
  const fbAccount = group.members.find((m: PlatformAccount) => m.platform === 'facebook');
  const igAccount = group.members.find((m: PlatformAccount) => m.platform === 'instagram');

  const renderAvatar = (account: PlatformAccount | undefined, isSub = false) => {
    if (!account) return null;
    const avatarUrl = account.metadata?.avatar_url;
    const initial = account.name?.[0] || '?';

    return (
      <div className={isSub ? "w-[18px] h-[18px] rounded-sm overflow-hidden border-[1.5px] border-background bg-background-tertiary z-3 absolute -bottom-0.5 -right-0.5 shadow-md transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[2px]" : "w-6 h-6 rounded-md overflow-hidden border-[1.5px] border-background bg-background-secondary z-2 absolute top-0 left-0 shadow-sm"}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover transition-all duration-200 group-hover:brightness-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-foreground/15 to-foreground/5 text-foreground font-bold text-xs uppercase rounded-inherit" style={isSub ? { fontSize: '0.5rem' } : {}}>
            {initial}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-7 h-7 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
      {fbAccount && renderAvatar(fbAccount)}
      {igAccount && renderAvatar(igAccount, true)}
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 min-w-md h-4 px-1 bg-error text-error-content rounded-full border-[1.5px] border-background z-4 shadow-md shadow-error/20 text-3xs font-extrabold flex items-center justify-center leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}
