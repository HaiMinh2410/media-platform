import { db } from './src/lib/db';

async function main() {
  try {
    const groups = await db.accountGroup.findMany({
      take: 5
    });
    console.log('Sample groups:', JSON.stringify(groups, null, 2));
    
    // Check if position exists in the first row
    if (groups.length > 0) {
      console.log('Position field value:', (groups[0] as any).position);
    } else {
      console.log('No groups found in DB.');
    }
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await db.$disconnect();
  }
}

main();
