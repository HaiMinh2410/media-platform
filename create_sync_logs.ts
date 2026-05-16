import { db } from './src/lib/db';

async function main() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id  uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
        sync_type   TEXT NOT NULL DEFAULT 'auto',
        status      TEXT NOT NULL,
        error_msg   TEXT,
        records_synced INT DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("sync_logs table created successfully.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await db.$disconnect();
  }
}

main();
