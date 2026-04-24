import { db } from '../src/lib/db';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

/**
 * FIX INSTAGRAM ACCOUNT & TOKEN
 * Cập nhật ID Instagram mới (Sully.ng) và đồng bộ Token.
 */
const NEW_TOKEN = 'EABAX69avEfIBRd9rrmtyDTnPS8rw7SzS0ZBuiyLratqUatsZAdZBg00pBa6vzt7PRvBJtp5HVan7PgtIUNLeRlrE9brgGD2YgZCtBkW39fE4C6A6ubX25qZBSSnYph6Y4NVwTollMayvgVW8QZCiSxq5ufMC5F9ROd2I9793oQvpkGrmFGePsSCHnQaygKdh9ThEcyZCjVJHxeZAPck1v4oAAIctKb9puVvJ6ZAFJM5dEcPTZBZCiv8dZBumsDfaXGgZD';
const NEW_INSTAGRAM_ID = '17841477990850937';
const NEW_INSTAGRAM_NAME = '_sullybbi';
const FACEBOOK_PAGE_ID = '1183865494803444';

async function fixInstagram() {
  console.log('🚀 Đang cập nhật tài khoản Instagram Sully.ng...');

  const encryptionService = getTokenEncryptionService();
  const { data: encryptedToken } = await encryptionService.encrypt(NEW_TOKEN);

  if (!encryptedToken) {
    console.error('❌ Lỗi mã hóa token');
    return;
  }

  // 1. Tìm tài khoản Instagram hiện tại
  const igAccount = await db.platformAccount.findFirst({
    where: { platform: 'instagram' }
  });

  if (igAccount) {
    console.log(`📝 Cập nhật tài khoản Instagram: ${igAccount.id}`);
    await db.platformAccount.update({
      where: { id: igAccount.id },
      data: {
        platform_user_id: NEW_INSTAGRAM_ID,
        platform_user_name: NEW_INSTAGRAM_NAME,
        metadata: { accessToken: 'STABLE_TOKEN_SYNCED' }
      }
    });

    // Cập nhật token
    const existingIgToken = await db.meta_tokens.findFirst({ where: { account_id: igAccount.id } });
    if (existingIgToken) {
      await db.meta_tokens.update({
        where: { id: existingIgToken.id },
        data: { 
          encrypted_access_token: encryptedToken,
          updated_at: new Date()
        }
      });
    } else {
      await db.meta_tokens.create({
        data: {
          account_id: igAccount.id,
          encrypted_access_token: encryptedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      });
    }
  } else {
    console.log('➕ Không tìm thấy tài khoản Instagram, tạo mới...');
    // Lấy profile_id và workspaceId từ tài khoản Facebook
    const fbAccount = await db.platformAccount.findFirst({
      where: { platform_user_id: FACEBOOK_PAGE_ID }
    });

    if (fbAccount) {
      const newIg = await db.platformAccount.create({
        data: {
          platform: 'instagram',
          platform_user_id: NEW_INSTAGRAM_ID,
          platform_user_name: NEW_INSTAGRAM_NAME,
          profile_id: fbAccount.profile_id,
          workspaceId: fbAccount.workspaceId,
          metadata: { accessToken: 'STABLE_TOKEN_SYNCED' }
        }
      });

      await db.meta_tokens.create({
        data: {
          account_id: newIg.id,
          encrypted_access_token: encryptedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // 2. Đồng bộ token cho tài khoản Facebook Page
  const fbAccount = await db.platformAccount.findFirst({
    where: { platform_user_id: FACEBOOK_PAGE_ID }
  });

  if (fbAccount) {
    console.log(`📝 Cập nhật token cho Facebook Page: ${fbAccount.id}`);
    const existingFbToken = await db.meta_tokens.findFirst({ where: { account_id: fbAccount.id } });
    if (existingFbToken) {
      await db.meta_tokens.update({
        where: { id: existingFbToken.id },
        data: { 
          encrypted_access_token: encryptedToken,
          updated_at: new Date()
        }
      });
    } else {
      await db.meta_tokens.create({
        data: {
          account_id: fbAccount.id,
          encrypted_access_token: encryptedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  console.log('✅ ĐÃ CẬP NHẬT XONG! ID Instagram mới:', NEW_INSTAGRAM_ID);
}

fixInstagram().catch(console.error);
