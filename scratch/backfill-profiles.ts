// scratch/backfill-profiles.ts
import { db } from '../src/lib/db';
import { metaProfileService } from '../src/application/services/meta-profile.service';

async function main() {
  console.log("🔍 Starting profile backfill...");

  const conversations = await db.conversation.findMany({
    where: {
      customer_name: null
    },
    include: {
      platform_accounts: {
        include: {
          meta_tokens: {
            orderBy: { updated_at: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  console.log(`💬 Found ${conversations.length} conversations missing profile info.`);

  for (const convo of conversations) {
    const token = convo.platform_accounts.meta_tokens[0];
    if (!token) {
      console.warn(`⚠️ No token for conversation ${convo.id} (Account: ${convo.account_id})`);
      continue;
    }

    console.log(`🔄 Syncing profile for ${convo.platform_conversation_id}...`);
    await metaProfileService.syncCustomerProfile({
      conversationId: convo.id,
      platform: convo.platform_accounts.platform,
      externalSenderId: convo.platform_conversation_id,
      encryptedToken: token.encrypted_access_token
    });
  }

  console.log("✅ Backfill complete.");
}

main().catch(console.error);
