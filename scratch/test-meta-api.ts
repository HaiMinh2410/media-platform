import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { TokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  
  // 1. Get encrypted token
  const tokenRecord = await db.meta_tokens.findFirst({
    where: { account_id: 'f32e932a-6d47-45bb-8a20-48ceb50a960d' }
  });
  
  if (!tokenRecord) {
    console.error('Meta token not found!');
    await db.$disconnect();
    return;
  }
  
  // 2. Decrypt token
  const encryptionService = new TokenEncryptionService();
  const { data: accessToken, error } = await encryptionService.decrypt(tokenRecord.encrypted_access_token);
  
  if (error || !accessToken) {
    console.error('Decryption failed:', error);
    await db.$disconnect();
    return;
  }
  
  const externalId = '17841477493647789';
  
  // 3. Define the exact 30-day date range: 2026-04-18 to 2026-05-17
  // Note: we'll convert to Unix timestamps in UTC
  const since = Math.floor(new Date('2026-04-18T00:00:00Z').getTime() / 1000);
  const until = Math.floor(new Date('2026-05-17T23:59:59Z').getTime() / 1000);
  
  const url = `https://graph.facebook.com/v21.0/${externalId}/insights?metric=views,reach&period=day&metric_type=total_value&since=${since}&until=${until}&access_token=${accessToken}`;
  console.log('Fetching 30 days:', url.replace(accessToken, 'REDACTED'));
  
  const res = await fetch(url);
  const data = await res.json();
  
  console.log('Meta API Response:', JSON.stringify(data, null, 2));
  await db.$disconnect();
}

main().catch(console.error);
