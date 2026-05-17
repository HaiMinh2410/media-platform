import { db } from '../src/lib/db';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d'; // Nguyen An Thu (Instagram)
  const tokenRecord = await db.meta_tokens.findFirst({
    where: { account_id: accountId }
  });
  
  if (!tokenRecord) {
    console.error('Token not found');
    return;
  }

  const encryptionService = getTokenEncryptionService();
  const decrypted = await encryptionService.decrypt(tokenRecord.encrypted_access_token);
  
  console.log('Encrypted text format:');
  console.log(tokenRecord.encrypted_access_token.substring(0, 30) + '...');
  
  console.log('Decrypted result:');
  console.log(JSON.stringify(decrypted, null, 2));
  
  if (decrypted.data) {
    const token = decrypted.data;
    console.log(`Length: ${token.length}`);
    console.log(`Starts with: ${token.substring(0, 10)}`);
    console.log(`Ends with: ${token.substring(token.length - 10)}`);
  }
}

main().catch(console.error).finally(() => db.$disconnect());
