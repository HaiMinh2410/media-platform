'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bot, Settings2, User2, MessageCircle } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import Image from 'next/image';

type AccountWithPersona = {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_user_name: string;
  metadata?: any;
  ai_personas?: {
    name: string;
    campaign_name: string | null;
    updated_at: Date;
  } | null;
};

interface PersonaListProps {
  accounts: any[];
}

export function PersonaList({ accounts }: PersonaListProps) {
  if (!accounts || accounts.length === 0) {
    return (
      <div className="p-8 text-center bg-foreground/[0.02] border border-foreground/10 rounded-2xl">
        <p className="text-foreground-secondary">Chưa có tài khoản nào được kết nối.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => {
        const persona = account.ai_personas;
        const avatarUrl = account.metadata?.profile_picture_url || '/default-avatar.png';
        const isInstagram = account.platform === 'instagram';

        return (
          <Link
            key={account.id}
            href={`/dashboard/settings/personas/${account.id}`}
            className="group flex flex-col p-6 bg-foreground/[0.02] hover:bg-foreground/[0.04] border border-foreground/10 hover:border-primary/30 rounded-2xl transition-all duration-300 no-underline relative overflow-hidden backdrop-blur-xl"
          >
            {/* Glassmorphism shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-foreground/10 relative group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={avatarUrl}
                      alt={account.platform_user_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + account.platform_user_name + '&background=random';
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center shadow-sm">
                    {isInstagram ? (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-500 flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold font-sans tracking-tighter">ig</span>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-[9px] text-white font-bold font-serif">f</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground m-0 group-hover:text-primary transition-colors">
                    {account.platform_user_name}
                  </h3>
                  <p className="text-xs text-foreground-tertiary">
                    {account.platform === 'instagram' ? 'Instagram' : 'Facebook Page'}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Icon lucide={Settings2} size={16} />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Icon lucide={Bot} size={14} className="text-primary/70" />
                  <span>Persona:</span>
                </div>
                <span className="font-medium text-foreground">
                  {persona?.name || 'Mặc định (Em)'}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Icon lucide={MessageCircle} size={14} className="text-emerald-500/70" />
                  <span>Chiến dịch:</span>
                </div>
                <span className="font-medium text-foreground truncate max-w-[120px]" title={persona?.campaign_name || 'Chưa thiết lập'}>
                  {persona?.campaign_name || 'Chưa thiết lập'}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Icon lucide={User2} size={14} className="text-blue-500/70" />
                  <span>Conversion:</span>
                </div>
                <span className="font-medium text-foreground">
                  {/* Mock Conversion Rate for MVP */}
                  {persona ? '12.5%' : 'N/A'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-foreground/10 flex items-center justify-between">
              <span className="text-xs text-foreground-tertiary">
                Cập nhật:{' '}
                {persona?.updated_at
                  ? formatDistanceToNow(new Date(persona.updated_at), { addSuffix: true, locale: vi })
                  : 'Chưa có dữ liệu'}
              </span>
              <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                Cấu hình →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
