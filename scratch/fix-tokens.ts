import { db } from '../src/lib/db';

async function fixInstagramToken() {
  const fbAccount = await db.platformAccount.findFirst({
    where: { platform_user_name: 'Hải Minh', platform: 'facebook' },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
  });

  const igAccount = await db.platformAccount.findFirst({
    where: { platform_user_name: 'Hải Minh Instagram', platform: 'instagram' }
  });

  if (!fbAccount || !igAccount) {
    console.error('Accounts not found');
    return;
  }

  const token = fbAccount.meta_tokens[0];
  if (!token) {
    console.error('No token found on FB account');
    return;
  }

  console.log(`Copying token from FB (${fbAccount.id}) to IG (${igAccount.id})`);

  await db.meta_tokens.create({
    data: {
      account_id: igAccount.id,
      encrypted_access_token: token.encrypted_access_token,
      scopes: token.scopes,
      expires_at: token.expires_at
    }
  });

  console.log('✅ Token copied successfully');
}

fixInstagramToken().catch(console.error);
