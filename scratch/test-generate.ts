import { generateService } from '../src/application/ai/generate.service';

async function testGenerate() {
  console.log('🧪 Testing AI Generation...');
  const { data, error } = await generateService.generate({
    text: 'hello',
    platform: 'instagram',
    classifyResult: {
      intent: 'AUTO_REPLY',
      reason: 'Greeting',
      priority: 'low',
      category: 'other'
    },
    history: []
  });

  if (error) {
    console.error('❌ AI Generation Error:', error);
  } else {
    console.log('✅ AI Generation Success:', data);
  }
}

testGenerate().catch(console.error);
