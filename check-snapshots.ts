import { db } from './src/lib/db';
import { getTokenEncryptionService } from './src/infrastructure/crypto/token-encryption.service';
import { getMetaGraphClient } from './src/infrastructure/meta/graph-api.client';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d';
  const account = await db.platformAccount.findUnique({
    where: { id: accountId },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
  });

  if (!account || !account.meta_tokens[0]) {
    console.log('Account or token not found');
    return;
  }

  const encryptionService = getTokenEncryptionService();
  const { data: accessToken } = await encryptionService.decrypt(account.meta_tokens[0].encrypted_access_token);
  if (!accessToken) {
    console.log('Decryption failed');
    return;
  }

  const client = getMetaGraphClient();
  const imageId = '18115724395775505';
  
  console.log('Testing views on image:', imageId);
  const res = await client.request<any>(`${imageId}/insights`, accessToken, { metric: 'views' });
  if (res.data) {
    console.log(`- Supported views on image!`);
    console.log(res.data);
  } else {
    console.log(`- Not supported views on image (${res.error?.message})`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
