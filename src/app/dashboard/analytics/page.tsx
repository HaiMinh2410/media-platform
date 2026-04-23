import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { getAnalyticsHistory } from '@/infrastructure/repositories/analytics.repository';
import { AnalyticsDashboardClient } from './analytics-client';

export default async function AnalyticsPage() {
  const repo = getPlatformAccountRepository();
  
  // 1. Fetch all connected accounts
  const { data: accounts } = await repo.findAllWithMetaTokens();
  
  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-semibold text-white mb-2">No accounts connected</h2>
        <p className="text-white/50">Connect a Meta account to see analytics</p>
      </div>
    );
  }

  // 2. Fetch initial data for the first account (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const { data: initialAnalytics } = await getAnalyticsHistory({
    accountId: accounts[0].id,
    startDate,
    endDate
  });

  // Map repo results to the simplified list for the selector
  const accountList = accounts.map(a => ({
    id: a.id,
    name: (a as any).name || a.externalId, // Fallback to ID if name not present in this view
    platform: a.platform
  }));

  return (
    <AnalyticsDashboardClient 
      initialData={initialAnalytics || []} 
      accounts={accountList} 
    />
  );
}
