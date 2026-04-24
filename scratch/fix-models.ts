import { db } from '../src/lib/db';
import { AI_MODELS } from '../src/domain/types/ai';

async function fixBotModels() {
  console.log('🛠 Updating bot configurations to use supported models...');
  
  const result = await db.bot_configurations.updateMany({
    where: {
      model: 'llama3-70b-8192'
    },
    data: {
      model: AI_MODELS.GENERATE
    }
  });

  console.log(`✅ Updated ${result.count} bot configurations.`);
}

fixBotModels().catch(console.error);
