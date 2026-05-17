import { syncAnalyticsAction } from '../src/application/actions/analytics.actions';
import { db } from '../src/lib/db';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d';
  console.log('--- STARTING SYNC TEST FOR ACCOUNT:', accountId, '---');
  
  const startTime = Date.now();
  const syncResult = await syncAnalyticsAction(accountId);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('Sync Result:', JSON.stringify(syncResult, null, 2));
  console.log(`Sync duration: ${duration}s`);

  // Query database to see if snapshots have been updated
  const snapshots = await db.analytics_snapshots.findMany({
    where: { account_id: accountId },
    orderBy: { date: 'asc' }
  });

  console.log(`\nAfter Sync: Found ${snapshots.length} snapshots in Database.`);
  if (snapshots.length > 0) {
    console.log('--- SAMPLES (First & Last) ---');
    const displayFields = snapshots.map(s => ({
      date: s.date.toISOString().split('T')[0],
      reach: s.reach,
      impressions: s.impressions,
      engagement: s.engagement,
      followers: s.followers,
      accounts_engaged: s.accounts_engaged,
      followers_pct: s.followers_pct,
      nonfollowers_pct: s.nonfollowers_pct,
      byContentViews: s.byContentViews
    }));
    
    console.log('First snapshot:', displayFields[0]);
    if (displayFields.length > 1) {
      console.log('Last snapshot:', displayFields[displayFields.length - 1]);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
