'use client';

import { SlidingTabs } from "@shared/ui";
import { useRouter, usePathname } from 'next/navigation';
import { Settings, Terminal, Bot } from 'lucide-react';

export function SettingsTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const tabItems = [
    {
      value: "/dashboard/settings/accounts",
      label: "Tài khoản liên kết",
      icon: Settings,
    },
    {
      value: "/dashboard/settings/personas",
      label: "Quản lý Persona",
      icon: Bot,
    },
    {
      value: "/dashboard/settings/developer",
      label: "Nhà phát triển (Developer)",
      icon: Terminal,
    },
  ] as const;

  // Determine active tab value based on current pathname
  let activeValue: "/dashboard/settings/accounts" | "/dashboard/settings/personas" | "/dashboard/settings/developer" = "/dashboard/settings/accounts";
  
  if (pathname?.startsWith("/dashboard/settings/personas")) {
    activeValue = "/dashboard/settings/personas";
  } else if (pathname?.startsWith("/dashboard/settings/developer")) {
    activeValue = "/dashboard/settings/developer";
  }

  const handleChange = (value: string) => {
    router.push(value);
  };

  return (
    <div className="mb-8 border-b border-base-content/5 pb-4">
      <SlidingTabs
        items={tabItems}
        activeValue={activeValue}
        onChange={handleChange}
        size="md"
      />
    </div>
  );
}

