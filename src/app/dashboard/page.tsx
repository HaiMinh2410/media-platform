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

      <div className="p-6 xl:p-7 space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Header Section */}
        <header className="flex justify-between items-center bg-base-200/40 p-6 rounded-2xl border border-base-content/5 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              <h1 className="text-2xl xl:text-3xl font-black tracking-tight text-base-content">
                Command Center
              </h1>
            </div>
            <p className="text-sm text-base-content/60 font-medium">
              Chào mừng trở lại, {workspaceName}. Hệ thống AI đang hoạt động bình thường.
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/dashboard/composer" 
              className="bg-primary text-primary-content px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Soạn bài đăng
            </Link>
          </div>
        </header>

        {/* Section 1: Account Health Command Center */}
        <section className="space-y-4">
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

            {/* Quick Activity Card */}
            <div className="bg-base-200/40 rounded-3xl border border-base-content/5 p-6 flex flex-col gap-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <MessageSquare size={18} className="text-primary" />
                   <h3 className="font-brand font-bold">Hoạt động gần đây</h3>
                </div>
                <Link href="/dashboard/inbox" className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                  Xem tất cả
                  <ChevronRight size={14} />
                </Link>
              </div>
              
              <div className="flex flex-col gap-2">
                <p className="text-xs text-base-content/50 italic px-2">Các cuộc hội thoại mới nhất sẽ hiển thị tại đây.</p>
                {/* Integration point for real-time list in next phase */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
