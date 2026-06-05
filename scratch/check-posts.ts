import { db } from '../src/shared/lib/db';

async function main() {
  console.log('--- Platform Accounts ---');
  const accounts = await db.platformAccount.findMany({
    select: { id: true, platform_user_name: true, platform: true }
  });
  console.log(accounts);

  console.log('--- Posts ---');
  const posts = await db.posts.findMany({
    select: { id: true, title: true, content: true, status: true, account_id: true }
  });
  console.log(posts);

  console.log('--- Publish Jobs ---');
  const jobs = await db.publishJob.findMany({
    select: { id: true, batch_id: true, status: true, account_id: true }
  });
  console.log(jobs);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await db.$disconnect();
  });
