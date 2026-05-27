import React from 'react';
import { MiddlePanel } from '@features/inbox/components/middle-panel';
import { createClient } from '@shared/api/supabase/server';
import { getWorkspaceRepository } from '@features/settings/repositories/workspace.repository';
import { redirect } from 'next/navigation';

import { InboxHeader } from './components/inbox-header';

export const metadata = {
  title: 'Inbox | Media Platform',
};

export default async function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Inbox Header riêng biệt */}
      <InboxHeader workspaceId={workspace.id} />

      <div className="flex flex-1 h-full w-full overflow-hidden relative">
        <MiddlePanel workspaceId={workspace.id} />
        <main className="flex-1 flex flex-col bg-transparent relative overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
