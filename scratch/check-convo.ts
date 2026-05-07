import { db } from '../src/lib/db';

async function run() {
  const convo = await db.conversation.findFirst({
    where: { id: 'eaff2e62-3af5-4994-8179-41f4792aa444' },
    include: {
      platform_accounts: true
    }
  });

  if (!convo) {
    console.log('Conversation not found');
    return;
  }

  console.log('--- Conversation Info ---');
  console.log('ID:', convo.id);
  console.log('Platform:', convo.platform_accounts.platform);
  console.log('Account Platform User ID:', convo.platform_accounts.platform_user_id);
  console.log('Conversation Platform ID (Customer ID):', convo.platform_conversation_id);
  console.log('Customer Name:', convo.customer_name);
}

run().catch(console.error);
