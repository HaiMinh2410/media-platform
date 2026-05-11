// scratch/test-dynamic-prompt.ts
//
// Kịch bản kiểm thử lắp ghép Dynamic Prompt Blocks cho AIPersona

import { buildDynamicSystemPrompt } from '../src/application/ai-agent/prompts/response-generator.prompt';

console.log('🧪 [TestDynamicPrompt] Starting test suite for Dynamic Prompt Assembly...\n');

// 1. Mock Case: Một AIPersona hoàn chỉnh, đầy cá tính, cấu hình đầy đủ thông số chiến dịch và settings JSON
const mockCustomPersona = {
  id: 'd9b7f57a-9a99-444f-8ce6-7c0b0213b94a',
  account_id: 'e6378efd-bb27-4a61-9f20-b4da79927efb',
  name: 'Linh Chi',
  gender: 'female',
  age: 22,
  personality: 'Năng động, vui tính, thích đùa nhẹ nhưng luôn giữ sự bí ẩn, lôi cuốn.',
  tone: 'Ngọt ngào, gần gũi, sử dụng ngôn ngữ trẻ trung dí dỏm.',
  speaking_style: 'Xưng "Chi" gọi "anh" siêu ngọt, thỉnh thoảng thả thính hài hước.',
  signature_emojis: ['✨', '💖', '😜'],
  custom_instructions: 'Nhớ trêu fan khi họ tỏ ra quá nghiêm túc nhen!',
  system_prompt_override: null,
  campaign_name: 'Summer Love VIP Exclusive',
  current_offer: 'Giảm 30% cho gói VIP Private Room tuần này',
  scarcity_message: 'Ưu đãi chỉ dành cho 5 anh nhắn tin nhanh nhất hôm nay thui á',
  settings: {
    campaign_objective: 'Dẫn dắt fan hào hứng đăng ký tham gia Summer Love VIP Private Room để được trò chuyện video call trực tiếp.',
    response_delay_range: [15, 45],
  },
  tone_instructions: 'Be warm, playful and teasing.',
  emoji_usage: 'expressive',
  language_preference: 'vi',
};

// 2. Mock Case: Persona rỗng (sử dụng giá trị mặc định của hệ thống)
const mockDefaultPersona = null;

// 3. Mock Case: Persona có thiết lập ghi đè system_prompt_override
const mockOverridePersona = {
  name: 'Override Persona',
  system_prompt_override: 'Đây là system prompt bị ghi đè hoàn toàn bởi người dùng. Không lắp ghép bất cứ block nào cả!',
};

// --- CHẠY KIỂM THỬ ---

// Test Case 1: Lắp ghép Persona hoàn chỉnh
console.log('======================================================================');
console.log('🔥 TEST CASE 1: CUSTOM PERSONA & ACTIVE MARKETING CAMPAIGN ASSEMBLY');
console.log('======================================================================');
const customPrompt = buildDynamicSystemPrompt(mockCustomPersona);
console.log(customPrompt);
console.log('\n----------------------------------------------------------------------\n');

// Test Case 2: Lắp ghép Persona mặc định
console.log('======================================================================');
console.log('🔥 TEST CASE 2: DEFAULT PERSONA (NULL FALLBACK) ASSEMBLY');
console.log('======================================================================');
const defaultPrompt = buildDynamicSystemPrompt(mockDefaultPersona);
console.log(defaultPrompt);
console.log('\n----------------------------------------------------------------------\n');

// Test Case 3: Ghi đè hệ thống prompt
console.log('======================================================================');
console.log('🔥 TEST CASE 3: SYSTEM PROMPT OVERRIDE ACTIVE');
console.log('======================================================================');
const overridePrompt = buildDynamicSystemPrompt(mockOverridePersona);
console.log(overridePrompt);
console.log('\n======================================================================');
console.log('✅ [TestDynamicPrompt] All test cases executed successfully!');
