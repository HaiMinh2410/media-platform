import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  try {
    // 1. Check publications
    const pubRes = await client.query(`
      SELECT pubname, schemaname, tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime';
    `);
    console.log('--- supabase_realtime Tables ---');
    console.log(pubRes.rows);

    // 2. Check replica identity
    const repRes = await client.query(`
      SELECT relname, relreplident 
      FROM pg_class 
      WHERE relname IN ('posts', 'publish_jobs');
    `);
    console.log('--- Replica Identities ---');
    console.log(repRes.rows);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
