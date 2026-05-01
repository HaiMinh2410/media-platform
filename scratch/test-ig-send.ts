import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { metaMessagingClient } from '@/infrastructure/meta/meta-messaging.client';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const conversationId = '236bb43e-68e1-45f6-9869-0e940d7f0848';
  
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      platform_accounts: {
        include: {
          meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 }
        }
      }
    }
  });

  if (!conversation) throw new Error('Conv not found');

  const igAccount = conversation.platform_accounts;
  const igId = igAccount.platform_user_id;
  const recipientId = conversation.platform_conversation_id;

  // Tìm FB Page liên kết
  const linkedFbAccount = await db.platformAccount.findFirst({
    where: {
      platform: 'facebook',
      metadata: { path: ['instagram_id'], equals: igId }
    },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
  });

  if (!linkedFbAccount) throw new Error('Linked FB account not found');
  const fbPageId = linkedFbAccount.platform_user_id;

  const encToken = linkedFbAccount.meta_tokens[0]?.encrypted_access_token;
  if (!encToken) throw new Error('No token found');

  const { data: token } = await getTokenEncryptionService().decrypt(encToken);
  if (!token) throw new Error('Decrypt failed');

  console.log(`Testing with IG ID (${igId}) and FB Page Token...`);
  const res1 = await metaMessagingClient.sendTextMessage(igId, recipientId, "Test from IG ID", token);
  console.log('Result 1:', JSON.stringify(res1));

  console.log(`\nTesting with FB Page ID (${fbPageId}) and FB Page Token...`);
  const res2 = await metaMessagingClient.sendTextMessage(fbPageId, recipientId, "Test from FB Page ID", token);
  console.log('Result 2:', JSON.stringify(res2));

  await db.$disconnect();
}

main().catch(console.error);
