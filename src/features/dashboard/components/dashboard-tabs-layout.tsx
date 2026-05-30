'use client';

import React, { startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Users, LineChart } from 'lucide-react';
import { SlidingTabs } from '@shared/ui/sliding-tabs';

import { cn } from '@shared/lib/utils';

interface DashboardTabsLayoutProps {
  activeTab: 'overview' | 'leads' | 'insights';
  workspaceName: string;
  children: React.ReactNode;
}

export function DashboardTabsLayout({
  activeTab,
  workspaceName,
  children,
}: DashboardTabsLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isBulkEditing, setIsBulkEditing] = React.useState(false);

  React.useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsBulkEditing(!!customEvent.detail?.isBulkEditing);
    };

    window.addEventListener('toggle-bulk-edit', handleToggle);
    return () => {
      window.removeEventListener('toggle-bulk-edit', handleToggle);
    };
  }, []);

  const handleTabChange = (tab: 'overview' | 'leads' | 'insights') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      className={cn(
        "bg-base-200 flex flex-col w-full transition-all duration-300",
        activeTab === 'leads' ? "h-full overflow-hidden" : "min-h-screen",
        isBulkEditing && 'pr-[340px]'
      )}
    >
      <div
        className={cn(
          "p-6 xl:p-7 space-y-6 w-full flex-1 flex flex-col transition-all duration-300 min-h-0",
          activeTab === 'leads' ? "pb-4 xl:pb-6" : "pb-12 xl:pb-16",
          isBulkEditing ? 'max-w-full mx-0 pr-0 xl:pr-0' : 'max-w-[1600px] mx-auto'
        )}
      >
        {/* Dashboard Unified Header with Bento Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-content/5 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-base-content uppercase font-brand">
              Dashboard
            </h1>
            <p className="text-xs text-base-content/60 font-medium mt-1">
              Hệ thống quản lý và tối ưu hóa vận hành AI toàn diện • {workspaceName}
            </p>
          </div>

          {/* Bento Tabs Switcher */}
          <SlidingTabs
            items={[
              { value: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
              { value: 'leads', label: 'Khách hàng tiềm năng', icon: Users },
              { value: 'insights', label: 'Thông tin chi tiết', icon: LineChart }
            ]}
            activeValue={activeTab}
            onChange={handleTabChange}
            size="md"
            layoutId="dashboardMainTabs"
            className="self-start sm:self-center shrink-0"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col w-full min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
