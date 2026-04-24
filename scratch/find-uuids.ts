import { db } from '../src/lib/db';

async function findAccountUUIDs() {
  const accounts = await db.platformAccount.findMany();
  console.log('📋 Account UUIDs:');
  accounts.forEach(a => {
    console.log(`- [${a.platform}] ${a.platform_user_name} (Internal ID: ${a.id})`);
  });
}

findAccountUUIDs().catch(console.error);
