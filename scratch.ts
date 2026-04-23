import { db } from './src/lib/db';

async function main() {
  const workspaceId = "51fa4239-e10b-4ecb-a8fd-cd9e48bc0de6"; // from earlier logs

  // Insert Facebook Account
  await db.platformAccount.upsert({
    where: { platform_platform_user_id: { platform: 'facebook', platform_user_id: '1183865494803444' } },
    update: {},
    create: {
      workspaceId,
      profile_id: "33513f3f-860c-4694-9d02-daad2a8d8035",
      platform: 'facebook',
      platform_user_id: '1183865494803444',
      platform_user_name: 'Hải Minh Social Platform',
      metadata: { accessToken: "MOCK_TOKEN" }
    }
  });

  // Insert Instagram Account
  await db.platformAccount.upsert({
    where: { platform_platform_user_id: { platform: 'instagram', platform_user_id: '17841477493647789' } },
    update: {},
    create: {
      workspaceId,
      profile_id: "33513f3f-860c-4694-9d02-daad2a8d8035",
      platform: 'instagram',
      platform_user_id: '17841477493647789',
      platform_user_name: 'Hải Minh Instagram',
      metadata: { accessToken: "MOCK_TOKEN" }
    }
  });

  console.log('Seed successful! Platform accounts injected into Database.');
}

main().catch(console.error).finally(() => process.exit(0));
