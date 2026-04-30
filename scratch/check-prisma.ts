import { db } from '../src/lib/db';

async function main() {
  console.log('Prisma Client models:', Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')));
}

main();
