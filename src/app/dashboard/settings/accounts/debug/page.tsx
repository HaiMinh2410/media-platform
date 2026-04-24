import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { DebugForm } from './debug-form';
import Link from 'next/link';

export default async function DebugConnectPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    redirect('/dashboard/settings/accounts');
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <Link 
          href="/dashboard/settings/accounts" 
          className="text-primary text-sm hover:underline mb-4 inline-block"
        >
          ← Back to Connections
        </Link>
        <h1 className="text-3xl font-bold text-gradient mb-2">Debug Connection Tool</h1>
        <p className="text-white/60">
          Use this tool to manually connect accounts by pasting an Access Token and Platform ID. 
          Useful for development and troubleshooting permission issues.
        </p>
      </header>

      <div className="glass p-8 rounded-2xl">
        <DebugForm workspaceId={workspace.id} />
      </div>

      <footer className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <h4 className="text-yellow-500 font-semibold mb-2 flex items-center gap-2">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Important Note
        </h4>
        <p className="text-yellow-500/80 text-sm leading-relaxed">
          For Instagram, ensure you use the <strong>Instagram Business Account ID</strong> (not the Page ID) and a 
          <strong>Page Access Token</strong> that has been granted `instagram_manage_messages` permission.
        </p>
      </footer>
    </div>
  );
}
