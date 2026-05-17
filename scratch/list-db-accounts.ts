import { db } from '../src/lib/db';

async function main() {
  const accounts = await db.platformAccount.findMany({
    include: {
      meta_tokens: true
    }
  });

  console.log('List of platform accounts:');
  for (const acc of accounts) {
    console.log(`- ID: ${acc.id}`);
    console.log(`  Name: ${acc.platform_user_name}`);
    console.log(`  Platform: ${acc.platform}`);
    console.log(`  User ID: ${acc.platform_user_id}`);
    console.log(`  Disconnected: ${acc.disconnected_at}`);
    console.log(`  Tokens count: ${acc.meta_tokens.length}`);
    if (acc.meta_tokens.length > 0) {
      console.log(`  Last token updated: ${acc.meta_tokens[0].updated_at}`);
    }
  }
}

main().catch(console.error).finally(() => db.$disconnect());
