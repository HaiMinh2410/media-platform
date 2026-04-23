import { NextResponse } from 'next/server';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { metaAnalyticsService } from '@/application/services/meta-analytics.service';

// Number of ms to wait between account syncs to avoid Meta API rate limits
const SYNC_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/cron/sync-analytics
 *
 * Triggered daily by Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 *
 * Iterates all platform accounts with active Meta tokens and syncs
 * their daily analytics snapshots via the Meta Graph API.
 */
export async function POST(request: Request) {
  // 1. Authenticate via CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CronAnalytics] Unauthorized request — missing or invalid CRON_SECRET');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CronAnalytics] Starting daily analytics sync...');

  // 2. Fetch all accounts with active Meta tokens
  const repo = getPlatformAccountRepository();
  const { data: accounts, error: fetchError } = await repo.findAllWithMetaTokens();

  if (fetchError || !accounts) {
    console.error('[CronAnalytics] Failed to fetch accounts:', fetchError);
    return NextResponse.json(
      { error: 'FETCH_ACCOUNTS_FAILED', detail: fetchError },
      { status: 500 },
    );
  }

  if (accounts.length === 0) {
    console.log('[CronAnalytics] No Meta accounts found. Skipping sync.');
    return NextResponse.json({ synced: 0, failed: 0, skipped: 0, message: 'No accounts to sync' });
  }

  console.log(`[CronAnalytics] Syncing ${accounts.length} account(s)...`);

  // 3. Sync each account sequentially (rate-limit friendly)
  let synced = 0;
  let failed = 0;
  const failedAccounts: Array<{ id: string; platform: string; error: string }> = [];

  for (const account of accounts) {
    const result = await metaAnalyticsService.syncAccount({
      accountId: account.id,
      externalId: account.externalId,
      platform: account.platform,
      encryptedToken: account.encryptedToken as string,
    });

    if (result.success) {
      synced++;
      console.log(`[CronAnalytics] ✓ Synced account ${account.id} (${account.platform})`);
    } else {
      failed++;
      failedAccounts.push({
        id: account.id,
        platform: account.platform,
        error: result.error ?? 'UNKNOWN_ERROR',
      });
      console.error(
        `[CronAnalytics] ✗ Failed account ${account.id} (${account.platform}): ${result.error}`,
      );
    }

    // Rate limit guard between requests
    if (accounts.indexOf(account) < accounts.length - 1) {
      await sleep(SYNC_DELAY_MS);
    }
  }

  const summary = {
    synced,
    failed,
    skipped: 0,
    total: accounts.length,
    failedAccounts: failed > 0 ? failedAccounts : undefined,
    completedAt: new Date().toISOString(),
  };

  console.log('[CronAnalytics] Sync complete:', summary);

  const statusCode = failed > 0 && synced === 0 ? 500 : 200;
  return NextResponse.json(summary, { status: statusCode });
}
