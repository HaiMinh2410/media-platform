import { getAnalyticsAction, syncAnalyticsAction } from '@/application/actions/analytics.actions';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { calcSummary } from '@/lib/analytics-utils';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d'; // Nguyen An Thu (Instagram)
  
  console.log('--- TEST STEP 1: Invalidating Redis caches manually ---');
  if (redisConnection) {
    await redisConnection.del(`live_analytics_fresh:${accountId}`);
    await redisConnection.del(`live_analytics_period_cache:${accountId}:7d`);
    await redisConnection.del(`live_analytics_period_cache:${accountId}:30d`);
    await redisConnection.del(`live_analytics_period_cache:${accountId}:90d`);
    console.log('Redis caches successfully deleted!');
  } else {
    console.log('No Redis connection available!');
    return;
  }
  
  console.log('\n--- TEST STEP 2: Running getAnalyticsAction (First execution - Live Fetch) ---');
  const startLive = Date.now();
  const result1 = await getAnalyticsAction(accountId, '30d');
  const durationLive = Date.now() - startLive;
  
  if (result1.error) {
    console.error('First execution failed with error:', result1.error);
    return;
  }
  
  const data1 = result1.data;
  console.log(`Live fetch took ${durationLive}ms`);
  console.log('Result 1 Raw Data:');
  console.log(`- uniqueReach: ${data1?.uniqueReach}`);
  console.log(`- prevUniqueReach: ${data1?.prevUniqueReach}`);
  
  if (data1) {
    const summary1 = calcSummary(data1);
    console.log('Result 1 Calculated Summary:');
    console.log(`- Reach Value (Unique): ${summary1.reach.value} (Trend: ${summary1.reach.trend}%)`);
    console.log(`- Impressions Value: ${summary1.impressions.value} (Trend: ${summary1.impressions.trend}%)`);
    
    // Check the actual snapshots to see the follower percentage
    const lastSnapshot = data1.current[data1.current.length - 1];
    console.log('Last Snapshot breakdown in current period:');
    console.log(`- followersPct: ${lastSnapshot?.followersPct}%`);
    console.log(`- nonfollowersPct: ${lastSnapshot?.nonfollowersPct}%`);
    console.log('byContentViews:', JSON.stringify(lastSnapshot?.byContentViews, null, 2));
  }
  
  console.log('\n--- TEST STEP 3: Running getAnalyticsAction (Second execution - Redis Cache Hit) ---');
  const startCache = Date.now();
  const result2 = await getAnalyticsAction(accountId, '30d');
  const durationCache = Date.now() - startCache;
  
  if (result2.error) {
    console.error('Second execution failed with error:', result2.error);
    return;
  }
  
  const data2 = result2.data;
  console.log(`Redis cache hit took ${durationCache}ms`);
  console.log('Result 2 Raw Data:');
  console.log(`- uniqueReach: ${data2?.uniqueReach}`);
  console.log(`- prevUniqueReach: ${data2?.prevUniqueReach}`);
  
  if (data2) {
    const summary2 = calcSummary(data2);
    console.log('Result 2 Calculated Summary:');
    console.log(`- Reach Value (Unique): ${summary2.reach.value} (Trend: ${summary2.reach.trend}%)`);
    console.log(`- Impressions Value: ${summary2.impressions.value} (Trend: ${summary2.impressions.trend}%)`);
    
    const lastSnapshot = data2.current[data2.current.length - 1];
    console.log('Last Snapshot breakdown in cached current period:');
    console.log(`- followersPct: ${lastSnapshot?.followersPct}%`);
    console.log(`- nonfollowersPct: ${lastSnapshot?.nonfollowersPct}%`);
  }
  
  console.log('\n--- TEST STEP 4: Triggering syncAnalyticsAction (Caches should be invalidated) ---');
  const syncResult = await syncAnalyticsAction(accountId);
  console.log('Sync completed. Success:', syncResult.success);
  
  console.log('\n--- TEST STEP 5: Checking if Redis cache was invalidated ---');
  const cachedVal = await redisConnection.get(`live_analytics_period_cache:${accountId}:30d`);
  console.log('Cache status after sync (should be null):', cachedVal);
  
  process.exit(0);
}

main();
