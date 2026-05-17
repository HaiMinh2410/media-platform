import { db } from '../src/lib/db';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d';
  console.log('Querying snapshots for account:', accountId);
  const snapshots = await db.analytics_snapshots.findMany({
    where: { account_id: accountId },
    orderBy: { date: 'asc' }
  });
  console.log(`Found ${snapshots.length} snapshots.`);
  if (snapshots.length > 0) {
    console.log('First 5 snapshots:');
    console.log(snapshots.slice(0, 5).map(s => ({
      date: s.date.toISOString().split('T')[0],
      reach: s.reach,
      impressions: s.impressions,
      engagement: s.engagement,
      followers: s.followers,
      accounts_reached: s.accounts_reached,
      accounts_engaged: s.accounts_engaged,
      followers_pct: s.followers_pct,
      nonfollowers_pct: s.nonfollowers_pct,
      insufficient_data: s.insufficient_data
    })));

    console.log('Last 5 snapshots:');
    console.log(snapshots.slice(-5).map(s => ({
      date: s.date.toISOString().split('T')[0],
      reach: s.reach,
      impressions: s.impressions,
      engagement: s.engagement,
      followers: s.followers,
      accounts_reached: s.accounts_reached,
      accounts_engaged: s.accounts_engaged,
      followers_pct: s.followers_pct,
      nonfollowers_pct: s.nonfollowers_pct,
      insufficient_data: s.insufficient_data
    })));
  }
}

main().catch(console.error).finally(() => db.$disconnect());
