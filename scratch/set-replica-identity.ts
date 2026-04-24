import { db } from '../src/lib/db';

async function setReplicaIdentity() {
  console.log('🔄 Setting REPLICA IDENTITY FULL for core tables...');
  
  try {
    const tables = ['conversations', 'messages', 'ai_reply_logs'];
    for (const table of tables) {
      await db.$executeRawUnsafe(`ALTER TABLE ${table} REPLICA IDENTITY FULL;`);
      console.log(`✅ Table '${table}' set to REPLICA IDENTITY FULL.`);
    }
    console.log('✨ All done!');
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

setReplicaIdentity().catch(console.error);
