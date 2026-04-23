import { classifyService } from '@/application/ai/classify.service';
import { generateService } from '../../generate.service';

/**
 * Script này dùng để kiểm tra xem AI (Groq) có đang hoạt động hay không.
 * Nó gọi trực tiếp Classify và Generate Services.
 */
async function testAI() {
  console.log('🚀 Đang kiểm tra AI Pipeline...');

  const textInput = 'Chào shop, sản phẩm này giá bao nhiêu vậy?';
  console.log(`\n[Test] Input: "${textInput}"`);

  // 1. Kiểm tra Classify
  console.log('\n--- 1. Testing AI Classification ---');
  const classifyResult = await classifyService.classify({
    text: textInput,
    platform: 'meta'
  });

  if (classifyResult.error) {
    console.error('❌ AI Classification failed:', classifyResult.error);
    return;
  }
  console.log('✅ Classify thành công:', JSON.stringify(classifyResult.data, null, 2));

  // 2. Kiểm tra Generate
  if (classifyResult.data) {
    console.log('\n--- 2. Testing AI Generation ---');
    const generateResult = await generateService.generate({
      text: textInput,
      classifyResult: classifyResult.data,
      platform: 'meta',
      history: [] // Mock history
    });

    if (generateResult.error) {
      console.error('❌ AI Generation failed:', generateResult.error);
      return;
    }
    console.log('✅ Generate thành công! AI Reply:');
    console.log(`> "${generateResult.data?.reply}"`);
  }

  console.log('\n✨ Kiểm tra hoàn tất. AI đang hoạt động tốt!');
}

testAI().catch(err => {
  console.error('\n❌ Lỗi không mong muốn:', err);
  process.exit(1);
});
