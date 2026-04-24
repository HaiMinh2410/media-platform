import { db } from '../src/lib/db';

async function nuclearFix() {
  console.log('☢️ Running Nuclear Realtime Fix...');
  
  try {
    const sql = `
      -- 1. Ensure RLS is disabled for these tables
      ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
      ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
      ALTER TABLE ai_reply_logs DISABLE ROW LEVEL SECURITY;

      -- 2. Grant all permissions to public roles (for testing)
      GRANT ALL ON messages TO anon, authenticated;
      GRANT ALL ON conversations TO anon, authenticated;
      GRANT ALL ON ai_reply_logs TO anon, authenticated;

      -- 3. Reset Publication
      DROP PUBLICATION IF EXISTS supabase_realtime;
      CREATE PUBLICATION supabase_realtime FOR TABLE messages, conversations, ai_reply_logs;

      -- 4. Set Replica Identity
      ALTER TABLE messages REPLICA IDENTITY FULL;
      ALTER TABLE conversations REPLICA IDENTITY FULL;
      ALTER TABLE ai_reply_logs REPLICA IDENTITY FULL;
    `;
    
    await db.$executeRawUnsafe(sql);
    console.log('✅ Nuclear fix applied! Please refresh your browser.');
    
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

nuclearFix().catch(console.error);
