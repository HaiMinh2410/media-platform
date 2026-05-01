import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { metaProfileService } from '../../src/application/services/meta-profile.service';

/**
 * Script: debug-profile-sync.ts
 * Triggers a profile sync for a specific conversation and logs the raw Meta response.
 * 
 * Usage: bun run scripts/scratch/debug-profile-sync.ts <conversation_id>
 */

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const conversationId = process.argv[2];
  if (!conversationId) {
    console.error('Usage: bun run scripts/scratch/debug-profile-sync.ts <conversation_id>');
    process.exit(1);
  }

  console.log(`🔍 Debugging profile sync for conversation: ${conversationId}`);

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      platform_accounts: {
        include: {
          meta_tokens: {
            orderBy: { updated_at: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!conversation) {
    console.error('❌ Conversation not found');
    process.exit(1);
  }

  const account = conversation.platform_accounts;
  const tokenRecord = account.meta_tokens[0];

  if (!tokenRecord) {
    console.error('❌ No Meta token found for this account');
    process.exit(1);
  }

  console.log(`Platform: ${account.platform}`);
  console.log(`External Sender ID: ${conversation.platform_conversation_id}`);
  console.log(`External Page ID: ${account.platform_user_id}`);

  await metaProfileService.syncCustomerProfile({
    conversationId: conversation.id,
    platform: account.platform,
    externalSenderId: conversation.platform_conversation_id,
    externalPageId: account.platform_user_id,
    encryptedToken: tokenRecord.encrypted_access_token,
  });

  console.log('\n✅ Sync attempt completed. Check the console logs above for raw response.');
}

main().finally(() => db.$disconnect());
