import { db } from '@/lib/db';
import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';
import { getPlatformAccountRepository } from '@/infrastructure/repositories/platform-account.repository';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { subDays } from 'date-fns';

async function main() {
  console.log('--- TESTING REACH METRIC FOR TIME SERIES ---');
  
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

  const now = new Date();
  const localTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const currentEnd = new Date(Date.UTC(
    localTime.getUTCFullYear(),
    localTime.getUTCMonth(),
    localTime.getUTCDate(),
    23, 59, 59, 999
  ));
  const currentStart = subDays(currentEnd, 4); // Let's test 5 days
  currentStart.setUTCHours(0, 0, 0, 0);

  const sinceUnix = Math.floor(currentStart.getTime() / 1000);
  const untilUnix = Math.floor(currentEnd.getTime() / 1000);

  try {
    const res = await client.request<any>(
      `${acc.platform_user_id}/insights`,
      accessToken,
      {
        metric: 'reach',
        metric_type: 'total_value',
        breakdown: 'follow_type',
        period: 'day',
        since: sinceUnix,
        until: untilUnix
      },
      'GET',
      acc.id
    );
    console.log('Reach Result:', JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error('Reach Error:', err);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
