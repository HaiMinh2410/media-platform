import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  try {
    // 1. Check if RLS is enabled
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname IN ('posts', 'publish_jobs');
    `);
    console.log('--- RLS Status ---');
    console.log(rlsRes.rows);

    // 2. Check policies
    const policyRes = await client.query(`
      SELECT tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename IN ('posts', 'publish_jobs');
    `);
    console.log('--- RLS Policies ---');
    console.log(policyRes.rows);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
