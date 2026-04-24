import { db } from '../src/lib/db';
import { metaProfileService } from '../src/application/services/meta-profile.service';

async function syncAllMissing() {
  console.log('🔄 Đang tìm các hội thoại chưa có profile...');
  
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

  console.log(`Found ${conversations.length} conversations to sync.`);

  for (const convo of conversations) {
    const account = convo.platform_accounts;
    const token = account.meta_tokens[0];

    if (!token) {
      console.log(`⚠️ Skip ${convo.id}: No token`);
      continue;
    }

    console.log(`👤 Syncing ${convo.platform_conversation_id}...`);
    await metaProfileService.syncCustomerProfile({
      conversationId: convo.id,
      platform: account.platform,
      externalSenderId: convo.platform_conversation_id,
      encryptedToken: token.encrypted_access_token
    });
  }

  console.log('✅ Hoàn tất đồng bộ toàn bộ profile!');
}

syncAllMissing().catch(console.error);
