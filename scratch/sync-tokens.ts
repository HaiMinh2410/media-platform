import { db } from '../src/lib/db';

async function syncTokens() {
  const FB_ID = 'bf77ae9a-1165-4de7-8d00-52584db17427';
  const IG_ID = '2f5a45e5-ccd0-4aeb-80a9-14bd224cc714';

  console.log('🔄 Syncing tokens from Facebook to Instagram...');

  const fbToken = await db.meta_tokens.findFirst({
    where: { account_id: FB_ID },
    orderBy: { updated_at: 'desc' }
  });

  if (!fbToken) {
    console.error('❌ Facebook token not found!');
    return;
  }

  // Update or create IG token
  await db.meta_tokens.deleteMany({ where: { account_id: IG_ID } });
  await db.meta_tokens.create({
    data: {
      account_id: IG_ID,
      encrypted_access_token: fbToken.encrypted_access_token,
      expires_at: fbToken.expires_at,
      updated_at: new Date()
    }
  });

  console.log('✅ Instagram token updated with Facebook Page token.');
}

syncTokens().catch(console.error);
