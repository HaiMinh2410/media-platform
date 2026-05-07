import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Setting up Supabase Realtime for Webhook & Logs tables ===');

  try {
    // 1. Kiểm tra các bảng trong publication hiện tại
    const result = await db.$queryRawUnsafe<{ tablename: string }[]>(`
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    `);
    
    console.log('Các bảng hiện tại trong publication supabase_realtime:', result.map(r => r.tablename));

    const requiredTables = ['platform_event_logs', 'webhook_events'];
    const tablesToAdd = requiredTables.filter(t => !result.some(r => r.tablename === t));

    if (tablesToAdd.length === 0) {
      console.log('✅ Tất cả các bảng webhook đã được thêm vào publication supabase_realtime!');
    } else {
      console.log('Các bảng cần thêm:', tablesToAdd);
      
      for (const table of tablesToAdd) {
        console.log(`Đang thêm bảng ${table} vào publication...`);
        // ALTER PUBLICATION supabase_realtime ADD TABLE public.table_name
        await db.$executeRawUnsafe(`
          ALTER PUBLICATION supabase_realtime ADD TABLE "public"."${table}"
        `);
        console.log(`✅ Đã thêm bảng ${table}!`);
      }
    }
  } catch (error) {
    console.error('Lỗi khi thiết lập Realtime:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
