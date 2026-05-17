import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  
  const logs = await db.$queryRaw<any[]>`
    SELECT id, service, status, error_message, error_code, created_at
    FROM sync_logs
    WHERE account_id = 'f32e932a-6d47-45bb-8a20-48ceb50a960d'
    ORDER BY created_at DESC
    LIMIT 10
  `;
  
  const serialized = JSON.stringify(logs, null, 2);
  console.log('Sync logs:', serialized);
  await db.$disconnect();
}

main();
