import { db } from '../src/lib/db';

async function main() {
  const accounts = await db.platformAccount.findMany();
  console.log('Accounts in DB:');
  accounts.forEach(a => {
    console.log(`- ID: ${a.id}, Name: ${a.name}, Platform: ${a.platform}, needs_reauth: ${a.needs_reauth}`);
  });
}

main().catch(console.error);
