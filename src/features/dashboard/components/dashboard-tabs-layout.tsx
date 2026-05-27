'use client';

import React, { startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@shared/lib/utils';

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
          <div className="flex bg-base-100/60 backdrop-blur-md p-1 rounded-xl border border-base-content/10 shadow-xs shrink-0 self-start sm:self-center">
            <button
              onClick={() => handleTabChange('overview')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer",
                activeTab === 'overview'
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/60 hover:text-base-content/80"
              )}
            >
              <LayoutDashboard size={14} />
              Tổng quan
            </button>
            <button
              onClick={() => handleTabChange('leads')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer",
                activeTab === 'leads'
                  ? "bg-primary text-primary-content shadow-xs"
                  : "text-base-content/60 hover:text-base-content/80"
              )}
            >
              <Users size={14} />
              Khách hàng tiềm năng
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
