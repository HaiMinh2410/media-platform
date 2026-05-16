import { NextResponse } from 'next/server';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { getTokenManagementService } from '@/application/services/token-management.service';
import { createSyncLog } from '@/infrastructure/repositories/analytics.repository';

/**
 * POST /api/cron/refresh-meta-tokens
 * 
 * Daily cron job to gia hạn long-lived Meta tokens (60 ngày) 
 * cho các tài khoản sẽ hết hạn trong vòng 7 ngày tới.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CronRefresh] Checking for expiring Meta tokens...');

  const repo = getPlatformAccountRepository();
  const tokenService = getTokenManagementService();

  // 1. Tìm các tài khoản sắp hết hạn (7 ngày)
  const { data: accounts, error } = await repo.findExpiringMetaAccounts(7);

  if (error || !accounts) {
    return NextResponse.json({ error: 'FETCH_FAILED', detail: error }, { status: 500 });
  }

  console.log(`[CronRefresh] Found ${accounts.length} account(s) to refresh.`);

  let successCount = 0;
  let failCount = 0;

  for (const account of accounts) {
    // 2. Gọi service để refresh
    const result = await tokenService.refreshLongLivedToken(account.id);

    if (!result.error) {
      successCount++;
      await createSyncLog({
        accountId: account.id,
        service: 'meta-token-refresh',
        status: 'success'
      });
      console.log(`[CronRefresh] ✓ Refreshed token for ${account.id}`);
    } else {
      failCount++;
      // 3. Nếu fail, đánh dấu needs_reauth = true để hiện banner
      await repo.updateReauthStatus(account.id, true);
      
      await createSyncLog({
        accountId: account.id,
        service: 'meta-token-refresh',
        status: 'failed',
        errorMessage: result.error
      });
      console.error(`[CronRefresh] ✗ Failed to refresh token for ${account.id}: ${result.error}`);
    }
  }

  return NextResponse.json({
    processed: accounts.length,
    success: successCount,
    failed: failCount,
    completedAt: new Date().toISOString()
  });
}
