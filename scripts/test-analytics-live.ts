/**
 * Script: test-analytics-live.ts
 * Kiểm tra Server Action getAnalyticsAction và in ra kết quả chi tiết sau khi xóa sạch cache Redis
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { getAnalyticsAction } from '../src/application/actions/analytics.actions';
import { redisConnection } from '../src/infrastructure/queue/bullmq.provider';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Đang tìm tài khoản Nguyen An Thu (Instagram)... ===');
  const igAccount = await db.platformAccount.findFirst({
    where: { platform_user_id: '17841477493647789' },
    include: { meta_tokens: { take: 1 } }
  });

  if (!igAccount) {
    console.error('Không tìm thấy tài khoản Instagram Nguyen An Thu!');
    return;
  }

  const accountId = igAccount.id;
  console.log(`Tài khoản: ${igAccount.platform_user_name} (ID: ${accountId})`);

  // Xóa sạch cache Redis trước khi chạy để bắt buộc live fetch!
  if (redisConnection) {
    console.log('=== Đang dọn dẹp Redis cache cho tài khoản... ===');
    try {
      const freshKeys = await redisConnection.keys(`*live_analytics_fresh:${accountId}*`);
      const periodKeys = await redisConnection.keys(`*live_analytics_period_cache:${accountId}*`);
      const allKeys = [...freshKeys, ...periodKeys];
      
      if (allKeys.length > 0) {
        console.log(`Đang xóa ${allKeys.length} keys Redis cache...`, allKeys);
        await redisConnection.del(...allKeys);
      } else {
        console.log('Không có key Redis cache nào cần xóa.');
      }
    } catch (err) {
      console.error('Lỗi khi dọn Redis cache:', err);
    }
  } else {
    console.log('Redis connection không tồn tại!');
  }

  console.log('=== Gọi Server Action getAnalyticsAction... ===');
  const result = await getAnalyticsAction(accountId, '30d');
  
  console.log('\n=== KẾT QUẢ TRẢ VỀ ===');
  if (result.error) {
    console.error('Lỗi khi gọi Server Action:', result.error);
  } else {
    const data = result.data;
    console.log('Range:', data?.range);
    console.log('Current Start:', data?.currentStart);
    console.log('Current End:', data?.currentEnd);
    console.log('Số snapshot current:', data?.current?.length);
    console.log('Số snapshot previous:', data?.previous?.length);
    console.log('Unique Reach (của chu kỳ):', data?.uniqueReach);
    console.log('Prev Unique Reach:', data?.prevUniqueReach);
    console.log('Unique Accounts Engaged (của chu kỳ):', data?.uniqueAccountsEngaged);
    console.log('Prev Unique Accounts Engaged:', data?.prevUniqueAccountsEngaged);
    console.log('Unique Interactions (của chu kỳ):', data?.uniqueInteractions);
    console.log('Prev Unique Interactions:', data?.prevUniqueInteractions);
    console.log('Followers Pct:', data?.followersPct);
    console.log('Non-followers Pct:', data?.nonfollowersPct);
    
    if (data?.current && data.current.length > 0) {
      console.log('\nSnapshot cuối cùng trong DB/Live:');
      const latest = data.current[data.current.length - 1];
      console.log({
        date: latest.date,
        reach: latest.reach,
        accountsReached: latest.accountsReached,
        followersPct: latest.followersPct,
        nonfollowersPct: latest.nonfollowersPct,
        byContentViews: latest.byContentViews,
        insufficientData: latest.insufficientData
      });
    }
  }
}

main()
  .catch(err => console.error('Lỗi chạy script:', err))
  .finally(() => {
    db.$disconnect();
    // Đóng kết nối Redis để script exit bình thường
    if (redisConnection) {
      redisConnection.quit().catch(() => {});
    }
  });
