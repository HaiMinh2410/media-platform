import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { ConnectButtons } from '@/components/settings/connect-buttons';
import { AccountsList } from '@/components/settings/accounts-list';
import styles from './accounts-page.module.css';

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
          <h1 className={`${styles.title} text-gradient`}>Platform Connections</h1>
          <p className={styles.subtitle}>Manage your social media integrations and unified inbox settings.</p>
        </div>
      </header>

      {searchParams.success && (
        <div className={styles.alertSuccess}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Account connected successfully!
        </div>
      )}

      {searchParams.error && (
        <div className={styles.alertError}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Failed to connect account: {searchParams.error}
        </div>
      )}

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <section className={`${styles.section} glass`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Connected Accounts</h2>
              <span className={styles.countBadge}>{accounts.length}</span>
            </div>
            <AccountsList accounts={accounts || []} />
          </section>
        </div>

        <div className={styles.rightCol}>
          <section className={`${styles.section} glass`}>
            <h2 className={styles.sectionTitle}>Add New Connection</h2>
            <p className={styles.sectionDesc}>Connect your professional accounts to enable unified messaging and AI automation.</p>
            <ConnectButtons workspaceId={workspace.id} />
          </section>

          <section className={`${styles.section} glass`} style={{ marginTop: '24px', opacity: 0.8 }}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)' }}>Developer Tools</h2>
            <p className={styles.sectionDesc} style={{ fontSize: '0.8rem' }}>Manually update tokens or debug connection issues.</p>
            <Link 
              href="/dashboard/settings/accounts/debug" 
              className={styles.debugLink}
            >
              Open Debug Connection Tool
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
