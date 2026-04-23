import { db } from '../src/lib/db';

async function checkTokensDetailed() {
  const tokens = await db.meta_tokens.findMany({
    include: {
      platform_accounts: true
    }
  });

  console.log('--- All Meta Tokens ---');
  tokens.forEach(t => {
    console.log(`Token ID: ${t.id}`);
    console.log(`Linked Account: ${t.platform_accounts.platform_user_name} (${t.platform_accounts.platform})`);
    console.log(`Account ID: ${t.account_id}`);
    console.log(`Created: ${t.created_at}`);
    console.log('-------------------------');
  });
}

checkTokensDetailed().catch(console.error);
