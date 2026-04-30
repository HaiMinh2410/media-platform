import { db } from '@/lib/db';
import { ClassifyResult, GenerateInput } from '@/domain/types/ai-pipeline';
import { generateService } from '@/application/ai/generate.service';

export class AIRoutingService {
  /**
   * Routes a message based on classification and generates an appropriate response.
   * Returns { reply, isAutoReply, error }
   */
  async routeAndGenerate(
    accountId: string,
    messageText: string,
    classifyResult: ClassifyResult,
    platform?: string,
    history?: string[]
  ): Promise<{ reply: string | null; isAutoReply: boolean; error: string | null }> {
    try {
      console.log(`[AIRoutingService] Processing routing for account ${accountId}`);

      // 1. Fetch persona and matching rules
      const persona = await db.aIPersona.findUnique({
        where: { account_id: accountId }
      });

      const rules = await db.autoReplyRule.findMany({
        where: { account_id: accountId, is_active: true }
      });

      // 2. Simple matching logic
      const matchingRule = rules.find(r => 
        r.intent_category.toLowerCase() === classifyResult.category.toLowerCase() || 
        r.intent_category.toLowerCase() === classifyResult.intent.toLowerCase() ||
        r.keywords.some(k => messageText.toLowerCase().includes(k.toLowerCase()))
      );

      // 3. Construct dynamic system prompt
      let systemPrompt = `You are an AI assistant representing the business.`;
      
      if (persona) {
        systemPrompt += `\nYour persona name is ${persona.name}.`;
        systemPrompt += `\nTone instructions: ${persona.tone_instructions}`;
        systemPrompt += `\nLanguage preference: ${persona.language_preference}`;
        systemPrompt += `\nEmoji usage: ${persona.emoji_usage}`;
      }

      if (matchingRule) {
        systemPrompt += `\nImportant Rule: Base your reply on this template/knowledge: "${matchingRule.reply_template}"`;
      }

      // 4. Generate response
      const generateInput: GenerateInput = {
        text: messageText,
        classifyResult,
        history,
        platform,
        systemPrompt
      };

      const { data, error } = await generateService.generate(generateInput);

      if (error || !data || !data.reply) {
        return { reply: null, isAutoReply: false, error };
      }

      // 5. Determine routing mode
      // If we found a matching AutoReplyRule, or intent is explicitly AUTO_REPLY
      const isAutoReply = !!matchingRule || classifyResult.intent === 'AUTO_REPLY';

      return {
        reply: data.reply,
        isAutoReply,
        error: null
      };

    } catch (err: any) {
      console.error('❌ [AIRoutingService] Error:', err);
      return { reply: null, isAutoReply: false, error: err.message };
    }
  }
}

export const aiRoutingService = new AIRoutingService();
