import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const c = await db.conversation.findFirst({ where: { customer_name: 'Hai Minh' } });
  console.log(c?.id);
}
main().finally(() => db.$disconnect());
