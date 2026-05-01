import React from 'react';
import styles from './inbox.module.css';
import { MiddlePanel } from './components/middle-panel';
import { SecondaryHeader } from './components/secondary-header';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { redirect } from 'next/navigation';

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
    <div className={styles.inboxContainer}>
      <SecondaryHeader workspaceId={workspace.id} />
      <div className={styles.inboxContent}>
        <MiddlePanel workspaceId={workspace.id} />
        <main className={styles.chatArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
