import { db } from '../src/lib/db';

async function enableReplication() {
  console.log('🚀 Enabling Realtime replication for core tables...');
  
  try {
    // 1. Ensure publication exists
    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
          CREATE PUBLICATION supabase_realtime;
        END IF;
      END $$;
    `);

    // 2. Add tables to publication
    const tables = ['conversations', 'messages', 'ai_reply_logs'];
    for (const table of tables) {
      await db.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = '${table}'
          ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};
          END IF;
        END $$;
      `);
      console.log(`✅ Table '${table}' added to supabase_realtime publication.`);
    }

    console.log('✨ All done!');
  } catch (error) {
    console.error('❌ Failed to enable replication:', error);
  }
}

enableReplication().catch(console.error);
