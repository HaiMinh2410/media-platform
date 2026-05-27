'use client';

import React, { startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';
import { SlidingTabs } from '@shared/ui/sliding-tabs';

interface DashboardTabsLayoutProps {
  activeTab: 'overview' | 'leads';
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

  const handleTabChange = (tab: 'overview' | 'leads') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col w-full">
      <div className="p-6 xl:p-7 pb-12 xl:pb-16 space-y-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
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
              { value: 'leads', label: 'Khách hàng tiềm năng', icon: Users }
            ]}
            activeValue={activeTab}
            onChange={handleTabChange}
            size="md"
            layoutId="dashboardMainTabs"
            className="self-start sm:self-center shrink-0"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
