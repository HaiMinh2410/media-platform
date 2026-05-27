'use client';

import React from 'react';
import { InboxHeaderControls } from '@features/inbox/components/inbox-header-controls';

interface InboxHeaderProps {
  workspaceId: string;
}

export function InboxHeader({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="flex items-center px-6  h-[64px] border-b-2 border-background-secondary bg-background/80 backdrop-blur-xl sticky top-0 z-20 w-full shrink-0">
      <InboxHeaderControls workspaceId={workspaceId} />
    </div>
  );
}
