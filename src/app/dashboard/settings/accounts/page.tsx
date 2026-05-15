import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { ConnectButtons } from '@/components/settings/connect-buttons';
import { AccountsList } from '@/components/settings/accounts-list';
import { PurgeAccountsButton } from '@/components/settings/purge-accounts-button';
import { Icon } from '@/components/ui/icon';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default async function AccountsSettingsPage(props: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const accountRepo = getPlatformAccountRepository();

  // For MVP, we use the first workspace found for the user
  const { data: workspace, error: wsError } = await workspaceRepo.findFirstByUserId(user.id);

  if (wsError || !workspace) {
    return (
      <div className="p-8 text-center bg-error/5 border border-error/10 rounded-2xl">
        <p className="text-foreground-secondary">No workspace found. Please contact support or try reconnecting.</p>
      </div>
    );
  }

  // Fetch connected accounts
  const { data: accounts = [], error: accError } = await accountRepo.findByWorkspaceId(workspace.id);

  return (
    <div className="flex flex-col gap-6">
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
              <h2 className="text-xl font-semibold m-0">Connected Accounts</h2>
              <span className="bg-foreground/10 px-3 py-1 rounded-full text-sm font-semibold">
                {accounts?.length || 0}
              </span>
            </div>
            <AccountsList accounts={accounts || []} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-2">Add New Connection</h2>
            <p className="text-foreground-tertiary text-base mb-6 leading-relaxed">
              Connect your professional accounts to enable unified messaging and AI automation.
            </p>
            <ConnectButtons workspaceId={workspace.id} />
          </section>

          <section className="p-6 rounded-2xl bg-foreground/[0.02] border border-foreground/10 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-2">Quản lý dữ liệu</h2>
            <p className="text-foreground-tertiary text-sm mb-4 leading-relaxed">
              Hệ thống tự động đồng bộ tài khoản theo Access Token mới nhất. Các tài khoản không còn quyền truy cập sẽ bị chuyển sang trạng thái "Ngắt kết nối".
            </p>
            <div className="space-y-3">
              <PurgeAccountsButton workspaceId={workspace.id} />
              <p className="text-[10px] text-foreground-tertiary text-center italic">
                * Dữ liệu hội thoại của tài khoản bị xóa sẽ không thể phục hồi.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
