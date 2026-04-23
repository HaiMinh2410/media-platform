import { db } from '../src/lib/db';
import { classifyService } from '../src/application/ai/classify.service';
import { generateService } from '../generate.service';
import { AI_MODELS } from '../src/domain/types/ai';

async function generateMissingSuggestions() {
  // Find conversations with recent messages but no AI logs
  const conversations = await db.conversation.findMany({
    include: {
      messages: {
        where: { senderType: 'user' },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      platform_accounts: {
        include: { bot_configurations: true }
      }
    }
  });

  for (const conv of conversations) {
    const lastMsg = conv.messages[0];
    const botConfig = conv.platform_accounts.bot_configurations;

    if (lastMsg && botConfig?.is_active) {
      console.log(`Processing conversation ${conv.id}...`);
      
      try {
        const { data: classifyResult } = await classifyService.classify({
          text: lastMsg.content,
          platform: conv.platform_accounts.platform
        });

        if (classifyResult) {
          const { data: generateResult } = await generateService.generate({
            text: lastMsg.content,
            classifyResult,
            platform: conv.platform_accounts.platform,
            history: []
          });

          if (generateResult?.reply) {
            await db.aIReplyLog.create({
              data: {
                messageId: lastMsg.id,
                prompt: `Manual Fix | Intent: ${classifyResult.intent}`,
                response: generateResult.reply,
                model: botConfig.model || AI_MODELS.GENERATE,
                status: 'pending'
              }
            });
            console.log(`✅ Generated suggestion for ${conv.id}`);
          }
        }
      } catch (e) {
        console.error(`Error for ${conv.id}:`, e);
      }
    }
  }
}

generateMissingSuggestions().catch(console.error);
