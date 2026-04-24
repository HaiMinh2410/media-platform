import { classifyService } from '../src/application/ai/classify.service';

async function testAI() {
  console.log('🧪 Testing AI Classification...');
  const { data, error } = await classifyService.classify({
    text: 'hello',
    platform: 'instagram'
  });

  if (error) {
    console.error('❌ AI Classification Error:', error);
  } else {
    console.log('✅ AI Classification Success:', data);
  }
}

testAI().catch(console.error);
