import { Icon } from "@shared/ui";

import { redirect } from "next/navigation";
import { createClient } from "@shared/api/supabase/server";
import { getWorkspaceRepository } from "@features/settings/repositories/workspace.repository";
import { getPlatformAccountRepository } from "@features/settings/repositories/platform-account.repository";
import { ConnectButtons } from "@features/settings/components/connect-buttons";
import { AccountsList } from "@features/settings/components/accounts-list";
import { PurgeAccountsButton } from "@features/settings/components/purge-accounts-button";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default async function AccountsSettingsPage(props: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const workspaceRepo = getWorkspaceRepository();
  const accountRepo = getPlatformAccountRepository();

  // For MVP, we use the first workspace found for the user
  const { data: workspace, error: wsError } =
    await workspaceRepo.findFirstByUserId(user.id);

  if (wsError || !workspace) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto shadow-sm">
        <AlertCircle size={20} className="shrink-0" />
        <span>No workspace found. Please contact support or try reconnecting.</span>
      </div>
    );
  }

  // Fetch connected accounts
  const { data: accounts = [], error: accError } =
    await accountRepo.findByWorkspaceId(workspace.id);

  return (
    <div className="flex flex-col gap-6">
      {searchParams.success && (
        <div className="alert alert-success mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>Account connected successfully!</span>
        </div>
      )}

      {searchParams.error && (
        <div className="alert alert-error mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle size={20} className="shrink-0" />
          <span>Failed to connect account: {searchParams.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <section className="card rounded-2xl bg-base-100 border border-base-content/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="card-title text-2xl font-bold tracking-tight text-base-content m-0">Connected Accounts</h2>
              <span className="badge badge-xl text-success font-bold font-mono border-none">
                {accounts?.length || 0}
              </span>
            </div>
            <AccountsList accounts={accounts || []} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card rounded-2xl bg-base-100 border border-base-content/5 p-6">
            <h2 className="card-title text-lg font-bold tracking-tight text-base-content mb-2">Add New Connection</h2>
            <p className="text-base-content/70 text-xs mb-6 leading-relaxed">
              Connect your professional accounts to enable unified messaging and
              AI automation.
            </p>
            <ConnectButtons workspaceId={workspace.id} />
          </section>

          <section className="card rounded-2xl bg-base-100 border border-base-content/5 p-6">
            <h2 className="card-title text-lg font-bold tracking-tight text-base-content mb-2">Quản lý dữ liệu</h2>
            <p className="text-base-content/70 text-xs mb-4 leading-relaxed">
              Hệ thống tự động đồng bộ tài khoản theo Access Token mới nhất. Các
              tài khoản không còn quyền truy cập sẽ bị chuyển sang trạng thái
              "Ngắt kết nối".
            </p>
            <div className="space-y-3">
              <PurgeAccountsButton workspaceId={workspace.id} />
              <p className="text-2xs text-base-content/40 text-center">
                * Dữ liệu hội thoại của tài khoản bị xóa sẽ không thể phục hồi.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

