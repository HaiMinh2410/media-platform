import { db } from '../src/lib/db';
import { metaAnalyticsService } from '../src/application/services/meta-analytics.service';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d'; // Nguyen An Thu (Instagram)
  console.log('Fetching account for sync...');
  
  const account = await db.platformAccount.findUnique({
    where: { id: accountId }
  });
  
  if (!account) {
    console.error('Account not found');
    return;
  }
  
  const tokenRecord = await db.meta_tokens.findFirst({
    where: { account_id: accountId }
  });
  
  if (!tokenRecord) {
    console.error('Token not found');
    return;
  }

  console.log(`Starting real sync for Instagram account: ${account.platform_user_name} (${account.platform_user_id})...`);
  const startTime = Date.now();
  
  const result = await metaAnalyticsService.syncAccount({
    accountId: account.id,
    externalId: account.platform_user_id,
    platform: 'instagram',
    encryptedToken: tokenRecord.encrypted_access_token
  });
  
  console.log(`Sync finished in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log('Result:', result);
  
  if (result.success) {
    console.log('Checking saved snapshots in database (last 5 days):');
    const snapshots = await db.analytics_snapshots.findMany({
      where: { account_id: accountId },
      orderBy: { date: 'desc' },
      take: 5
    });
    
    for (const snap of snapshots) {
      console.log(`- Date: ${snap.date.toISOString().split('T')[0]}`);
      console.log(`  Reach: ${snap.reach}`);
      console.log(`  Impressions/Views: ${snap.impressions}`);
      console.log(`  Profile Visits: ${snap.profile_visits}`);
      console.log(`  Profile Link Taps: ${snap.profile_links_taps}`);
      console.log(`  Accounts Engaged: ${snap.accounts_engaged}`);
      console.log(`  Engagement/Interactions: ${snap.engagement}`);
      console.log(`  Followers Pct: ${snap.followers_pct}%`);
      console.log(`  Non-followers Pct: ${snap.nonfollowers_pct}%`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
