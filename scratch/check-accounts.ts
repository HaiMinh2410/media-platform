import { db } from '../src/lib/db';

async function checkTokens() {
  const accounts = await db.platformAccount.findMany({
    include: {
      meta_tokens: {
        orderBy: { updated_at: 'desc' },
        take: 1
      },
      bot_configurations: true,
      workspace: true
    }
  });

  console.log('--- Platform Accounts ---');
  accounts.forEach(acc => {
    const token = acc.meta_tokens[0];
    console.log(`ID: ${acc.id}`);
    console.log(`Platform: ${acc.platform}`);
    console.log(`User Name: ${acc.platform_user_name}`);
    console.log(`User ID: ${acc.platform_user_id}`);
    console.log(`Token Status: ${token ? '✅ Present' : '❌ MISSING'}`);
    console.log(`Bot Active: ${acc.bot_configurations?.is_active ? '✅' : '❌'}`);
    console.log(`Bot Auto-Send: ${acc.bot_configurations?.auto_send ? '✅' : '❌'}`);
    console.log(`Workspace: ${acc.workspace.name}`);
    console.log('-------------------------');
  });
}

checkTokens().catch(console.error);
