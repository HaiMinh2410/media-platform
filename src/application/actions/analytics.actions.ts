'use server';

import { getAnalyticsForPeriod, getTopPosts, getEngagementBreakdown, getPostFrequency, getTopContentFromDB } from '@/infrastructure/repositories/analytics.repository';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { metaAnalyticsService } from '../services/meta-analytics.service';
import { AnalyticsFilter, AnalyticsRange } from '@/domain/types/analytics';

/**
 * Server Action to fetch analytics with Period-over-Period support.
 */
export async function getAnalyticsAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  const filter: AnalyticsFilter = {
    accountId,
    range,
    customStart,
    customEnd
  };
  
  const { data, error } = await getAnalyticsForPeriod(filter);
  
  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Legacy support: Calls getAnalyticsAction with filter object.
 */
export async function getAnalyticsActionLegacy(filter: AnalyticsFilter) {
  return getAnalyticsAction(filter.accountId, filter.range, filter.customStart, filter.customEnd);
}

/**
 * Triggers a manual sync for an account.
 */
export async function syncAnalyticsAction(accountId: string) {
  const repo = getPlatformAccountRepository();
  const { data: account, error: fetchError } = await repo.findById(accountId);

  if (fetchError || !account) {
    return { success: false, error: fetchError || 'ACCOUNT_NOT_FOUND' };
  }

  // Get tokens
  const { data: accountsWithTokens } = await repo.findAllWithMetaTokens();
  const accountWithToken = accountsWithTokens?.find(a => a.id === accountId);

  if (!accountWithToken || !accountWithToken.encryptedToken) {
    return { success: false, error: 'MISSING_META_TOKEN' };
  }

  const result = await metaAnalyticsService.syncAccount({
    accountId: account.id,
    externalId: account.externalId,
    platform: account.platform,
    encryptedToken: accountWithToken.encryptedToken,
  });

  return result;
}

export async function getTopPostsAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  const filter: AnalyticsFilter = { accountId, range, customStart, customEnd };
  return getTopPosts(filter.accountId, filter.range, 10, filter.customStart, filter.customEnd);
}

export async function getTopContentAction(accountId: string) {
  try {
    let topByViews = [];
    let topByInteractions = [];

    // 1. Check Redis cache first
    if (redisConnection) {
      const cachedViews = await redisConnection.get(`top_content:views:${accountId}`);
      const cachedInteractions = await redisConnection.get(`top_content:interactions:${accountId}`);

      if (cachedViews && cachedInteractions) {
        return {
          topByViews: JSON.parse(cachedViews),
          topByInteractions: JSON.parse(cachedInteractions),
          error: null
        };
      }
    }

    // 2. Cache miss -> Query DB
    const result = await getTopContentFromDB(accountId);
    
    // Fallback: If DB query is successful, we could cache it here, but it's usually 
    // cached by the sync worker. We'll just return it.
    return result;
  } catch (error) {
    console.error('[AnalyticsActions] getTopContentAction error:', error);
    return { topByViews: [], topByInteractions: [], error: 'FAILED_TO_GET_TOP_CONTENT' };
  }
}

export async function getEngagementBreakdownAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  const filter: AnalyticsFilter = { accountId, range, customStart, customEnd };
  return getEngagementBreakdown(filter.accountId, filter.range, filter.customStart, filter.customEnd);
}

export async function getPostFrequencyAction(accountId: string, range: AnalyticsRange = '30d', customStart?: Date, customEnd?: Date) {
  const filter: AnalyticsFilter = { accountId, range, customStart, customEnd };
  return getPostFrequency(filter.accountId, filter.range, filter.customStart, filter.customEnd);
}

export async function syncAllAccountsAction() {
  const repo = getPlatformAccountRepository();
  const { data: accountsWithTokens, error } = await repo.findAllWithMetaTokens();

  if (error || !accountsWithTokens) {
    return { success: false, error: error || 'FAILED_TO_FETCH_ACCOUNTS' };
  }

  let successCount = 0;
  for (const account of accountsWithTokens) {
    if (!account.encryptedToken) continue;

    const result = await metaAnalyticsService.syncAccount({
      accountId: account.id,
      externalId: account.externalId,
      platform: account.platform,
      encryptedToken: account.encryptedToken,
    });

    if (result.success) {
      successCount++;
    }
  }

  return { success: true, processed: accountsWithTokens.length, successful: successCount };
}
