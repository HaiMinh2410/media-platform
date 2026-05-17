import { db } from '../src/lib/db';
import { getMetaGraphClient } from '../src/infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d'; // Nguyen An Thu (Instagram)
  console.log('Fetching account and tokens...');
  
  const account = await db.platformAccount.findUnique({
    where: { id: accountId }
  });
  
  if (!account) {
    console.error('Account not found');
    return;
  }
  
  const tokenRecord = await db.meta_tokens.findFirst({
    where: { account_id: accountId }
  });
  
  if (!tokenRecord) {
    console.error('Token not found');
    return;
  }

  const encryptionService = getTokenEncryptionService();
  const decrypted = await encryptionService.decrypt(tokenRecord.encrypted_access_token);
  const accessToken = decrypted.data;
  
  if (!accessToken) {
    console.error('Failed to decrypt access token');
    return;
  }
  
  const client = getMetaGraphClient();
  const externalId = account.platform_user_id;
  
  // Lấy chỉ 2 ngày gần nhất
  const twoDaysAgo = new Date();
  twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
  twoDaysAgo.setUTCHours(0, 0, 0, 0);
  
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(23, 59, 59, 999);
  
  const sinceUnix = Math.floor(twoDaysAgo.getTime() / 1000);
  const untilUnix = Math.floor(yesterday.getTime() / 1000);
  
  console.log(`Querying Meta API for Instagram Insights (2 Days, no metric_type)...`);
  console.log(`Since: ${twoDaysAgo.toISOString()} (${sinceUnix})`);
  console.log(`Until: ${yesterday.toISOString()} (${untilUnix})`);

  const response = await client.request<any>(`${externalId}/insights`, accessToken, { 
    metric: 'reach,views,profile_views,profile_links_taps,accounts_engaged,total_interactions', 
    period: 'day',
    since: sinceUnix,
    until: untilUnix
  }, 'GET', accountId);

  console.log('Insights API Response:');
  console.log(JSON.stringify(response, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
