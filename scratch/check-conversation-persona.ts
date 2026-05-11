import { db } from '../src/lib/db';

async function checkConversationPersona() {
  console.log('🔍 Checking latest AI reply log to trace conversation and persona...');
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

  console.log('\n========================================');
  console.log(`Log ID: ${latestLog.id}`);
  console.log(`Triggered by message: "${latestLog.message?.content}"`);
  console.log(`Response: "${latestLog.response}"`);
  
  const conversation = latestLog.message?.conversation;
  if (!conversation) {
    console.log('❌ Conversation associated with message not found.');
    return;
  }

  console.log('\n--- CONVERSATION DETAILS ---');
  console.log(`Conversation ID: ${conversation.id}`);
  console.log(`Account ID: ${conversation.account_id}`);
  console.log(`Gender (Customer): ${conversation.gender}`);

  const account = conversation.platform_accounts;
  if (!account) {
    console.log('❌ Platform account associated with conversation not found.');
    return;
  }

  console.log('\n--- PLATFORM ACCOUNT DETAILS ---');
  console.log(`Account ID: ${account.id}`);
  console.log(`Platform: ${account.platform}`);
  console.log(`Platform User Name: ${account.platform_user_name}`);

  const persona = account.ai_personas;
  if (!persona) {
    console.log('❌ No AIPersona entry found for this account.');
    return;
  }

  console.log('\n--- AI PERSONA DETAILS ---');
  console.log(`Persona ID: ${persona.id}`);
  console.log(`Name: ${persona.name}`);
  console.log(`Gender (Agent): ${persona.gender}`);
  console.log(`Personality: ${persona.personality}`);
  console.log(`Tone: ${persona.tone}`);
  console.log(`Speaking Style: ${persona.speaking_style}`);
}

checkConversationPersona().catch(console.error);
