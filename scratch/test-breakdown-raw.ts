import { db } from '../src/lib/db';
import { getMetaGraphClient } from '../src/infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d'; // Nguyen An Thu (Instagram)
  const account = await db.platformAccount.findUnique({ where: { id: accountId } });
  if (!account) return;
  
  const tokenRecord = await db.meta_tokens.findFirst({ where: { account_id: accountId } });
  if (!tokenRecord) return;

  const encryptionService = getTokenEncryptionService();
  const decrypted = await encryptionService.decrypt(tokenRecord.encrypted_access_token);
  const accessToken = decrypted.data;
  if (!accessToken) return;
  
  const client = getMetaGraphClient();
  const externalId = account.platform_user_id;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
  const sinceUnix = Math.floor(thirtyDaysAgo.getTime() / 1000);
  
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(23, 59, 59, 999);
  const untilUnix = Math.floor(yesterday.getTime() / 1000);

  console.log(`Fetching raw media_product_type breakdown for views,total_interactions...`);
  const res1 = await client.request<any>(`${externalId}/insights`, accessToken, { 
    metric: 'views,total_interactions', 
    breakdown: 'media_product_type', 
    period: 'day',
    metric_type: 'total_value',
    since: sinceUnix,
    until: untilUnix
  }, 'GET', accountId);

  console.log('Media breakdown Response data:', JSON.stringify(res1.data, null, 2));
  console.log('Media breakdown Response error:', res1.error);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
