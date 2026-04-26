import { db } from '../src/lib/db';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

/**
 * CONSOLIDATION SCRIPT
 * Xóa các tài khoản thừa, giữ lại duy nhất 1 Page Facebook và gắn mã chuẩn.
 */
const NEW_TOKEN = 'EABAX69avEfIBRf1A9DlrssZA7k1EqrA7MF58FH3KlKPqiX6dX2MyIlJJO9hKt9U6rtwohLtawn4FAEHzTHGYW24aEvKayWqjnB1oBWe4oSRZBZALDkhZC8hsEzrG8f1Yp86uEZCbEeVam7zXZAN6Ita7vc0jcqLRHlwsqRCEMX2Yj8lnvxIADSnTZAOhELZBTCY2msMbZCnMAuu5sHH7dWcLx2hcuYBEPJbkaaaBHZCNT2oIszhN9unX4zdF8ZD';
const CORRECT_PAGE_ID = '1183865494803444';

async function consolidateAndFix() {
  console.log('🧹 Đang dọn dẹp các tài khoản Facebook thừa...');

  const fbAccounts = await db.platformAccount.findMany({
    where: { platform: 'facebook' }
  });

  let mainAccount = fbAccounts.find(a => a.platform_user_id === CORRECT_PAGE_ID);
  
  if (!mainAccount) {
    if (fbAccounts.length > 0) {
      console.log(`🔄 Chuyển đổi account ${fbAccounts[0].id} sang ID ${CORRECT_PAGE_ID}...`);
      mainAccount = await db.platformAccount.update({
        where: { id: fbAccounts[0].id },
        data: { 
          platform_user_id: CORRECT_PAGE_ID, 
          platform_user_name: 'Hải Minh Social Platform' 
        }
      });
    } else {
      console.error('❌ Không tìm thấy tài khoản Facebook nào.');
      return;
    }
  }

  // Xóa các tài khoản FB khác
  const deleted = await db.platformAccount.deleteMany({
    where: { 
      platform: 'facebook',
      id: { not: mainAccount.id }
    }
  });
  console.log(`🗑 Đã xóa ${deleted.count} tài khoản trùng lặp.`);

  // Cập nhật Token
  const encryptionService = getTokenEncryptionService();
  const { data: encrypted } = await encryptionService.encrypt(NEW_TOKEN);

  await db.meta_tokens.deleteMany({ where: { account_id: mainAccount.id } });
  await db.meta_tokens.create({
    data: {
      account_id: mainAccount.id,
      encrypted_access_token: encrypted!,
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      updated_at: new Date()
    }
  });

  console.log(`✅ ĐÃ XONG! Hệ thống hiện chỉ giữ lại 1 Page Facebook ID: ${CORRECT_PAGE_ID}`);
  console.log('Xác nhận: account_id được dùng là ' + mainAccount.id);
  console.log('Thử nhắn tin lại nhé!');
}

consolidateAndFix().catch(console.error);
