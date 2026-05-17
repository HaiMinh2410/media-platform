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
  
  // Tạo 30 chunks, mỗi chunk là 1 ngày
  const chunks: { dateStr: string; sinceUnix: number; untilUnix: number }[] = [];
  for (let i = 30; i >= 1; i--) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - i);
    date.setUTCHours(0, 0, 0, 0);
    
    const sinceUnix = Math.floor(date.getTime() / 1000);
    
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    const untilUnix = Math.floor(endDate.getTime() / 1000);
    
    chunks.push({
      dateStr: date.toISOString().split('T')[0],
      sinceUnix,
      untilUnix
    });
  }
  
  console.log(`Prepared ${chunks.length} daily chunks for sync.`);
  console.log(`First chunk: ${chunks[0].dateStr}`);
  console.log(`Last chunk: ${chunks[chunks.length - 1].dateStr}`);
  
  console.log('Fetching daily core insights song song...');
  const startTime = Date.now();
  
  const promises = chunks.map(chunk => 
    client.request<any>(`${externalId}/insights`, accessToken, { 
      metric: 'reach,views,profile_views,profile_links_taps,accounts_engaged,total_interactions', 
      period: 'day',
      metric_type: 'total_value',
      since: chunk.sinceUnix,
      until: chunk.untilUnix
    }, 'GET', accountId).then(res => ({
      dateStr: chunk.dateStr,
      data: res.data,
      error: res.error
    }))
  );
  
  const results = await Promise.all(promises);
  console.log(`Finished fetching in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  
  // In ra kết quả của 5 ngày gần nhất để kiểm tra
  console.log('Sample Results (Last 5 Days):');
  const sampleResults = results.slice(-5);
  for (const res of sampleResults) {
    console.log(`\nDate: ${res.dateStr}`);
    if (res.error) {
      console.error(`  Error: ${res.error}`);
    } else if (res.data && Array.isArray(res.data.data)) {
      for (const item of res.data.data) {
        console.log(`  Metric: ${item.name} = ${item.total_value?.value}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
