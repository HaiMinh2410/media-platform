import { db } from '../src/lib/db';
import { buildDynamicSystemPrompt } from '../src/application/ai-agent/prompts/response-generator.prompt';

async function testGeneratedPrompt() {
  const latestLog = await db.aIReplyLog.findFirst({
    orderBy: { created_at: 'desc' },
    include: {
      message: {
        include: {
          conversation: {
            include: {
              platform_accounts: {
                include: {
                  ai_personas: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!latestLog) {
    console.log('❌ No AI reply log found.');
    return;
  }

  const conversation = latestLog.message?.conversation;
  const persona = conversation?.platform_accounts?.ai_personas || null;
  const customerGender = conversation?.gender || null;

  console.log('=== DATA FROM DB ===');
  console.log(`Persona: Name=${persona?.name}, Gender=${persona?.gender}`);
  console.log(`Customer Gender: ${customerGender}`);

  console.log('\n=== GENERATED SYSTEM PROMPT ===');
  const prompt = buildDynamicSystemPrompt(persona, customerGender);
  console.log(prompt);
  console.log('=================================');
}

testGeneratedPrompt().catch(console.error);
