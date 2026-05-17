import { getPlatformAccountRepository } from '../src/infrastructure/repositories/platform-account.repository';
import { getMetaGraphClient } from '../src/infrastructure/meta/graph-api.client';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d'; // Nguyen An Thu (Instagram)
  const repo = getPlatformAccountRepository();
  const { data: accountsWithTokens } = await repo.findAllWithMetaTokens();
  const accountWithToken = accountsWithTokens?.find(a => a.id === accountId);
  
  if (!accountWithToken || !accountWithToken.encryptedToken) {
    console.error('Missing Meta token for account:', accountId);
    return;
  }
  
  const crypto = getTokenEncryptionService();
  const decryptedRes = await crypto.decrypt(accountWithToken.encryptedToken);
  const accessToken = decryptedRes.data;
  
  if (!accessToken) {
    console.error('Decryption failed for account:', accountId);
    return;
  }
  
  const client = getMetaGraphClient();
  const externalId = accountWithToken.externalId;
  const sinceUnix = Math.floor(new Date('2026-05-14').getTime() / 1000);
  const untilUnix = Math.floor(new Date('2026-05-17').getTime() / 1000);
  
  console.log('--- DIAGNOSING DOUBLE BREAKDOWN METRICS ---');
  try {
    const res = await client.request<any>(`${externalId}/insights`, accessToken, { 
      metric: 'views', 
      breakdown: 'media_product_type,follow_type', 
      period: 'day',
      metric_type: 'total_value',
      since: sinceUnix,
      until: untilUnix
    }, 'GET', accountId);
    
    console.log('Double Breakdown Views API Response:');
    console.log(JSON.stringify(res, null, 2));
    
  } catch (err: any) {
    console.error('API request failed:', err);
  }
  
  console.log('\n--- DIAGNOSING SINGLE BREAKDOWN METRICS ---');
  try {
    const res = await client.request<any>(`${externalId}/insights`, accessToken, { 
      metric: 'views', 
      breakdown: 'media_product_type', 
      period: 'day',
      metric_type: 'total_value',
      since: sinceUnix,
      until: untilUnix
    }, 'GET', accountId);
    
    console.log('Single Breakdown Views API Response:');
    console.log(JSON.stringify(res.data, null, 2));
    
  } catch (err: any) {
    console.error('API request failed:', err);
  }
  
  process.exit(0);
}

main();
