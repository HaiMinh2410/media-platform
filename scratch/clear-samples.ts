import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Clearing Sample Data ---');

  // We delete records from most dependent to least dependent
  const deletedMessages = await prisma.message.deleteMany({});
  console.log(`- Deleted ${deletedMessages.count} messages`);

  const deletedConvs = await prisma.conversation.deleteMany({});
  console.log(`- Deleted ${deletedConvs.count} conversations`);

  const deletedAccounts = await prisma.platformAccount.deleteMany({});
  console.log(`- Deleted ${deletedAccounts.count} platform accounts`);

  console.log('--- Done ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
