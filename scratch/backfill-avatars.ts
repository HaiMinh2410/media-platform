import { db } from '../src/shared/lib/db';

async function main() {
  console.log('Starting backfill for platform_accounts metadata avatars...');
  
  // 1. Fetch all publisher accounts that have an avatar_url
  const pubAccounts = await db.account.findMany({
    where: {
      avatar_url: { not: null }
    },
    select: {
      platform: true,
      platform_id: true,
      avatar_url: true
    }
  });

  console.log(`Found ${pubAccounts.length} publisher accounts with avatars.`);

  let updatedCount = 0;

  for (const pub of pubAccounts) {
    const platformLower = pub.platform.toLowerCase();
    
    // Find the matching legacy platform account
    const platAccount = await db.platformAccount.findFirst({
      where: {
        platform: platformLower,
        platform_user_id: pub.platform_id,
        disconnected_at: null
      }
    });

    if (platAccount) {
      const currentMeta = (platAccount.metadata || {}) as Record<string, any>;
      
      // Update metadata to include avatar_url
      await db.platformAccount.update({
        where: { id: platAccount.id },
        data: {
          metadata: {
            ...currentMeta,
            avatar_url: pub.avatar_url
          }
        }
      });
      
      console.log(`Updated avatar for account: ${platAccount.platform_user_name} (${platAccount.platform})`);
      updatedCount++;
    }
  }

  console.log(`Backfill completed. Updated ${updatedCount} platform accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
