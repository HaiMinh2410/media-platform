import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Checking Raw Webhook Event Logs ===\n');

  // 1. Kiểm tra xem có bản ghi nào chứa ID Instagram của Hai Minh Platform không
  const igId = '17841418409623950';
  const fbPageId = '1006289889245664';

  const logsWithIg = await db.platformEventLog.findMany({
    where: {
      platform: 'meta',
      OR: [
        { payload: { path: ['entry', '0', 'id'], equals: igId } },
        { payload: { path: ['entry', '0', 'id'], equals: fbPageId } },
        { payload: { path: ['entry', '0', 'messaging', '0', 'recipient', 'id'], equals: igId } },
        { payload: { path: ['entry', '0', 'messaging', '0', 'sender', 'id'], equals: igId } },
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`Tìm thấy ${logsWithIg.length} raw logs liên quan đến Hai Minh Platform IG (${igId}) hoặc FB (${fbPageId})`);
  
  if (logsWithIg.length > 0) {
    for (const log of logsWithIg) {
      console.log(`\n[Log ID: ${log.id}] [Created: ${log.createdAt.toISOString()}] [Status: ${log.status}]`);
      console.log('Payload:', JSON.stringify(log.payload, null, 2));
    }
  } else {
    console.log('❌ Hoàn toàn KHÔNG có raw webhook log nào liên quan đến ID này trong DB!');
  }

  console.log('\n=== 5 Raw Webhook Logs Mới Nhất trong DB ===');
  const latestLogs = await db.platformEventLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  for (const log of latestLogs) {
    console.log(`\n[Log ID: ${log.id}] [Platform: ${log.platform}] [Created: ${log.createdAt.toISOString()}]`);
    console.log('Payload:', JSON.stringify(log.payload).substring(0, 300) + '...');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
