import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkData() {
  const account = await db.platformAccount.findFirst();
  if (!account) {
    console.log('No accounts found');
    return;
  }
  console.log('Checking account:', account.id, account.platform_user_name);
  
  const posts = await db.post_analytics.findMany({
    where: { account_id: account.id },
    take: 10
  });
  
  console.log('Posts count:', posts.length);
  if (posts.length > 0) {
    console.log('Sample post:', JSON.stringify(posts[0], null, 2));
  }
}

checkData().catch(console.error).finally(() => db.$disconnect());
