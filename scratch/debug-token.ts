import { db } from '../src/lib/db';
import { getTokenEncryptionService } from '../src/infrastructure/crypto/token-encryption.service';

/**
 * DEBUG TOKEN CAPABILITIES
 */
async function debugToken() {
  const account = await db.platformAccount.findFirst({
    where: { platform: 'facebook', platform_user_id: '1183865494803444' }
  });

  if (!account) {
    console.error('❌ Không tìm thấy tài khoản Facebook trong DB');
    return;
  }

  const tokenRec = await db.meta_tokens.findFirst({
    where: { account_id: account.id }
  });

  if (!tokenRec) {
    console.error('❌ Không tìm thấy token trong DB');
    return;
  }

  const encryptionService = getTokenEncryptionService();
  const { data: token } = await encryptionService.decrypt(tokenRec.encrypted_access_token);

  console.log('--- Đang kiểm tra Token... ---');
  
  // 1. Kiểm tra thông tin "me" và link Instagram
  const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account&access_token=${token}`);
  const meData = await meRes.json();
  console.log('--- Thông tin Page hiện tại ---');
  console.log('Tên Page:', meData.name);
  console.log('ID Page:', meData.id);
  console.log('Instagram Business Account ID:', meData.instagram_business_account?.id || '❌ KHÔNG TÌM THẤY LIÊN KẾT');

  if (!meData.instagram_business_account) {
    console.log('\n⚠️ CẢNH BÁO: Fanpage này chưa được liên kết với Instagram Business Account trong API.');
    console.log('Hãy kiểm tra mục "Linked Accounts" trong cài đặt Fanpage trên Facebook.');
  }
}

debugToken().catch(console.error);
