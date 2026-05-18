import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  
  const targetPostId = '18115724395775505';
  console.log(`Searching database for post_id: ${targetPostId}...`);
  
  const posts = await db.post_analytics.findMany({
    where: {
      post_id: targetPostId
    }
  });

  console.log(`Found ${posts.length} records matching post_id: ${targetPostId}`);
  posts.forEach((p, idx) => {
    console.log(`Record #${idx + 1}:`);
    console.log(JSON.stringify({
      id: p.id,
      account_id: p.account_id,
      post_id: p.post_id,
      media_type: p.media_type,
      caption: p.caption,
      like_count: p.like_count,
      comments_count: p.comments_count,
      shares_count: p.shares_count,
      saved_count: p.saved_count,
      total_interactions: p.total_interactions,
      views: p.views,
      reach: p.reach,
      impressions: p.impressions,
      profile_visits: p.profile_visits,
      follows: p.follows,
      posted_at: p.posted_at,
      synced_at: p.synced_at
    }, null, 2));
  });
  
  await db.$disconnect();
}

main();
