import "dotenv/config";
import pg from 'pg';

async function main() {
  if (!process.env.DIRECT_URL) {
    console.error('DIRECT_URL not found in env');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: process.env.DIRECT_URL
  });

  await client.connect();
  console.log('Connected to DB. Applying RLS policies for Publisher models...');

  try {
    // Enable RLS
    await client.query(`ALTER TABLE "public"."publisher_accounts" ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE "public"."publisher_tokens" ENABLE ROW LEVEL SECURITY;`);

    // Account policies: Only own profile can access
    const policies = [
      {
        name: "Users can view their own publisher accounts",
        sql: `CREATE POLICY "Users can view their own publisher accounts" ON "public"."publisher_accounts" FOR SELECT USING (auth.uid() = profile_id);`
      },
      {
        name: "Users can insert their own publisher accounts",
        sql: `CREATE POLICY "Users can insert their own publisher accounts" ON "public"."publisher_accounts" FOR INSERT WITH CHECK (auth.uid() = profile_id);`
      },
      {
        name: "Users can update their own publisher accounts",
        sql: `CREATE POLICY "Users can update their own publisher accounts" ON "public"."publisher_accounts" FOR UPDATE USING (auth.uid() = profile_id);`
      },
      {
        name: "Users can delete their own publisher accounts",
        sql: `CREATE POLICY "Users can delete their own publisher accounts" ON "public"."publisher_accounts" FOR DELETE USING (auth.uid() = profile_id);`
      }
    ];

    for (const policy of policies) {
      try {
        await client.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = '${policy.name}') THEN
              ${policy.sql}
            END IF;
          END $$;
        `);
        console.log(`- Policy applied: ${policy.name}`);
      } catch (err: any) {
        console.error(`- Error applying policy ${policy.name}: ${err.message}`);
      }
    }

    // Token policies: No one can access tokens directly via RLS (Server-side bypasses RLS using Service Role)
    // By default, enabling RLS without policies means no one (except service role) can access.
    
    console.log('RLS policies applied successfully.');
  } catch (err: any) {
    console.error('Error during RLS application:', err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
