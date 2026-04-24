import { db } from '../src/lib/db';

async function checkRLS() {
  console.log('🔍 Checking RLS status and policies for core tables...');
  
  try {
    // Check if RLS is enabled
    const rlsStatus = await db.$queryRawUnsafe(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('messages', 'conversations');
    `);
    console.log('RLS Status:', rlsStatus);

    // Check policies
    const policies = await db.$queryRawUnsafe(`
      SELECT * FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('messages', 'conversations');
    `);
    console.log('Policies:', policies);

    // Check if supabase_realtime publication is actually working
    const pubTables = await db.$queryRawUnsafe(`
      SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
    `);
    console.log('Publication Tables:', pubTables);

  } catch (error) {
    console.error('❌ Error checking RLS:', error);
  }
}

checkRLS().catch(console.error);
