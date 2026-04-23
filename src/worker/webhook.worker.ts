import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName, WebhookJobPayload } from '@/domain/types/queue';
import { idempotentPersistMessage } from '@/infrastructure/repositories/message.repository';
import { classifyService } from '@/application/ai/classify.service';
import { generateService } from '@/application/ai/generate.service';
import { metaSendService } from '@/application/services/meta-send.service';
import { db } from '@/lib/db';
import { AI_MODELS } from '@/domain/types/ai';

/**
 * Webhook Event Worker.
 * Processes enqueued webhook events from Meta, TikTok, etc.
 * 
 * Flow:
 * 1. Persist User Message (Idempotent)
 * 2. Check Bot Config
 * 3. AI Classify
 * 4. AI Generate
 * 5. Send via Meta API
 * 6. Persist Bot Message + AI Log
 */
function createWebhookWorker() {
  if (!redisConnection) {
    console.error('[Worker] Cannot initialize Webhook Worker: Redis connection is missing.');
    return null;
  }

  const worker = new Worker<WebhookJobPayload>(
    QueueName.WEBHOOK_EVENTS,
    async (job: Job<WebhookJobPayload>) => {
      const { webhookEventId, platform, externalSenderId, externalPageId, platformMessageId, timestamp } = job.data;
      const messageText = job.data.messageText || '';

      console.log(`[Worker] [${job.id}] Processing event ${webhookEventId} from ${platform}`);

      try {
        // --- 1. Persist Incoming Message ---
        const { data: persistResult, error: persistErr } = await idempotentPersistMessage({
          platform,
          externalPageId,
          externalSenderId,
          platformMessageId,
          senderType: 'user',
          messageText,
          timestamp: new Date(timestamp),
        });

        if (persistErr || !persistResult) {
          throw new Error(`Message persistence failed: ${persistErr}`);
        }

        if (!persistResult.isNewMessage) {
          console.log(`[Worker] [${job.id}] Message ${platformMessageId} already processed (deduped).`);
          return { status: 'deduplicated', eventId: webhookEventId };
        }

        console.log(`[Worker] [${job.id}] Persisted new user message ${persistResult.messageId}`);

        // Skip bot processing if there's no actual text (e.g. just an image without text)
        if (!messageText.trim()) {
          return { status: 'success_no_text', eventId: webhookEventId };
        }

        // --- 2. Check Bot Configurations ---
        const account = await db.platformAccount.findFirst({
          where: {
            platform,
            platform_user_id: externalPageId,
          },
          include: {
            bot_configurations: true,
            meta_tokens: {
              orderBy: { updated_at: 'desc' },
              take: 1
            }
          }
        });

        if (!account) {
          throw new Error(`Platform account missing for page ${externalPageId}`);
        }

        const botConfig = account.bot_configurations;
        if (!botConfig?.is_active) {
          console.log(`[Worker] [${job.id}] Bot is inactive for account ${account.id}.`);
          return { status: 'ignored_by_bot_config', eventId: webhookEventId };
        }

        // --- 3. AI Classification ---
        const { data: classifyResult, error: classifyErr } = await classifyService.classify({
          text: messageText,
          platform
        });

        if (classifyErr || !classifyResult) {
          throw new Error(`AI Classification failed: ${classifyErr}`);
        }

        console.log(`[Worker] [${job.id}] Classified intent: ${classifyResult.intent} (Category: ${classifyResult.category})`);

        // If intent is escalate or no action, stop here
        if (classifyResult.intent === 'ESCALATE' || classifyResult.intent === 'NO_ACTION') {
          return {
            status: 'success_no_reply_needed',
            intent: classifyResult.intent,
            eventId: webhookEventId
          };
        }

        // --- 4. AI Verification / Generation ---
        // Fetch last 3 messages for context
        const recentMessages = await db.message.findMany({
          where: { conversationId: persistResult.conversationId },
          orderBy: { createdAt: 'desc' },
          take: 4, // Including the current message we just saved
          select: { content: true, senderType: true }
        });

        // Convert to history format (ignoring the latest message which is passed separately)
        const history = recentMessages
          .slice(1) // Remove latest
          .reverse() // Chronological order
          .map(m => `${m.senderType === 'user' ? 'User' : 'Bot'}: ${m.content}`);

        const { data: generateResult, error: genErr } = await generateService.generate({
          text: messageText,
          classifyResult,
          platform,
          history,
          systemPrompt: (botConfig as any).system_prompt || undefined,
          model: (botConfig as any).model as any || undefined
        });

        if (genErr || !generateResult || !generateResult.reply) {
          throw new Error(`AI Generation failed: ${genErr}`);
        }

        const replyText = generateResult.reply;

        // --- 5. Persist AI Log (Always create log if generation is successful) ---
        const aiLog = await db.aIReplyLog.create({
          data: {
            messageId: persistResult.messageId, // Link to the user message that triggered it
            prompt: `Intent: ${classifyResult.intent}${(botConfig as any).system_prompt ? ` | Prompt: ${(botConfig as any).system_prompt.substring(0, 50)}...` : ''}`,
            response: replyText,
            model: (botConfig as any).model || AI_MODELS.GENERATE,
            status: (botConfig as any).auto_send ? 'suggested' : 'pending' as any // Just a status, auto-send check happens below
          }
        });
        
        console.log(`[Worker] [${job.id}] AI Suggestion created: ${aiLog.id}`);

        // --- 6. Auto-Send via Platform API (Only if enabled) ---
        if (!botConfig.auto_send) {
          console.log(`[Worker] [${job.id}] Auto-send is OFF. Stopping after suggestion.`);
          return { 
            status: 'success_suggestion_only', 
            eventId: webhookEventId,
            suggestionId: aiLog.id
          };
        }

        let platformBotMessageId = `bot_generated_${Date.now()}`;
        if (platform === 'meta' || platform === 'facebook' || platform === 'instagram') {
          const tokenRecord = account.meta_tokens[0];
          if (!tokenRecord) {
            console.warn(`[Worker] [${job.id}] Cannot auto-send: No access token found for account ${account.id}`);
            return { status: 'failed_auto_send_no_token', eventId: webhookEventId, suggestionId: aiLog.id };
          }

          const { data: sendResult, error: sendErr } = await metaSendService.sendText({
            platform: platform === 'instagram' ? 'instagram' : 'messenger',
            recipientId: externalSenderId,
            pageId: externalPageId,
            text: replyText,
            encryptedToken: tokenRecord.encrypted_access_token
          });

          if (sendErr) {
            console.error(`[Worker] [${job.id}] Meta Send Service failed: ${sendErr}`);
            return { status: 'failed_auto_send_api_error', error: sendErr, eventId: webhookEventId };
          }
          if (sendResult && sendResult.messageId) {
            platformBotMessageId = sendResult.messageId;
          }
        } else {
          console.warn(`[Worker] [${job.id}] Send API for platform ${platform} not implemented yet`);
          return { status: 'failed_auto_send_unsupported_platform', eventId: webhookEventId };
        }

        // --- 7. Persist Bot Message (Only if auto-sent) ---
        const { data: botPersist, error: botPersistErr } = await idempotentPersistMessage({
          platform,
          externalPageId,
          externalSenderId,
          platformMessageId: platformBotMessageId,
          senderType: 'ai',
          messageText: replyText,
          timestamp: new Date(),
        });

        if (botPersist && botPersist.isNewMessage) {
          // Update AI log with the actual sent message ID
          await db.aIReplyLog.update({
            where: { id: aiLog.id },
            data: { 
              messageId: botPersist.messageId,
              status: 'sent' as any 
            }
          });
        }

        console.log(`[Worker] [${job.id}] Bot reply auto-sent & persisted successfully.`);

        return {
          processedAt: new Date().toISOString(),
          status: 'success_replied',
          eventId: webhookEventId,
          intent: classifyResult.intent
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Worker] [${job.id}] Processing failed: ${message}`);
        throw err; // Trigger retry logic
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  // Monitoring
  worker.on('completed', (job) => {
    console.info(`[Worker] [${job.id}] Job completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] [${job?.id}] Job failed with error: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error(`[Worker] Global worker error: ${err.message}`);
  });

  console.log(`[Worker] Webhook worker listening on queue: ${QueueName.WEBHOOK_EVENTS}`);
  return worker;
}

// Export a singleton instance (lazy initialization happens when imported)
export const webhookWorker = createWebhookWorker();
