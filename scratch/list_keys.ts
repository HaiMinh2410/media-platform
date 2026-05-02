import { db } from '../src/lib/db';

async function main() {
  const keys = Object.keys(db);
  console.log('--- Prisma Client Keys ---');
  console.log(keys.filter(k => !k.startsWith('_')).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
