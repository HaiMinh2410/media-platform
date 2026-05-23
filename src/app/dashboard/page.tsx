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
import { StatsStrip } from '@features/dashboard/components/stats-strip';
import { AccountHealthGrid } from '@features/dashboard/components/account-health-grid';
import { SectionTitle } from '@features/dashboard/components/section-title';
import { InboxMetricsCard } from '@features/dashboard/components/inbox-metrics-card';
import { AISummaryCard } from '@features/dashboard/components/ai-summary-card';
import { ErrorBoundary, SectionError } from '@features/dashboard/components/error-boundary';
import DashboardSkeleton from '@features/dashboard/components/dashboard-skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
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

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent workspaceId={workspace.id} workspaceName={workspace.name} />
    </Suspense>
  );
}

async function DashboardContent({ workspaceId, workspaceName }: { workspaceId: string, workspaceName: string }) {
  // Parallel Data Fetching
  const [stats, trends, healthData, inboxMetrics, aiSummary] = await Promise.all([
    getDashboardStats(workspaceId),
    getDashboardTrends(workspaceId),
    getAccountHealthData(workspaceId),
    getInboxMetrics(workspaceId),
    getAISummary(workspaceId),
  ]);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* 4.5 — Stats Strip (Outside padding container) */}
      <ErrorBoundary name="Stats Strip">
        <StatsStrip stats={stats} />
      </ErrorBoundary>

      <div className="p-6 xl:p-7 pb-12 xl:pb-16 space-y-8 max-w-[1600px] mx-auto w-full">

        {/* Section 1: Account Health Command Center */}
        <section className="space-y-4">
          <SectionTitle icon="⚡" label="Account Health Command Center" />
          <ErrorBoundary fallback={<SectionError title="Account Health" />}>
            <AccountHealthGrid accounts={healthData} />
          </ErrorBoundary>
        </section>

        {/* Section 2 + 3: Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inbox Metrics (Left 58%) */}
          <div className="lg:col-span-7 flex flex-col">
            <ErrorBoundary fallback={<SectionError title="Inbox Metrics" />}>
              <InboxMetricsCard 
                workspaceId={workspaceId} 
                initialData={inboxMetrics}
                accounts={healthData}
              />
            </ErrorBoundary>
          </div>

          {/* AI Summary (Right) */}
          <div className="lg:col-span-5 flex flex-col">
            <ErrorBoundary fallback={<SectionError title="AI Summary" />}>
              <AISummaryCard 
                workspaceId={workspaceId} 
                initialData={aiSummary} 
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
