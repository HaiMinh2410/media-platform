import { db } from '../src/lib/db';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

/**
 * SPLIT INSTAGRAM ACCOUNTS
 * Đảm bảo _sullybbi và lunars_ng là 2 bản ghi riêng biệt.
 */
const NEW_TOKEN = 'EABAX69avEfIBRd9rrmtyDTnPS8rw7SzS0ZBuiyLratqUatsZAdZBg00pBa6vzt7PRvBJtp5HVan7PgtIUNLeRlrE9brgGD2YgZCtBkW39fE4C6A6ubX25qZBSSnYph6Y4NVwTollMayvgVW8QZCiSxq5ufMC5F9ROd2I9793oQvpkGrmFGePsSCHnQaygKdh9ThEcyZCjVJHxeZAPck1v4oAAIctKb9puVvJ6ZAFJM5dEcPTZBZCiv8dZBumsDfaXGgZD';

async function splitAccounts() {
  const encryptionService = getTokenEncryptionService();
  const { data: encryptedToken } = await encryptionService.encrypt(NEW_TOKEN);
  
  if (!encryptedToken) return;

  const workspaceId = '51fa4239-e10b-4ecb-a8fd-cd9e48bc0de6';
  const profileId = '33513f3f-860c-4694-9d02-daad2a8d8035';

  // 1. Tạo/Cập nhật _sullybbi
  console.log('📝 Đảm bảo tài khoản _sullybbi tồn tại...');
  const sullyAccount = await db.platformAccount.upsert({
    where: { 
      platform_platform_user_id: { 
        platform: 'instagram', 
        platform_user_id: '17841477990850937' 
      } 
    },
    update: { platform_user_name: '_sullybbi' },
    create: {
      platform: 'instagram',
      platform_user_id: '17841477990850937',
      platform_user_name: '_sullybbi',
      workspaceId,
      profile_id: profileId,
    }
  });

  // 2. Tạo/Cập nhật lunars_ng
  console.log('📝 Đảm bảo tài khoản lunars_ng tồn tại...');
  const lunarAccount = await db.platformAccount.upsert({
    where: { 
      platform_platform_user_id: { 
        platform: 'instagram', 
        platform_user_id: '17841477493647789' 
      } 
    },
    update: { platform_user_name: 'lunars_ng' },
    create: {
      platform: 'instagram',
      platform_user_id: '17841477493647789',
      platform_user_name: 'lunars_ng',
      workspaceId,
      profile_id: profileId,
    }
  });

  // 3. Cập nhật token cho cả 2
  for (const acc of [sullyAccount, lunarAccount]) {
    const existingToken = await db.meta_tokens.findFirst({ where: { account_id: acc.id } });
    if (existingToken) {
      await db.meta_tokens.update({
        where: { id: existingToken.id },
        data: { encrypted_access_token: encryptedToken }
      });
    } else {
      await db.meta_tokens.create({
        data: {
          account_id: acc.id,
          encrypted_access_token: encryptedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // 4. Di chuyển các hội thoại cũ về đúng account
  console.log('🚚 Đang di chuyển hội thoại về đúng tài khoản...');
  
  // Hội thoại cho lunars_ng (ID sender 1001499849209648 trong screenshot 2)
  await db.conversation.updateMany({
    where: { platform_conversation_id: '1001499849209648' },
    data: { account_id: lunarAccount.id }
  });

  // Hội thoại cho An Thư (ID sender 17841477493647789)
  await db.conversation.updateMany({
    where: { platform_conversation_id: '17841477493647789' },
    data: { account_id: lunarAccount.id }
  });

  console.log('✅ Hoàn tất tách tài khoản!');
}

splitAccounts().catch(console.error);
