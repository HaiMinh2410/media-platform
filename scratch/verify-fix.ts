import { getConversationWithAccount } from '@/infrastructure/repositories/conversation.repository';
import { metaSendService } from '@/application/services/meta-send.service';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const conversationId = '236bb43e-68e1-45f6-9869-0e940d7f0848';
  
  console.log('--- Testing Repository Logic ---');
  const { data: conv, error: convErr } = await getConversationWithAccount(conversationId);
  
  if (convErr || !conv) {
    console.error('Conv Error:', convErr);
    process.exit(1);
  }

  console.log('Resolved Account for Reply:');
  console.log('Platform:', conv.account.platform);
  console.log('Effective Page ID (Sender):', conv.account.platform_user_id);
  console.log('Has Token:', !!conv.account.encryptedToken);

  if (conv.account.platform === 'instagram' && conv.account.platform_user_id === '1142742645581562') {
    console.log('✅ SUCCESS: Logic correctly resolved FB Page ID (1142742645581562) for Instagram reply.');
  } else {
    console.log('❌ FAILURE: Logic did not resolve expected FB Page ID.');
  }

  console.log('\n--- Attempting Real Send with Resolved Data ---');
  const result = await metaSendService.sendText({
    recipientId: conv.platform_conversation_id,
    pageId: conv.account.platform_user_id,
    encryptedToken: conv.account.encryptedToken!,
    text: "Test reply via fixed repository logic at " + new Date().toISOString(),
    platform: conv.account.platform as any
  });

  console.log('Final Send Result:', JSON.stringify(result));

  await db.$disconnect();
}

main().catch(console.error);
