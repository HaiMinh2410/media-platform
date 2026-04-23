import { redirect } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/server';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { BotConfigClient } from './bot-config-client';
import styles from './bot-page.module.css';
import Link from 'next/link';

export default async function BotConfigPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const accountId = params.id;
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const accountRepo = getPlatformAccountRepository();
  const { data: account, error } = await accountRepo.findById(accountId);

  if (error || !account) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Account not found.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard/settings/accounts" className={styles.backLink}>
            &larr; Back to Accounts
          </Link>
          <h1 className={styles.title}>Bot Configuration</h1>
          <p className={styles.subtitle}>
            Manage AI automation for <strong>{account.platform_user_name}</strong> ({account.platform})
          </p>
        </div>
      </header>

      <div className={styles.content}>
        <BotConfigClient accountId={accountId} />
      </div>
    </div>
  );
}
