import { db } from '../src/shared/lib/db';

async function main() {
  // 1. Check publications
  const publications = await db.$queryRaw`
    SELECT pubname, schemaname, tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
  `;
  console.log('--- supabase_realtime Tables ---');
  console.log(publications);

  // 2. Check replica identity
  const replicaIdentities = await db.$queryRaw`
    SELECT relname, relreplident 
    FROM pg_class 
    WHERE relname IN ('posts', 'publish_jobs')
  `;
  console.log('--- Replica Identities ---');
  console.log(replicaIdentities);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await db.$disconnect();
  });
