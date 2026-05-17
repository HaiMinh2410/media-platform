import { db } from './src/lib/db';
import { getTokenEncryptionService } from './src/infrastructure/crypto/token-encryption.service';
import { getMetaGraphClient } from './src/infrastructure/meta/graph-api.client';

async function main() {
  try {
    const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d';
    const account = await db.platformAccount.findUnique({
      where: { id: accountId },
      include: {
        meta_tokens: {
          orderBy: { updated_at: 'desc' },
          take: 1
        }
      }
    });

    if (!account) {
      console.log('Account not found in DB!');
      return;
    }

    console.log('Found account:', account.platform_user_name, 'External ID:', account.platform_user_id);

    const encryptedToken = account.meta_tokens[0]?.encrypted_access_token;

    if (!encryptedToken) {
      console.log('No encrypted token found!');
      return;
    }

    const encryptionService = getTokenEncryptionService();
    const { data: accessToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

    if (decryptError || !accessToken) {
      console.log('Token decryption failed:', decryptError);
      return;
    }

    console.log('Decrypted token successfully. Length:', accessToken.length);

    // Import and call actual sync service
    const { metaAnalyticsService } = require('./src/application/services/meta-analytics.service');
    console.log('Triggering real syncAccount...');
    const result = await metaAnalyticsService.syncAccount({
      accountId: account.id,
      externalId: account.platform_user_id,
      platform: 'instagram',
      encryptedToken
    });

    console.log('Real syncAccount result:', result);

  } catch (err) {
    console.error('Critical failure:', err);
  } finally {
    await db.$disconnect();
  }
}

main();
