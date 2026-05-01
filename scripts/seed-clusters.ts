import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  console.log('🚀 Seeding Account Clusters...');

  const workspace = await db.workspace.findFirst();
  if (!workspace) {
    console.error('❌ No workspace found');
    return;
  }

  // Find accounts
  const kathryn = await db.platformAccount.findFirst({ where: { platform_user_name: 'Kathryn', platform: 'facebook' } });
  const minhAnh = await db.platformAccount.findFirst({ where: { platform_user_name: 'Minh Anh', platform: 'facebook' } });
  const anThu = await db.platformAccount.findFirst({ where: { platform_user_name: 'Nguyễn An Thư', platform: 'facebook' } });
  
  const lunarsNg = await db.platformAccount.findFirst({ where: { platform_user_name: 'lunars_ng', platform: 'instagram' } });
  const babyXoxo = await db.platformAccount.findFirst({ where: { platform_user_name: 'baby__.xoxo', platform: 'instagram' } });
  const sullybbi = await db.platformAccount.findFirst({ where: { platform_user_name: '_sullybbi', platform: 'instagram' } });

  const groups = [
    {
      name: 'Cluster Kathryn',
      members: [kathryn, babyXoxo].filter(Boolean)
    },
    {
      name: 'Cluster Minh Anh',
      members: [minhAnh, sullybbi].filter(Boolean)
    },
    {
      name: 'Cluster An Thư',
      members: [anThu, lunarsNg].filter(Boolean)
    }
  ];

  for (const g of groups) {
    const group = await db.accountGroup.create({
      data: {
        workspace_id: workspace.id,
        name: g.name,
        members: {
          create: g.members.map(m => ({
            account_id: m!.id
          }))
        }
      }
    });
    console.log(`✅ Created group: ${group.name} with ${g.members.length} members`);
  }

  await db.$disconnect();
}

main();
