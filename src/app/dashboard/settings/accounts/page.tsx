import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { ConnectButtons } from '@/components/settings/connect-buttons';
import { AccountsList } from '@/components/settings/accounts-list';
import styles from './accounts-page.module.css';

export default async function AccountsSettingsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
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
      <div className={styles.container}>
        <h1 className={styles.title}>Settings</h1>
        <div className={styles.error}>
          <p>No workspace found. please contact support or try reconnecting.</p>
        </div>
      </div>
    );
  }

  // Fetch connected accounts
  const { data: accounts = [], error: accError } = await accountRepo.findByWorkspaceId(workspace.id);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Connected Accounts</h1>
          <p className={styles.subtitle}>Manage your social media integrations and automation settings.</p>
        </div>
      </header>

      {searchParams.success && (
        <div className={styles.alertSuccess}>
          Account connected successfully!
        </div>
      )}

      {searchParams.error && (
        <div className={styles.alertError}>
          Failed to connect account: {searchParams.error}
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Accounts</h2>
        <AccountsList accounts={accounts || []} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Add New Connection</h2>
        <ConnectButtons workspaceId={workspace.id} />
      </section>
    </div>
  );
}
