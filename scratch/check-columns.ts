import { db } from '../src/lib/db';

async function checkColumns() {
  try {
    const columns = await db.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages';
    `);
    console.log('Columns in messages table:', columns);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkColumns().catch(console.error);
