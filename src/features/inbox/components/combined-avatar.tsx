'use client';

import React from 'react';
import { AccountGroup } from '@features/settings';
import { AccountAvatar } from '@shared/ui';

interface CombinedAvatarProps {
  group: AccountGroup;
  unreadCount?: number;
}

export function CombinedAvatar({ group, unreadCount }: CombinedAvatarProps) {

  const accounts = group.members.map((m) => ({
    id: m.id,
    name: m.name,
    platform: m.platform,
    avatarUrl: m.avatar_url || m.metadata?.avatar_url,
  }));

  const visibleAccounts = accounts.slice(0, 2);
  const extraCount = accounts.length - 2;

  return (
    <div className="relative flex items-center transition-transform duration-200 group-hover:scale-105 shrink-0">
      <div className="avatar-group -space-x-5 rtl:space-x-reverse shrink-0">
        {visibleAccounts.map((acc, index) => (
          <AccountAvatar
            key={acc.id || index}
            avatarUrl={acc.avatarUrl}
            name={acc.name}
            size="sm"
            platform={acc.platform}
            showPlatformIcon={false}
            className="rounded-full"
          />
        ))}
        {extraCount > 0 && (
          <div className="avatar placeholder border-none">
            <div className="bg-base-100 text-neutral-content size-8 rounded-full flex items-center justify-center text-xs font-bold">
              +{extraCount}
            </div>
          </div>
        )}
      </div>
      {unreadCount !== undefined && unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-error text-error-content rounded-full border border-background z-10 text-3xs font-black flex items-center justify-center leading-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}
