import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName, WebhookJobPayload } from '@/domain/types/queue';
import { idempotentPersistMessage } from '@/infrastructure/repositories/message.repository';
import { classifyService } from '@/application/ai/classify.service';
import { generateService } from '@/application/ai/generate.service';
import { metaSendService } from '@/application/services/meta-send.service';
import { metaProfileService } from '@/application/services/meta-profile.service';
import { duplicateDetectionService } from '@/application/services/duplicate-detection.service';
import { db } from '@/lib/db';
import { AI_MODELS } from '@/domain/types/ai';
import { selectModel } from '@/application/ai/model-selector';
import { triageService } from '@/application/services/triage.service';
import { aiRoutingService } from '@/application/services/ai-routing.service';

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

        // --- 2.5 Sync Customer Profile if missing ---
        // We do this asynchronously to avoid delaying the AI response
        const convo = await db.conversation.findUnique({
          where: { id: persistResult.conversationId },
          select: { customer_name: true }
        });

        if (!convo?.customer_name && account.meta_tokens[0]) {
          console.log(`[Worker] [${job.id}] Missing customer profile, triggering sync...`);
          metaProfileService.syncCustomerProfile({
            conversationId: persistResult.conversationId,
            platform,
            externalSenderId: externalSenderId,
            encryptedToken: account.meta_tokens[0].encrypted_access_token
          }).catch(err => console.error(`[Worker] [${job.id}] Profile sync failed:`, err));
        }

        // --- 2.6 Cross-channel Duplicate Detection (async, non-blocking) ---
        duplicateDetectionService.detect({
          workspaceId: account.workspaceId,
          platform,
          externalSenderId,
          conversationId: persistResult.conversationId,
          customerName: convo?.customer_name ?? null,
          customerAvatar: null,
        }).catch(err => console.error(`[Worker] [${job.id}] Duplicate detection failed:`, err));

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

        console.log(`[Worker] [${job.id}] Classified intent: ${classifyResult.intent} (Category: ${classifyResult.category}, Sentiment: ${classifyResult.sentiment})`);

        // --- 3.5 Auto-Triage ---
        // Apply AI results to conversation metadata and auto-assign
        const { error: triageErr } = await triageService.triage(persistResult.conversationId, classifyResult);
        if (triageErr) {
          console.error(`[Worker] [${job.id}] Triage failed: ${triageErr}`);
        }

        // If intent is escalate or no action, stop here (after triage is applied)
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

        const selectedModel = selectModel({
          text: messageText,
          history,
          userConfiguredModel: (botConfig as any).model
        });

        console.log(`[Worker] [${job.id}] Auto-selected model: ${selectedModel}`);

        const { reply: replyText, isAutoReply, error: genErr } = await aiRoutingService.routeAndGenerate(
          account.id,
          messageText,
          classifyResult,
          platform,
          history
        );

        if (genErr || !replyText) {
          throw new Error(`AI Generation/Routing failed: ${genErr}`);
        }

        // --- 5. Persist AI Log (Always create log if generation is successful) ---
        const aiLog = await db.aIReplyLog.create({
          data: {
            messageId: persistResult.messageId, // Link to the user message that triggered it
            prompt: `Intent: ${classifyResult.intent}${(botConfig as any).system_prompt ? ` | Prompt: ${(botConfig as any).system_prompt.substring(0, 50)}...` : ''}`,
            response: replyText,
            model: selectedModel,
            status: (botConfig as any).auto_send ? 'suggested' : 'pending' 
          } as any
        });
        
        console.log(`[Worker] [${job.id}] AI Suggestion created: ${aiLog.id}`);

        // --- 6. Auto-Send via Platform API (Only if enabled and filters match) ---
        const allowedPriorities = (botConfig as any).auto_reply_priorities || [];
        const allowedSentiments = (botConfig as any).auto_reply_sentiments || [];

        const priorityMatch = allowedPriorities.length === 0 || allowedPriorities.includes(classifyResult.priority);
        const sentimentMatch = allowedSentiments.length === 0 || allowedSentiments.includes(classifyResult.sentiment);

        if (!botConfig.auto_send || !priorityMatch || !sentimentMatch || !isAutoReply) {
          let reason = 'Auto-send is OFF or Routing resolved to Draft Only';
          if (botConfig.auto_send && isAutoReply) {
            if (!priorityMatch && !sentimentMatch) reason = `Priority (${classifyResult.priority}) and Sentiment (${classifyResult.sentiment}) not allowed`;
            else if (!priorityMatch) reason = `Priority (${classifyResult.priority}) not allowed for auto-reply`;
            else if (!sentimentMatch) reason = `Sentiment (${classifyResult.sentiment}) not allowed for auto-reply`;
          }

          console.log(`[Worker] [${job.id}] ${reason}. Stopping after suggestion.`);
          return { 
            status: 'success_suggestion_only', 
            eventId: webhookEventId,
            suggestionId: aiLog.id,
            reason
          };
        }

        let platformBotMessageId = `bot_generated_${Date.now()}`;
        if (platform === 'meta' || platform === 'facebook' || platform === 'instagram') {
          const tokenRecord = account.meta_tokens[0];
          if (!tokenRecord) {
            console.warn(`[Worker] [${job.id}] Cannot auto-send: No access token found for account ${account.id}`);
            return { status: 'failed_auto_send_no_token', eventId: webhookEventId, suggestionId: aiLog.id };
          }

          let effectivePageId = externalPageId;

          // For Instagram, we must use the linked Facebook Page ID as the sender to avoid error #3 (Capability)
          if (platform === 'instagram') {
            const linkedFb = await db.platformAccount.findFirst({
              where: {
                platform: 'facebook',
                workspaceId: account.workspaceId,
                metadata: { path: ['instagram_id'], equals: externalPageId }
              },
              select: { platform_user_id: true }
            });
            if (linkedFb) {
              effectivePageId = linkedFb.platform_user_id;
              console.log(`[Worker] [${job.id}] Resolved linked FB Page ${effectivePageId} for IG account ${externalPageId}`);
            }
          }

          const { data: sendResult, error: sendErr } = await metaSendService.sendText({
            platform: platform === 'instagram' ? 'instagram' : 'messenger',
            recipientId: externalSenderId,
            pageId: effectivePageId,
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
              status: 'sent' 
            } as any
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
