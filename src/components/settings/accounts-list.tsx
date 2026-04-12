import React from 'react';
import { Card } from '@/components/ui/card';
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
              {account.platform === 'FACEBOOK' && (
                <div className={`${styles.iconCircle} ${styles.fb}`}>FB</div>
              )}
              {account.platform === 'INSTAGRAM' && (
                <div className={`${styles.iconCircle} ${styles.ig}`}>IG</div>
              )}
              {account.platform === 'TIKTOK' && (
                <div className={`${styles.iconCircle} ${styles.tt}`}>TT</div>
              )}
            </div>
            <div className={styles.info}>
              <h4 className={styles.name}>{account.name}</h4>
              <p className={styles.platformName}>{account.platform}</p>
            </div>
            <div className={styles.status}>
              <span className={styles.badge}>Active</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
