import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.accountGroup.findMany({
    include: {
      _count: {
        select: { members: true }
      }
    }
  });
  console.log('Groups found:', JSON.stringify(groups, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
