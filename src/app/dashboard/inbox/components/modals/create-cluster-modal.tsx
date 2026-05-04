'use client';

import React from 'react';
import { X, Check, Users } from 'lucide-react';
import { getPlatformAccountsAction } from '@/application/actions/platform-account.actions';
import { createAccountGroupAction } from '@/application/actions/account-group.actions';
import { PlatformAccount } from '@/domain/types/platform-account';
import { useInboxStore } from '../../store/inbox.store';
import { cn } from '@/lib/utils';

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
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-base-200 border border-foreground/10 rounded-[24px] w-[480px] max-w-[95vw] max-h-[90vh] flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-foreground">Tạo cụm tài khoản mới</h2>
          <button 
            className="p-1 rounded-lg text-foreground-tertiary hover:bg-white/5 hover:text-white transition-all"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-foreground-tertiary mb-2.5 uppercase tracking-wider">Tên cụm</label>
            <input 
              className="w-full bg-background-secondary border border-foreground/10 text-foreground"
              placeholder="Ví dụ: Cụm Influencers, Cụm Instagram..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-foreground-tertiary mb-2.5 uppercase tracking-wider">
              Chọn tài khoản ({selectedIds.length})
            </label>
            <div className="flex flex-col gap-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {isLoading ? (
                <div className="p-5 text-center text-foreground-tertiary">Đang tải danh sách...</div>
              ) : accounts.length === 0 ? (
                <div className="p-5 text-center text-foreground-tertiary">Không tìm thấy tài khoản nào.</div>
              ) : (
                accounts.map(acc => (
                  <div 
                    key={acc.id}
                    className={cn(
                      "flex items-center p-3 bg-white/[0.02] border border-white/[0.05] rounded-[12px] cursor-pointer transition-all hover:bg-white/[0.05] hover:border-white/10 select-none",
                      selectedIds.includes(acc.id) && "bg-violet-500/10 border-violet-500"
                    )}
                    onClick={() => toggleAccount(acc.id)}
                  >
                    <div className="w-8 h-8 rounded-full mr-3 shrink-0 flex items-center justify-center bg-background-tertiary text-foreground text-xs overflow-hidden">
                      {acc.metadata?.avatar_url ? (
                        <img src={acc.metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        acc.name?.[0] || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-base font-medium text-foreground truncate">{acc.name || acc.externalId}</span>
                      <span className="text-xs text-foreground-tertiary capitalize">{acc.platform}</span>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 border-white/10 flex items-center justify-center ml-3 transition-all shrink-0",
                      selectedIds.includes(acc.id) && "bg-accent-primary border-violet-500"
                    )}>
                      {selectedIds.includes(acc.id) && <Check size={12} color="#fff" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.05] flex justify-end gap-3">
          <button 
            className="px-5 py-2.5 rounded-[10px] text-sm font-medium bg-transparent border border-white/10 text-white transition-all hover:bg-white/5 active:scale-[0.98]" 
            onClick={onClose}
          >
            Hủy
          </button>
          <button 
            className="px-5 py-2.5 rounded-[10px] text-sm font-medium bg-accent-primary border-none text-white transition-all hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]" 
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
