import { db } from '../src/lib/db';

async function fixRLSMore() {
  try {
    await db.$executeRawUnsafe(`ALTER TABLE ai_reply_logs DISABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS DISABLED for ai_reply_logs.');
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

fixRLSMore().catch(console.error);
