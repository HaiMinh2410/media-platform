'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUserWorkspaceAction } from '@/application/actions/workspace.actions';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { InboxHeaderControls } from '@/app/dashboard/inbox/components/inbox-header-controls';

export function MainHeader({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const [userData, setUserData] = useState<{ name: string; avatar?: string | null } | null>(null);

  // Check if we are in the inbox section
  const isInbox = pathname.startsWith('/dashboard/inbox');

  useEffect(() => {
    getCurrentUserWorkspaceAction().then((res: any) => {
      if (res.data) {
        setUserData({
          name: res.data.user.name,
          avatar: res.data.user.avatar
        });
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-between px-6 h-[56px] border-b border-foreground/10 bg-background/80 backdrop-blur-xl sticky top-0 z-20 w-full gap-4">
      {/* Left section: Inbox specific controls or placeholder */}
      <div className="flex-1 flex items-center h-full">
        {isInbox && <InboxHeaderControls workspaceId={workspaceId} />}
      </div>

      {/* Right section: Global tools */}
      <div className="flex items-center gap-4 h-8">
        <ThemeSwitcher />
        <div className="w-9 h-9 rounded-full bg-background-tertiary flex items-center justify-center font-semibold text-foreground-secondary border border-foreground/10 shrink-0 overflow-hidden shadow-md">
          {userData?.avatar ? (
            <img src={userData.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            userData?.name?.charAt(0) || 'U'
          )}
        </div>
      </div>
    </div>
  );
}
