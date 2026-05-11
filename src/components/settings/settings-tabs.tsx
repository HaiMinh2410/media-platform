'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Terminal, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-foreground/10 mb-8 gap-6">
      <Link
        href="/dashboard/settings/accounts"
        className={cn(
          "pb-3.5 text-sm font-semibold border-b-2 transition-all no-underline flex items-center gap-2",
          pathname === '/dashboard/settings/accounts'
            ? "border-primary text-primary"
            : "border-transparent text-foreground-tertiary hover:text-foreground-secondary"
        )}
      >
        <Icon lucide={Settings} size={15} />
        Tài khoản liên kết
      </Link>
      <Link
        href="/dashboard/settings/personas"
        className={cn(
          "pb-3.5 text-sm font-semibold border-b-2 transition-all no-underline flex items-center gap-2",
          pathname?.startsWith('/dashboard/settings/personas')
            ? "border-primary text-primary"
            : "border-transparent text-foreground-tertiary hover:text-foreground-secondary"
        )}
      >
        <Icon lucide={Bot} size={15} />
        Quản lý Persona
      </Link>
      <Link
        href="/dashboard/settings/developer"
        className={cn(
          "pb-3.5 text-sm font-semibold border-b-2 transition-all no-underline flex items-center gap-2",
          pathname === '/dashboard/settings/developer'
            ? "border-primary text-primary"
            : "border-transparent text-foreground-tertiary hover:text-foreground-secondary"
        )}
      >
        <Icon lucide={Terminal} size={15} />
        Nhà phát triển (Developer)
      </Link>
    </div>
  );
}
