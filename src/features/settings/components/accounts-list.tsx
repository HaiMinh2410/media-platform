'use client';

import { cn } from "@shared/lib";
import { ConfirmDialog, AccountAvatar } from "@shared/ui";
import Link from 'next/link';
import { PlatformAccount } from '../types/platform-account';
import { disconnectAccountAction } from '@features/settings/actions/platform-account.actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Unplug, Bot } from 'lucide-react';

type AccountsListProps = {
  accounts: PlatformAccount[];
};

function getClusters(accounts: PlatformAccount[]): PlatformAccount[][] {
  const visited = new Set<string>();
  const clusters: PlatformAccount[][] = [];

  const fbAccounts = accounts.filter(a => a.platform === 'facebook');
  const igAccounts = accounts.filter(a => a.platform === 'instagram');
  const otherAccounts = accounts.filter(a => a.platform !== 'facebook' && a.platform !== 'instagram');

  // 1. Ghép cặp Facebook và Instagram
  for (const fb of fbAccounts) {
    if (visited.has(fb.id)) continue;

    const fbMeta = fb.metadata as any;
    const linkedIgId = fbMeta?.instagram_id;

    // Tìm Instagram account tương ứng
    const matchingIg = igAccounts.find(ig => {
      if (visited.has(ig.id)) return false;
      const igMeta = ig.metadata as any;
      const igLinkedFbId = igMeta?.facebook_page_id;

      return (
        (linkedIgId && ig.externalId === linkedIgId) ||
        (igLinkedFbId && fb.externalId === igLinkedFbId)
      );
    });

    if (matchingIg) {
      clusters.push([fb, matchingIg]);
      visited.add(fb.id);
      visited.add(matchingIg.id);
    } else {
      clusters.push([fb]);
      visited.add(fb.id);
    }
  }

  // 2. Gom các Instagram lẻ loi
  for (const ig of igAccounts) {
    if (!visited.has(ig.id)) {
      clusters.push([ig]);
      visited.add(ig.id);
    }
  }

  // 3. Gom các tài khoản khác (tiktok, etc.)
  for (const other of otherAccounts) {
    clusters.push([other]);
  }

  // Sắp xếp các clusters theo bảng chữ cái của tên tài khoản đầu tiên trong cluster
  clusters.sort((a, b) => {
    const nameA = a[0]?.name || '';
    const nameB = b[0]?.name || '';
    return nameA.localeCompare(nameB, 'vi');
  });

  return clusters;
}

export function AccountsList({ accounts }: AccountsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pendingDisconnectId, setPendingDisconnectId] = useState<string | null>(null);

  const triggerDisconnect = (id: string) => {
    setPendingDisconnectId(id);
    if (typeof document !== 'undefined') {
      const modal = document.getElementById('disconnect-confirm-modal') as HTMLDialogElement;
      modal?.showModal();
    }
  };

  const handleDisconnect = async () => {
    if (!pendingDisconnectId) return;
    
    const id = pendingDisconnectId;
    setLoadingId(id);
    const result = await disconnectAccountAction(id);
    setLoadingId(null);
    setPendingDisconnectId(null);

    if (result.success) {
      router.refresh();
    } else {
      alert('Failed to disconnect: ' + result.error);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center text-base-content/50 bg-base-200/30 border border-dashed border-base-content/10 rounded-2xl">
        <p className="text-sm">No accounts connected yet.</p>
      </div>
    );
  }

  const clusters = getClusters(accounts);

  return (
    <div className="flex flex-col gap-2">
      {clusters.map((cluster, clusterIdx) => (
        <div key={clusterIdx} className="card rounded-xl bg-base-200/40 border border-base-content/5 overflow-hidden transition-all duration-200 flex flex-col">
          {cluster.map((account, idx) => (
            <div 
              key={account.id} 
              className={cn(
                "relative p-4 flex items-center gap-4 transition-colors duration-200 hover:bg-base-200/30",
                idx > 0 && "border-t border-base-content/5"
              )}
            >
              <AccountAvatar
                avatarUrl={account.avatar_url}
                name={account.name}
                platform={account.platform}
                size="lg"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-base-content leading-snug">{account.name}</h4>
                <p className="text-sm text-base-content/50 mt-1 capitalize">{account.platform}</p>
              </div>
              <div className="flex">
                <button 
                  onClick={() => triggerDisconnect(account.id)}
                  disabled={loadingId === account.id}
                  className="btn btn-xs btn-ghost text-error shadow-none rounded-full size-8 p-0 flex items-center justify-center"
                  title="Ngắt kết nối"
                >
                  {loadingId === account.id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Unplug size={16} />
                  )}
                </button>
                <Link 
                  href={`/dashboard/settings/accounts/${account.id}/bot`} 
                  className="btn btn-xs btn-ghost text-primary shadow-none rounded-full size-8 p-0 flex items-center justify-center no-underline"
                  title="Cấu hình Bot AI"
                >
                  <Bot size={20} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ))}

      <ConfirmDialog 
        id="disconnect-confirm-modal"
        title="Ngắt kết nối tài khoản"
        description="Bạn có chắc chắn muốn ngắt kết nối tài khoản này? Trạng thái tài khoản sẽ chuyển sang ngắt hoạt động và không thể tiếp tục nhận tin nhắn."
        confirmText="Ngắt kết nối"
        cancelText="Hủy"
        confirmBtnClass="btn-error"
        onConfirm={handleDisconnect}
      />
    </div>
  );
}

