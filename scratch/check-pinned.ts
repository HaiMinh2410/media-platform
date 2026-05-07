import { db } from '../src/lib/db';

async function main() {
  try {
    // Check if we can query is_pinned on Conversation and Message
    console.log('Querying raw database schema for conversations...');
    const convColumns = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'is_pinned'
    `;
    console.log('conversations.is_pinned columns:', convColumns);

    const msgColumns = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'is_pinned'
    `;
    console.log('messages.is_pinned columns:', msgColumns);

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await db.$disconnect();
  }
}

main();
