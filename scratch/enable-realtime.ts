import { db } from '../src/lib/db';

async function enableRealtime() {
  try {
    // We use raw query since this is a DB configuration
    await db.$executeRawUnsafe(`
      -- 1. Enable replication for the messages table
      ALTER TABLE "public"."messages" REPLICA IDENTITY FULL;
      ALTER TABLE "public"."conversations" REPLICA IDENTITY FULL;
      
      -- 2. Add table to supabase_realtime publication
      DO $$
      BEGIN
        -- Add messages
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE "public"."messages";
        END IF;

        -- Add conversations
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE "public"."conversations";
        END IF;
      END $$;
    `);
    
    console.log('✅ Realtime replication and publication enabled for "messages" table.');
  } catch (err) {
    console.error('❌ Failed to enable realtime:', err);
  }
}

enableRealtime().catch(console.error);
