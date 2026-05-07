import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('=== Checking Workspaces and Accounts Mapping ===\n');

  // 1. Xem danh sách workspaces trong DB
  const workspaces = await db.workspace.findMany({
    select: { id: true, name: true }
  });

  console.log(`🏢 Dự án có ${workspaces.length} Workspaces:`);
  for (const ws of workspaces) {
    console.log(`  🔹 Workspace: "${ws.name}" (ID: ${ws.id})`);
  }
  console.log();

  // 2. Xem các tài khoản và Workspace ID của chúng
  const accounts = await db.platformAccount.findMany({
    select: {
      id: true,
      platform: true,
      platform_user_name: true,
      platform_user_id: true,
      workspaceId: true
    }
  });

  console.log(`📱 Phân bổ Platform Accounts theo Workspace:`);
  for (const acc of accounts) {
    const ws = workspaces.find(w => w.id === acc.workspaceId);
    console.log(`  🔹 Account: [${acc.platform.toUpperCase()}] "${acc.platform_user_name}" (ID: ${acc.platform_user_id})`);
    console.log(`      └─ Thuộc Workspace: "${ws ? ws.name : 'KHÔNG TÌM THẤY'}" (ID: ${acc.workspaceId})`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
