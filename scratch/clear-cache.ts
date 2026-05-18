import { redisConnection } from '@/infrastructure/queue/bullmq.provider';

async function main() {
  console.log('--- CLEARING ALL REDIS ANALYTICS CACHE ---');
  if (!redisConnection) {
    console.error('Redis connection is not initialized!');
    process.exit(1);
  }

  const patterns = [
    'follower_details_cache:*',
    'live_analytics_period_cache:*',
    'live_analytics_fresh:*',
    'live_analytics_cache:*'
  ];

  for (const pattern of patterns) {
    try {
      const keys = await redisConnection.keys(pattern);
      console.log(`Found ${keys.length} keys for pattern '${pattern}' to delete.`);
      if (keys.length > 0) {
        await redisConnection.del(...keys);
        console.log(`Deleted pattern '${pattern}' successfully!`);
      }
    } catch (err) {
      console.error(`Failed to clear keys for pattern ${pattern}:`, err);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Unhandled script error:', err);
  process.exit(1);
});
