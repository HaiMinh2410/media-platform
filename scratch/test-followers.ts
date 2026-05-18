import { db } from '@/lib/db';
import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { subDays } from 'date-fns';

async function main() {
  console.log('--- TESTING PARALLEL DAILY CHUNKING FOR FOLLOWS ---');
  
  const accounts = await db.platformAccount.findMany({
    where: { platform: 'instagram', platform_user_name: { contains: 'Nguyen An Thu' } }
  });

  if (accounts.length === 0) {
    console.error('No account found');
    process.exit(1);
  }

  const acc = accounts[0];
  const repo = getPlatformAccountRepository();
  const { data: accountsWithTokens } = await repo.findAllWithMetaTokens();
  const accountWithToken = accountsWithTokens?.find(a => a.id === acc.id);
  const cryptoService = getTokenEncryptionService();
  const client = getMetaGraphClient();
  const accessToken = (await cryptoService.decrypt(accountWithToken!.encryptedToken)).data!;

  // Simulate a 7-day window to keep it fast
  const now = new Date();
  const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const currentEnd = new Date(Date.UTC(
    localTime.getUTCFullYear(),
    localTime.getUTCMonth(),
    localTime.getUTCDate(),
    23, 59, 59, 999
  ));
  const currentStart = subDays(currentEnd, 6); // 7 days total
  currentStart.setUTCHours(0, 0, 0, 0);

  console.log(`Time range: ${currentStart.toISOString()} -> ${currentEnd.toISOString()}`);

  // 1. Construct daily chunks
  const dailyChunks: { dateStr: string; sinceUnix: number; untilUnix: number }[] = [];
  let currentDay = new Date(currentStart);
  
  while (currentDay <= currentEnd) {
    const dayStart = new Date(currentDay);
    const sinceUnixVal = Math.floor(dayStart.getTime() / 1000);
    
    const dayEnd = new Date(currentDay);
    dayEnd.setUTCHours(23, 59, 59, 999);
    const untilUnixVal = Math.floor(dayEnd.getTime() / 1000);
    
    dailyChunks.push({
      dateStr: dayStart.toISOString().split('T')[0],
      sinceUnix: sinceUnixVal,
      untilUnix: untilUnixVal
    });
    
    currentDay.setUTCDate(currentDay.getUTCDate() + 1);
  }

  console.log(`Created ${dailyChunks.length} daily chunks to query.`);

  // 2. Fetch parallel daily follows
  const followsPromises = dailyChunks.map(dChunk =>
    client.request<any>(
      `${acc.platform_user_id}/insights`,
      accessToken,
      {
        metric: 'follows_and_unfollows',
        metric_type: 'total_value',
        breakdown: 'follow_type',
        period: 'day',
        since: dChunk.sinceUnix,
        until: dChunk.untilUnix
      },
      'GET',
      acc.id
    ).then(res => ({
      dateStr: dChunk.dateStr,
      res
    })).catch(err => {
      console.warn(`Failed to fetch for ${dChunk.dateStr}:`, err);
      return { dateStr: dChunk.dateStr, res: null };
    })
  );

  const followsResults = await Promise.allSettled(followsPromises);

  // 3. Parse daily follows
  const followsData: Array<{ date: string; follows: number; unfollows: number }> = [];

  for (const itemResult of followsResults) {
    if (itemResult.status === 'fulfilled') {
      const { dateStr, res } = itemResult.value;
      let dayFollows = 0;
      let dayUnfollows = 0;

      if (res && res.data && Array.isArray(res.data.data)) {
        const item = res.data.data.find((i: any) => i.name === 'follows_and_unfollows');
        if (item && item.total_value) {
          const targetBreakdowns = item.total_value.breakdowns;
          if (Array.isArray(targetBreakdowns)) {
            for (const b of targetBreakdowns) {
              const keys = b.dimension_keys || [];
              const followTypeIdx = keys.indexOf('follow_type');
              if (followTypeIdx !== -1 && Array.isArray(b.results)) {
                for (const result of b.results) {
                  const vals = result.dimension_values || [];
                  const val = result.value || 0;
                  const type = (vals[followTypeIdx] || '').toUpperCase();
                  if (type === 'FOLLOW' || type === 'FOLLOWS' || type === 'FOLLOWER') {
                    dayFollows += val;
                  } else if (type === 'UNFOLLOW' || type === 'UNFOLLOWS' || type === 'NON_FOLLOWER') {
                    dayUnfollows += val;
                  }
                }
              }
            }
          }
        }
      }

      followsData.push({
        date: dateStr,
        follows: dayFollows,
        unfollows: dayUnfollows
      });
    }
  }

  // Sort by date ascending
  followsData.sort((a, b) => a.date.localeCompare(b.date));

  console.log('\n--- PARSED DAILY FOLLOWS DATA ---');
  console.log(JSON.stringify(followsData, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
