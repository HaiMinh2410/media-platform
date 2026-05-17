import { db } from './src/lib/db';

async function main() {
  try {
    const snapshots = await db.analytics_snapshots.findMany({
      where: { account_id: 'f32e932a-6d47-45bb-8a20-48ceb50a960d' },
      orderBy: { date: 'desc' },
      take: 30
    });
    console.log('Account snapshots count:', snapshots.length);
    console.log('Non-zero snapshots:', JSON.stringify(snapshots.filter(s => s.reach > 0 || s.impressions > 0 || s.by_content_views !== null).map(s => ({
      date: s.date,
      reach: s.reach,
      impressions: s.impressions,
      followers_pct: s.followers_pct,
      nonfollowers_pct: s.nonfollowers_pct,
      by_content_views: s.by_content_views
    })), null, 2));
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await db.$disconnect();
  }
}

main();
