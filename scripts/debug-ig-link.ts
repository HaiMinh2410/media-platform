import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

function decryptToken(encryptedString: string): string | null {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!keyHex) return null;
  const key = Buffer.from(keyHex, 'hex');
  const parts = encryptedString.split(':');
  if (parts.length !== 3) return null;
  try {
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let dec = decipher.update(ciphertextHex, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch (e: any) {
    return null;
  }
}

async function main() {
  console.log('=== Debugging Instagram - Page Linkage via Meta Graph API ===\n');

  // Lấy token của trang Hai Minh Platform (Facebook Page)
  const pageAccount = await db.platformAccount.findFirst({
    where: { platform: 'facebook', platform_user_id: '1006289889245664' },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
  });

  if (!pageAccount || !pageAccount.meta_tokens[0]) {
    console.log('❌ Không tìm thấy thông tin Page Hai Minh Platform hoặc Token trong DB!');
    return;
  }

  const token = decryptToken(pageAccount.meta_tokens[0].encrypted_access_token);
  if (!token) {
    console.log('❌ Giải mã token thất bại!');
    return;
  }

  console.log('✅ Đã giải mã thành công Page Access Token.');

  // 1. Gọi Meta API để hỏi xem Page này đang liên kết với Instagram Business Account nào
  const linkUrl = `https://graph.facebook.com/v21.0/1006289889245664?fields=instagram_business_account,name&access_token=${token}`;
  console.log(`📡 Đang gọi API: GET /1006289889245664?fields=instagram_business_account ...`);
  
  const linkRes = await fetch(linkUrl);
  const linkJson = await linkRes.json() as any;

  console.log('📝 Phản hồi từ Meta:', JSON.stringify(linkJson, null, 2));

  if (linkJson.instagram_business_account) {
    const igId = linkJson.instagram_business_account.id;
    console.log(`\n🎉 Meta xác nhận Page này LIÊN KẾT với Instagram Account ID: ${igId}`);

    // 2. Lấy thông tin chi tiết của Instagram Account này
    const igInfoUrl = `https://graph.facebook.com/v21.0/${igId}?fields=username,name,profile_picture_url&access_token=${token}`;
    const igRes = await fetch(igInfoUrl);
    const igJson = await igRes.json() as any;
    console.log('📝 Thông tin Instagram Account từ Meta:', JSON.stringify(igJson, null, 2));
  } else {
    console.log('\n❌ CẢNH BÁO: Meta báo Page này KHÔNG liên kết với bất kỳ Instagram Business Account nào!');
  }
}

main().catch(console.error).finally(() => db.$disconnect());
