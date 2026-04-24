// scratch/test-auto-select.ts
import { selectModel } from '../src/application/ai/model-selector';
import { AI_MODELS } from '../src/domain/types/ai';

console.log("\n🚀 Testing AI Model Auto-Selector Logic...\n");

const tests = [
  {
    name: "Default (Short English)",
    input: { text: "Hello, I need help with my order." },
    expected: AI_MODELS.GENERATE // llama-3.3-70b-versatile
  },
  {
    name: "Vietnamese Detection",
    input: { text: "Xin chào, shop cho mình hỏi giá bao nhiêu ạ?" },
    expected: AI_MODELS.CONVERSATION // qwen-qwq-32b
  },
  {
    name: "Long Context (History > 5)",
    input: { 
      text: "Can you summarize our discussion?", 
      history: ["Hi", "Hello", "How are you", "I am fine", "Great", "Tell me more"] 
    },
    expected: AI_MODELS.REASONING // openai/gpt-oss-120b
  },
  {
    name: "Long Text (> 2000 chars)",
    input: { text: "This is a very long text... ".repeat(100) },
    expected: AI_MODELS.REASONING // openai/gpt-oss-120b
  },
  {
    name: "User Manual Override (Ignore Auto)",
    input: { 
      text: "Tiếng Việt nhưng chọn model cụ thể", 
      userConfiguredModel: "llama-3.1-8b-instant" 
    },
    expected: "llama-3.1-8b-instant"
  },
  {
    name: "Auto with Vietnamese in History",
    input: { 
      text: "How much?", 
      history: ["Sản phẩm này rất tốt", "Cảm ơn bạn"] 
    },
    expected: AI_MODELS.CONVERSATION // qwen-qwq-32b
  }
];

let passed = 0;
tests.forEach(t => {
  const result = selectModel(t.input);
  const isMatch = result === t.expected;
  if (isMatch) passed++;
  
  console.log(`${isMatch ? '✅' : '❌'} ${t.name}`);
  console.log(`   - Result:   ${result}`);
  console.log(`   - Expected: ${t.expected}\n`);
});

console.log(`--- Result: ${passed}/${tests.length} passed ---\n`);
