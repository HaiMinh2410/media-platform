import { getTopPostsAction } from '@/application/actions/analytics.actions';

async function main() {
  const accountId = 'f32e932a-6d47-45bb-8a20-48ceb50a960d';
  console.log('--- TESTING TOP POSTS FOR ACCOUNT:', accountId, '---');

  const metrics = ['interactions', 'reach', 'likes', 'profile_visits', 'follows'] as const;

  for (const metric of metrics) {
    try {
      const res = await getTopPostsAction(accountId, '30d', undefined, undefined, metric);
      console.log(`Metric: ${metric} | Posts count: ${res.data?.length ?? 0}`);
      if (res.data && res.data.length > 0) {
        console.log(`First post ID: ${res.data[0].postId} | Value:`, {
          totalInteractions: res.data[0].totalInteractions,
          reach: res.data[0].reach,
          likeCount: res.data[0].likeCount,
          profileVisits: res.data[0].profileVisits,
          follows: res.data[0].follows,
        });
      }
    } catch (err) {
      console.error(`Failed to get top posts for ${metric}:`, err);
    }
  }

  process.exit(0);
}

main();
