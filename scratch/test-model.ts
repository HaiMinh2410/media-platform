import { groqClient } from '../src/infrastructure/ai/groq-client';

async function testModel() {
  console.log('🧪 Testing model: llama3-70b-8192...');
  const { data, error } = await groqClient.complete(
    [{ role: 'user', content: 'hello' }],
    { model: 'llama3-70b-8192' as any }
  );

  if (error) {
    console.error('❌ Model Error:', error);
  } else {
    console.log('✅ Model Success:', data?.content);
  }
}

testModel().catch(console.error);
