import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  console.log('🚀 Synchronizing Account Clusters based on Metadata...');

  const workspace = await db.workspace.findFirst();
  if (!workspace) {
    console.error('❌ No workspace found');
    return;
  }

  // 1. Clear existing groups to avoid duplication/confusion
  await db.accountGroupMembership.deleteMany({
    where: { group: { workspace_id: workspace.id } }
  });
  await db.accountGroup.deleteMany({
    where: { workspace_id: workspace.id }
  });

  // 2. Fetch all Facebook accounts in the workspace
  const fbAccounts = await db.platformAccount.findMany({
    where: { workspaceId: workspace.id, platform: 'facebook' }
  });

  for (const fb of fbAccounts) {
    console.log(`\nProcessing FB: ${fb.platform_user_name} (${fb.platform_user_id})`);
    
    // Create group named after the FB account cluster
    const group = await db.accountGroup.create({
      data: {
        workspace_id: workspace.id,
        name: `Cluster ${fb.platform_user_name}`,
        description: `Automated cluster for ${fb.platform_user_name}`
      }
    });

    // Add FB account
    await db.accountGroupMembership.create({
      data: {
        group_id: group.id,
        account_id: fb.id
      }
    });

    // Check for linked Instagram
    const metadata = fb.metadata as any;
    const igId = metadata?.instagram_id;

    if (igId) {
      const ig = await db.platformAccount.findFirst({
        where: { workspaceId: workspace.id, platform: 'instagram', platform_user_id: igId }
      });

      if (ig) {
        await db.accountGroupMembership.create({
          data: {
            group_id: group.id,
            account_id: ig.id
          }
        });
        console.log(`  ✅ Linked with IG: ${ig.platform_user_name} (${ig.platform_user_id})`);
      } else {
        console.warn(`  ⚠️ Linked IG ID ${igId} not found in platform_accounts`);
      }
    } else {
      console.log(`  ℹ️ No linked Instagram account found for ${fb.platform_user_name}`);
    }
  }

  console.log('\n🎉 Sync Complete!');
  await db.$disconnect();
}

main();
