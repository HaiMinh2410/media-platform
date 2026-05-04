import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { ConnectButtons } from '@/components/settings/connect-buttons';
import { AccountsList } from '@/components/settings/accounts-list';
import { Icon } from '@/components/ui/icon';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function AccountsSettingsPage(props: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const accountRepo = getPlatformAccountRepository();

  // For MVP, we use the first workspace found for the user
  const { data: workspace, error: wsError } = await workspaceRepo.findFirstByUserId(user.id);

  if (wsError || !workspace) {
    // Handle case where user has no workspace (should ideally be handled during signup)
    return (
      <div className="max-w-[1000px] mx-auto p-10 md:py-12">
        <h1 className="text-[2.5rem] font-extrabold mb-8 tracking-tight">Settings</h1>
        <div className="p-8 text-center bg-error/5 border border-error/10 rounded-2xl">
          <p className="text-foreground-secondary">No workspace found. please contact support or try reconnecting.</p>
        </div>
      </div>
    );
  }

  // Fetch connected accounts
  const { data: accounts = [], error: accError } = await accountRepo.findByWorkspaceId(workspace.id);

  return (
    <div className="max-w-[1000px] mx-auto p-10 md:py-12">
      <header className="mb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-[2.5rem] font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground-secondary bg-clip-text text-transparent m-0 mb-2">Platform Connections</h1>
          <p className="text-foreground-secondary text-[1.1rem]">Manage your social media integrations and unified inbox settings.</p>
        </div>
      </header>

      {searchParams.success && (
        <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl mb-6 flex items-center gap-2.5 font-medium animate-in fade-in slide-in-from-top-2">
          <Icon lucide={CheckCircle2} size={20} />
          Account connected successfully!
        </div>
      )}

      {searchParams.error && (
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl mb-6 flex items-center gap-2.5 font-medium animate-in fade-in slide-in-from-top-2">
          <Icon lucide={AlertCircle} size={20} />
          Failed to connect account: {searchParams.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <section className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[1.25rem] font-semibold m-0">Connected Accounts</h2>
              <span className="bg-foreground/10 px-3 py-1 rounded-full text-[0.85rem] font-semibold">{accounts?.length || 0}</span>
            </div>
            <AccountsList accounts={accounts || []} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl">
            <h2 className="text-[1.25rem] font-semibold mb-2">Add New Connection</h2>
            <p className="text-foreground-tertiary text-[0.95rem] mb-6 leading-relaxed">Connect your professional accounts to enable unified messaging and AI automation.</p>
            <ConnectButtons workspaceId={workspace.id} />
          </section>

          <section className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl opacity-80">
            <h2 className="text-base font-semibold mb-2 text-foreground-secondary">Developer Tools</h2>
            <p className="text-foreground-tertiary text-[0.8rem] mb-4">Manually update tokens or debug connection issues.</p>
            <Link 
              href="/dashboard/settings/accounts/debug" 
              className="inline-block text-primary font-semibold text-[0.9rem] no-underline transition-all hover:opacity-80 hover:translate-x-1"
            >
              Open Debug Connection Tool
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
