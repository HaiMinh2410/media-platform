import { db } from '../src/lib/db';

async function checkIGToken() {
  const ACCOUNT_ID = '2f5a45e5-ccd0-4aeb-80a9-14bd224cc714';
  
  const tokens = await db.meta_tokens.findMany({
    where: { account_id: ACCOUNT_ID },
    orderBy: { updated_at: 'desc' }
  });

  console.log('🔑 Tokens for Instagram Account:');
  console.log(JSON.stringify(tokens, null, 2));
}

checkIGToken().catch(console.error);
