import React, { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@shared/api/supabase/server';
import { redirect } from 'next/navigation';
import { getWorkspaceRepository } from '@features/settings/repositories/workspace.repository';
import { 
  getDashboardStats, 
  getAccountHealthData, 
  getDashboardTrends, 
  getInboxMetrics, 
  getAISummary 
} from '@features/dashboard/actions/dashboard.actions';
import { AccountHealthGrid } from '@features/dashboard/components/account-health-grid';
import { InboxMetricsCard } from '@features/dashboard/components/inbox-metrics-card';
import { AISummaryCard } from '@features/dashboard/components/ai-summary-card';
import { ErrorBoundary, SectionError } from '@features/dashboard/components/error-boundary';
import { LeadsCenterTab } from '@features/dashboard/components/leads-center-tab';
import { DashboardTabsLayout } from '@features/dashboard/components/dashboard-tabs-layout';
import DashboardSkeleton from '@features/dashboard/components/dashboard-skeleton';
import { InsightsTab } from '@features/dashboard/components/insights-tab';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DashboardPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const workspaceRepo = getWorkspaceRepository();
  const { data: workspace } = await workspaceRepo.findFirstByUserId(user.id);

  if (!workspace) {
    return (
      <div className="p-10 max-w-[1400px] mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl mb-1 font-bold text-gradient">Dashboard</h1>
        </header>
      <div className="bg-base-100 p-10 text-center rounded-2xl border border-base-content/5 shadow-sm">
          <p className="text-base-content/70 text-lg mb-6 font-medium">Bạn chưa có không gian làm việc. Vui lòng thiết lập tài khoản trong cài đặt.</p>
          <Link href="/dashboard/settings/accounts" className="btn btn-primary rounded-lg px-6 font-bold">
            Đi tới Cài đặt
          </Link>
        </div>
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const tabParam = resolvedParams.tab;
  const activeTab = tabParam === 'insights' ? 'insights' : tabParam === 'leads' ? 'leads' : 'overview';

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent 
        workspaceId={workspace.id} 
        workspaceName={workspace.name} 
        activeTab={activeTab} 
      />
    </Suspense>
  );
}

interface DashboardContentProps {
  workspaceId: string;
  workspaceName: string;
  activeTab: 'overview' | 'leads' | 'insights';
}

async function DashboardContent({ workspaceId, workspaceName, activeTab }: DashboardContentProps) {
  // Server-Side Tab Navigation: Chỉ fetch dữ liệu Overview nếu đang ở tab overview!
  if (activeTab === 'overview') {
    const [stats, trends, healthData, inboxMetrics, aiSummary] = await Promise.all([
      getDashboardStats(workspaceId),
      getDashboardTrends(workspaceId),
      getAccountHealthData(workspaceId),
      getInboxMetrics(workspaceId),
      getAISummary(workspaceId),
    ]);

    return (
      <DashboardTabsLayout activeTab={activeTab} workspaceName={workspaceName}>
        <div className="space-y-8 animate-fade-in w-full">
          {/* Section 1: Stats & Account Health Command Center (Bento Grid 4-8) */}
          <AccountHealthGrid accounts={healthData} stats={stats} />

          {/* Section 2 + 3: Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* Inbox Metrics (Left 58%) */}
            <div className="lg:col-span-7 flex flex-col w-full">
              <ErrorBoundary fallback={<SectionError title="Inbox Metrics" />}>
                <InboxMetricsCard
                  workspaceId={workspaceId}
                  initialData={inboxMetrics}
                  accounts={healthData}
                />
              </ErrorBoundary>
            </div>

            {/* AI Summary (Right) */}
            <div className="lg:col-span-5 flex flex-col w-full">
              <ErrorBoundary fallback={<SectionError title="AI Summary" />}>
                <AISummaryCard
                  workspaceId={workspaceId}
                  initialData={aiSummary}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </DashboardTabsLayout>
    );
  }

  // Nếu đang ở tab insights, render InsightsTab
  if (activeTab === 'insights') {
    return (
      <DashboardTabsLayout activeTab={activeTab} workspaceName={workspaceName}>
        <div className="animate-fade-in w-full flex flex-col">
          <InsightsTab workspaceId={workspaceId} />
        </div>
      </DashboardTabsLayout>
    );
  }

  // Nếu đang ở tab leads, import trực tiếp và render LeadsCenterTab (không fetch thừa dữ liệu Overview)
  return (
    <DashboardTabsLayout activeTab={activeTab} workspaceName={workspaceName}>
      <div className="animate-fade-in w-full flex-1 flex flex-col min-h-0 h-full">
        <LeadsCenterTab workspaceId={workspaceId} />
      </div>
    </DashboardTabsLayout>
  );
}
