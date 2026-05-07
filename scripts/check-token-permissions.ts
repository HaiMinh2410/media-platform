import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import crypto from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

function decryptToken(encryptedString: string): string {
  const keyHex = process.env.META_TOKEN_ENCRYPTION_KEY;
  if (!keyHex) throw new Error('META_TOKEN_ENCRYPTION_KEY is not set');
  const key = Buffer.from(keyHex, 'hex');
  const parts = encryptedString.split(':');
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function main() {
  console.log('=== Debugging Page Token Permissions via /debug_token ===\n');

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('META_APP_ID or META_APP_SECRET is not set in .env');
  }

  const fbPages = await db.platformAccount.findMany({
    where: { platform: 'facebook' },
    include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
  });

  for (const page of fbPages) {
    const tokenRec = page.meta_tokens[0];
    if (!tokenRec) continue;

    let decryptedToken: string;
    try {
      decryptedToken = decryptToken(tokenRec.encrypted_access_token);
    } catch (e) {
      continue;
    }

    console.log(`── Page: ${page.platform_user_name} (ID: ${page.platform_user_id}) ──`);
    
    // Gọi API debug_token
    const url = `https://graph.facebook.com/v21.0/debug_token?input_token=${decryptedToken}&access_token=${appId}|${appSecret}`;
    try {
      const res = await fetch(url);
      const json = await res.json() as any;
      if (json.error) {
        console.log(`  ❌ Lỗi: ${json.error.message}`);
      } else {
        const data = json.data || {};
        const scopes = data.scopes || [];
        console.log(`  ✅ Token Type: ${data.type}`);
        console.log(`  ✅ Is Valid: ${data.is_valid}`);
        console.log(`  ✅ Scopes (${scopes.length}): [${scopes.join(', ')}]`);
        if (data.error) {
          console.log(`  ⚠️ Token Error: ${JSON.stringify(data.error)}`);
        }
      }
    } catch (err: any) {
      console.log(`  ❌ Lỗi gọi API: ${err.message}`);
    }
    console.log('');
  }
}

main().finally(() => db.$disconnect());
