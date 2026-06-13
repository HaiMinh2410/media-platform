import { redirect } from 'next/navigation';
import { createClient } from '@shared/api/supabase/server';
import { getWorkspaceRepository } from '@features/settings/repositories/workspace.repository';
import { getPlatformAccountRepository } from '@features/settings/repositories/platform-account.repository';
import { MetaTokenUpserter } from '@features/settings/components/meta-token-upserter';
import { LinkedTokensList } from '@features/settings/components/linked-tokens-list';
import { DeveloperTools } from '@features/settings/components/developer-tools';
import { AlertCircle } from 'lucide-react';

export default async function DeveloperSettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace, error: wsError } = await workspaceRepo.findFirstByUserId(user.id);

  if (wsError || !workspace) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto shadow-sm">
        <AlertCircle size={20} className="shrink-0" />
        <span>No workspace found. Please contact support or try reconnecting.</span>
      </div>
    );
  }

  // Fetch all accounts with tokens for developer info
  const platformRepo = getPlatformAccountRepository();
  const { data: accounts = [] } = await platformRepo.findWithTokensByWorkspaceId(workspace.id);

  return (
    <div className="flex flex-col gap-8">
      {/* Linked Tokens & IDs Info */}
      <LinkedTokensList accounts={accounts as any} />
      
      {/* Manual Token Updater Tool */}
      <MetaTokenUpserter />

      {/* Detailed visual navigation cards for developer features */}
      <DeveloperTools 
        workspaceId={workspace.id} 
        accounts={accounts as any} 
        verifyToken={process.env.META_WEBHOOK_VERIFY_TOKEN || ''}
      />
    </div>
  );
}
