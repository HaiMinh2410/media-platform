import React, { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/infrastructure/supabase/server';
import { redirect } from 'next/navigation';
import { getWorkspaceRepository } from '@/infrastructure/repositories/workspace.repository';
import { 
  getDashboardStats, 
  getAccountHealthData, 
  getDashboardTrends, 
  getInboxMetrics, 
  getAISummary 
} from '@/application/actions/dashboard.actions';
import { StatsStrip } from '@/components/dashboard/stats-strip';
import { AccountHealthGrid } from '@/components/dashboard/account-health-grid';
import { SectionTitle } from '@/components/dashboard/section-title';
import { InboxMetricsCard } from '@/components/dashboard/inbox-metrics-card';
import { AISummaryCard } from '@/components/dashboard/ai-summary-card';
import { ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { ErrorBoundary, SectionError } from '@/components/dashboard/error-boundary';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';

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
          <h1 className="text-4xl mb-1 font-brand font-bold text-gradient">Dashboard</h1>
        </header>
        <div className="glass p-10 text-center rounded-2xl border border-foreground/10 bg-foreground/[0.02] backdrop-blur-xl">
          <p className="text-foreground-secondary text-lg mb-6">Bạn chưa có không gian làm việc. Vui lòng thiết lập tài khoản trong cài đặt.</p>
          <Link href="/dashboard/settings/accounts" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-content font-bold transition-all hover:opacity-90 active:scale-[0.98]">
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
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* 4.5 — Stats Strip (Outside padding container) */}
      <ErrorBoundary name="Stats Strip">
        <StatsStrip stats={stats} />
      </ErrorBoundary>

      <div className="p-6 xl:p-7 space-y-8 ">

        {/* Section 1: Account Health Command Center */}
        <section className="space-y-4 max-w-[1600px] mx-auto w-full">
          <SectionTitle icon="⚡" label="Account Health Command Center" />
          <ErrorBoundary fallback={<SectionError title="Account Health" />}>
            <AccountHealthGrid accounts={healthData} />
          </ErrorBoundary>
        </section>

        {/* Section 2 + 3: Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inbox Metrics (Left 58%) */}
          <div className="lg:col-span-7 h-full">
            <ErrorBoundary fallback={<SectionError title="Inbox Metrics" />}>
              <InboxMetricsCard 
                workspaceId={workspaceId} 
                initialData={inboxMetrics}
                accounts={healthData}
              />
            </ErrorBoundary>
          </div>

          {/* AI Summary (Right) */}
          <div className="lg:col-span-5 h-full space-y-6">
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
