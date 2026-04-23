import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { PlatformAccountResult } from '@/domain/types/platform-account';

import styles from './accounts-list.module.css';

type AccountsListProps = {
  accounts: PlatformAccountResult[];
};

export function AccountsList({ accounts }: AccountsListProps) {
  if (accounts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No accounts connected yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {accounts.map((account) => (
        <Card key={account.id} className={styles.accountCard}>
          <div className={styles.header}>
            <div className={styles.platformIcon}>
              {account.platform === 'facebook' && (
                <div className={`${styles.iconCircle} ${styles.fb}`}>FB</div>
              )}
              {account.platform === 'instagram' && (
                <div className={`${styles.iconCircle} ${styles.ig}`}>IG</div>
              )}
              {account.platform === 'tiktok' && (
                <div className={`${styles.iconCircle} ${styles.tt}`}>TT</div>
              )}
            </div>
            <div className={styles.info}>
              <h4 className={styles.name}>{account.name}</h4>
              <p className={styles.platformName}>{account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</p>
            </div>
            <div className={styles.status}>
              <span className={styles.badge}>Active</span>
              <Link href={`/dashboard/settings/accounts/${account.id}/bot`} className={styles.configBtn}>
                Configure Bot
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
