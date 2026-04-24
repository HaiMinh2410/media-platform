import { db } from '../src/lib/db';

async function checkBotConfig() {
  const ACCOUNT_ID = '2f5a45e5-ccd0-4aeb-80a9-14bd224cc714';
  
  const config = await db.bot_configurations.findUnique({
    where: { account_id: ACCOUNT_ID }
  });

  console.log('🤖 Bot Config for Instagram Account:', config);
}

checkBotConfig().catch(console.error);
