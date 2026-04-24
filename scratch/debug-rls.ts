import { db } from '../src/lib/db';

async function debugRLS() {
  console.log('🛡️ Debugging RLS for messages table...');
  
  try {
    const results = await db.$queryRawUnsafe(`
      SELECT 
        schemaname, 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check 
      FROM pg_policies 
      WHERE tablename = 'messages';
    `);
    
    console.log('Policies found:', JSON.stringify(results, null, 2));
    
    const rlsEnabled = await db.$queryRawUnsafe(`
      SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'messages';
    `);
    console.log('RLS Enabled:', rlsEnabled);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugRLS().catch(console.error);
