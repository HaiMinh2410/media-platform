'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { PlatformAccount } from '@/domain/types/platform-account';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { disconnectAccountAction } from '@/application/actions/platform-account.actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AccountsListProps = {
  accounts: PlatformAccount[];
};

export function AccountsList({ accounts }: AccountsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account? It will be moved to inactive state.')) return;
    
    setLoadingId(id);
    const result = await disconnectAccountAction(id);
    setLoadingId(null);

    if (result.success) {
      router.refresh();
    } else {
      alert('Failed to disconnect: ' + result.error);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center text-foreground-tertiary bg-foreground/[0.02] border border-dashed border-foreground/10 rounded-2xl">
        <p>No accounts connected yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {accounts.map((account) => (
        <Card key={account.id} className="bg-foreground/[0.02] border-foreground/5 p-4 transition-all duration-200 hover:bg-foreground/[0.04] hover:border-foreground/10">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {account.platform === 'facebook' && (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md bg-gradient-to-br from-facebook to-[#166ada] text-white">FB</div>
              )}
              {account.platform === 'instagram' && (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white">IG</div>
              )}
              {account.platform === 'tiktok' && (
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md bg-neutral border border-foreground/10 text-neutral-content">TT</div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold m-0 text-foreground leading-snug">{account.name}</h4>
              <p className="text-sm text-foreground-tertiary m-0 capitalize leading-tight">{account.platform}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider">Active</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDisconnect(account.id)}
                  isLoading={loadingId === account.id}
                  className="text-xs font-semibold h-8"
                >
                  Disconnect
                </Button>
                <Link 
                  href={`/dashboard/settings/accounts/${account.id}/bot`} 
                  className="inline-flex items-center justify-center text-xs font-bold text-primary no-underline px-3 h-8 rounded-lg bg-primary/10 border border-primary/20 transition-all hover:bg-primary/20 hover:border-primary/30"
                >
                  Bot Settings
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
