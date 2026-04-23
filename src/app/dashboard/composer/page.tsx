import React from 'react';
import { createClient } from '@/infrastructure/supabase/server';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { PostComposerRoot } from '@/components/post-composer/post-composer-root';
import { redirect } from 'next/navigation';

export default async function ComposerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">No workspace found. Please create one first.</p>
      </div>
    );
  }

  const accountRepo = getPlatformAccountRepository();
  const { data: accounts } = await accountRepo.findByWorkspaceId(workspace.id);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PostComposerRoot 
        accounts={accounts || []} 
        workspaceId={workspace.id} 
      />
    </div>
  );
}
