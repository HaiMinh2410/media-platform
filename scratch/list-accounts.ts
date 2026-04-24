import { db } from '../src/lib/db';

async function listAccounts() {
  const accounts = await db.platformAccount.findMany({
    include: {
      bot_configurations: true
    }
  });

  console.log('📋 All Accounts:');
  accounts.forEach(a => {
    console.log(`- [${a.platform}] ${a.platform_user_name} (ID: ${a.platform_user_id}) | Bot Active: ${a.bot_configurations?.is_active}`);
  });
}

listAccounts().catch(console.error);
