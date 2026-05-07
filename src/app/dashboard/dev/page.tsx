import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { db } from '@/lib/db';
import { DevPanel } from './dev-panel';

export default async function DevPage() {
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

  // Fetch connected platform accounts to use as recipients in webhooks testing
  const accounts = await db.platformAccount.findMany({
    where: { 
      workspaceId: workspace.id,
      disconnected_at: null
    },
    select: {
      id: true,
      platform: true,
      platform_user_id: true,
      platform_user_name: true
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-brand font-extrabold text-gradient mb-1">Developer API & Webhook Console</h1>
          <p className="text-foreground-secondary text-sm">
            Công cụ phát triển: Giả lập webhook, gửi payloads, theo dõi luồng sự kiện realtime và debug cơ sở dữ liệu.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-outline border-foreground/10 text-foreground-secondary font-mono text-2xs">
            SKIP_VERIFY: {process.env.SKIP_WEBHOOK_VERIFY || 'false'}
          </span>
          <span className="badge badge-success gap-1 text-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            Realtime Active
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <DevPanel 
          workspaceId={workspace.id} 
          connectedAccounts={accounts}
          verifyToken={process.env.META_WEBHOOK_VERIFY_TOKEN || ''}
        />
      </div>
    </div>
  );
}
