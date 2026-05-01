'use client';

import React from 'react';
import styles from './create-cluster-modal.module.css';
import { X, Check, Users } from 'lucide-react';
import { getPlatformAccountsAction } from '@/application/actions/platform-account.actions';
import { createAccountGroupAction } from '@/application/actions/account-group.actions';
import { PlatformAccount } from '@/domain/types/platform-account';
import { useInboxStore } from '../../store/inbox.store';
import clsx from 'clsx';

interface CreateClusterModalProps {
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClusterModal({ workspaceId, onClose, onCreated }: CreateClusterModalProps) {
  const [name, setName] = React.useState('');
  const [accounts, setAccounts] = React.useState<PlatformAccount[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    getPlatformAccountsAction(workspaceId).then(res => {
      if (res.data) setAccounts(res.data);
      setIsLoading(false);
    });
  }, [workspaceId]);

  const toggleAccount = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name || selectedIds.length === 0) return;

    setIsSubmitting(true);
    const res = await createAccountGroupAction(workspaceId, name, selectedIds);
    setIsSubmitting(false);

    if (res.data) {
      onCreated();
      onClose();
    } else {
      alert('Có lỗi xảy ra: ' + res.error);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Tạo cụm tài khoản mới</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên cụm</label>
            <input 
              className={styles.input}
              placeholder="Ví dụ: Cụm Influencers, Cụm Instagram..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Chọn tài khoản ({selectedIds.length})</label>
            <div className={styles.accountList}>
              {isLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Đang tải danh sách...</div>
              ) : accounts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Không tìm thấy tài khoản nào.</div>
              ) : (
                accounts.map(acc => (
                  <div 
                    key={acc.id}
                    className={clsx(styles.accountItem, selectedIds.includes(acc.id) && styles.selectedAccount)}
                    onClick={() => toggleAccount(acc.id)}
                  >
                    <div className={styles.avatar}>
                      {acc.metadata?.avatar_url ? (
                        <img src={acc.metadata.avatar_url} alt="" className={styles.avatar} style={{ margin: 0 }} />
                      ) : (
                        acc.name?.[0] || '?'
                      )}
                    </div>
                    <div className={styles.accountInfo}>
                      <span className={styles.accountName}>{acc.name || acc.externalId}</span>
                      <span className={styles.platform}>{acc.platform}</span>
                    </div>
                    <div className={styles.checkbox}>
                      {selectedIds.includes(acc.id) && <Check size={12} color="#fff" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>Hủy</button>
          <button 
            className={styles.submitButton} 
            disabled={!name || selectedIds.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo cụm'}
          </button>
        </div>
      </div>
    </div>
  );
}
