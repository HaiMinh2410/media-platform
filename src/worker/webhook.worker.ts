import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/infrastructure/queue/bullmq.provider';
import { QueueName, WebhookJobPayload } from '@/domain/types/queue';
import { idempotentPersistMessage, markAsRead, markAsDelivered } from '../../message.repository';
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
import { createClient } from '@supabase/supabase-js';
import { metaParser } from '@/infrastructure/meta/meta-parser.service';
import { processIncomingMessage } from '@/application/ai-agent';

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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findConversationId(platform: string, externalPageId: string, externalSenderId: string): Promise<string | null> {
  const normalizedPlatform = platform === 'messenger' ? 'facebook' : platform;
  const account = await db.platformAccount.findFirst({
    where: {
      platform: normalizedPlatform,
      platform_user_id: externalPageId,
    },
    select: { id: true }
  });

  if (!account) return null;

  const conversation = await db.conversation.findFirst({
    where: {
      account_id: account.id,
      platform_conversation_id: externalSenderId,
    },
    select: { id: true }
  });

  return conversation?.id || null;
}

function createWebhookWorker() {
  if (!redisConnection) {
    console.error('[Worker] Cannot initialize Webhook Worker: Redis connection is missing.');
    return null;
  }

  const worker = new Worker<WebhookJobPayload>(
    QueueName.WEBHOOK_EVENTS,
    async (job: Job<WebhookJobPayload>) => {
      const { webhookEventId, platform, eventType, externalSenderId, externalPageId, platformMessageId, timestamp, isEcho } = job.data;
      const messageText = job.data.messageText || '';

      console.log(`[Worker] [${job.id}] Processing ${eventType} event ${webhookEventId} from ${platform}`);

      try {
        // --- Handle Read Receipt ---
        if (eventType === 'read') {
          let watermark = new Date(timestamp);
          try {
            const parsed = JSON.parse(messageText);
            if (parsed.watermark) watermark = new Date(parsed.watermark);
          } catch (e) { }

          await markAsRead(platform, externalPageId, externalSenderId, watermark);
          console.log(`[Worker] [${job.id}] Processed read receipt up to ${watermark.toISOString()}`);
          return { status: 'success_read', eventId: webhookEventId };
        }

        // --- Handle Delivery Receipt ---
        if (eventType === 'delivery') {
          let watermark = new Date(timestamp);
          try {
            const parsed = JSON.parse(messageText);
            if (parsed.watermark) watermark = new Date(parsed.watermark);
          } catch (e) { }

          await markAsDelivered(platform, externalPageId, externalSenderId, watermark);
          console.log(`[Worker] [${job.id}] Processed delivery receipt up to ${watermark.toISOString()}`);
          return { status: 'success_delivery', eventId: webhookEventId };
        }


        // --- Handle Reaction Events (Early Intercept) ---
        if (eventType === 'reaction') {
          let reactionData = (job.data as any).reactionData;

          // Fallback: fetch WebhookEvent if reactionData is missing
          if (!reactionData) {
            const dbEvent = await db.webhookEvent.findUnique({
              where: { id: webhookEventId },
              select: { payload: true }
            });
            if (dbEvent && dbEvent.payload) {
              const parsedPayload = dbEvent.payload as any;
              const tempEvents = metaParser.parse(parsedPayload, {});
              const matched = tempEvents.find(e => e.platformMessageId === platformMessageId && e.eventType === 'reaction');
              if (matched) {
                reactionData = matched.reactionData;
              }
            }
          }

          if (!reactionData) {
            console.warn(`[Worker] [${job.id}] Missing reactionData for reaction event.`);
            return { status: 'failed_missing_reaction_data', eventId: webhookEventId };
          }

          // 1. Locate the target message in DB
          const targetMessage = await db.message.findUnique({
            where: { platform_message_id: platformMessageId },
          });

          if (!targetMessage) {
            console.warn(`[Worker] [${job.id}] Target message ${platformMessageId} not found in DB. Cannot apply reaction.`);
            return { status: 'target_message_not_found', eventId: webhookEventId };
          }

          // 2. Parse current reactions from DB
          let currentReactions: any[] = [];
          if (targetMessage.reactions && Array.isArray(targetMessage.reactions)) {
            currentReactions = [...targetMessage.reactions];
          }

          // 3. Update the array based on react vs unreact
          if (reactionData.action === 'react') {
            const existingIndex = currentReactions.findIndex((r: any) => r.senderId === externalSenderId);
            if (existingIndex >= 0) {
              currentReactions[existingIndex].reaction = reactionData.emoji;
            } else {
              currentReactions.push({
                senderId: externalSenderId,
                reaction: reactionData.emoji,
              });
            }
          } else if (reactionData.action === 'unreact') {
            currentReactions = currentReactions.filter((r: any) => r.senderId !== externalSenderId);
          }

          // 4. Persist the updated array to database
          await db.message.update({
            where: { id: targetMessage.id },
            data: {
              reactions: currentReactions,
            },
          });

          console.log(`[Worker] [${job.id}] Successfully applied reaction update (${reactionData.action}) to message ${targetMessage.id}`);
          return { status: 'success_reaction_applied', eventId: webhookEventId };
        }

        // --- Handle Other Events (safeguard) ---
        if (eventType === 'other' && !messageText.trim()) {
          console.log(`[Worker] [${job.id}] Ignoring empty 'other' event.`);
          return { status: 'ignored_other_empty', eventId: webhookEventId };
        }

        // Retrieve attachments and parentMessageId from job.data or fallback from db
        let attachments = (job.data as any).attachments;
        let parentMessageId = (job.data as any).parentMessageId;

        // Fallback: fetch WebhookEvent if they are missing
        if ((!attachments || !parentMessageId) && eventType === 'message') {
          const dbEvent = await db.webhookEvent.findUnique({
            where: { id: webhookEventId },
            select: { payload: true }
          });
          if (dbEvent && dbEvent.payload) {
            const parsedPayload = dbEvent.payload as any;
            const tempEvents = metaParser.parse(parsedPayload, {});
            const matched = tempEvents.find(e => e.platformMessageId === platformMessageId && e.eventType === 'message');
            if (matched) {
              attachments = attachments || matched.attachments;
              parentMessageId = parentMessageId || matched.parentMessageId;
            }
          }
        }

        // --- Handle Standard Message ---
        const { data: persistResult, error: persistErr } = await idempotentPersistMessage({
          platform,
          externalPageId,
          externalSenderId,
          platformMessageId,
          senderType: isEcho ? 'agent' : 'user',
          messageText,
          timestamp: new Date(timestamp),
          attachments,
          parentMessageId,
        });

        if (persistErr || !persistResult) {
          throw new Error(`Message persistence failed: ${persistErr}`);
        }

        if (!persistResult.isNewMessage) {
          console.log(`[Worker] [${job.id}] Message ${platformMessageId} already processed (deduped).`);
          return { status: 'deduplicated', eventId: webhookEventId };
        }

        console.log(`[Worker] [${job.id}] Persisted new ${isEcho ? 'echo' : 'user'} message ${persistResult.messageId}`);

        // --- 1.5 Early Exit for Echoes ---
        // If it's an echo (sent from native app), we stop here. 
        // We don't want AI to reply to our own native app messages.
        if (isEcho) {
          return { status: 'success_echo_persisted', eventId: webhookEventId };
        }

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
          select: { 
            customer_name: true,
            customer_username: true,
            customer_link: true
          }
        });

        const needsSync = !convo?.customer_name || 
                          (platform === 'instagram' && !convo?.customer_username) ||
                          (platform === 'facebook' && !convo?.customer_link);

        if (needsSync) {
          console.log(`[Worker] [${job.id}] Missing customer profile, triggering sync...`);
          metaProfileService.syncCustomerProfile({
            conversationId: persistResult.conversationId,
            platform,
            externalSenderId: externalSenderId,
            externalPageId: externalPageId,
            encryptedToken: account.meta_tokens[0]?.encrypted_access_token
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

        // --- 3. AI Agent Rule-Based Phase 1 Pipeline ---
        console.log(`[Worker] [${job.id}] Running Rule-based Phase 1 Pipeline...`);
        const { reply, action, link, delay, updatedProfile } = await processIncomingMessage({
          conversationId: persistResult.conversationId,
          messageText,
          workspaceId: account.workspaceId,
          platformUserId: externalSenderId,
        });

        console.log(`[Worker] [${job.id}] Pipeline Result: action=${action}, delay=${delay}ms`);

        // --- 4. Persist AI Log ---
        const aiLog = await db.aIReplyLog.create({
          data: {
            messageId: persistResult.messageId, // Link to the user message that triggered it
            prompt: `Action: ${action} | Stage: ${updatedProfile.stage} | FanType: ${updatedProfile.fanType}`,
            response: reply || '',
            model: "Rule-based-Phase-1",
            status: botConfig.auto_send ? 'suggested' : 'pending'
          } as any
        });

        console.log(`[Worker] [${job.id}] AI Suggestion created: ${aiLog.id}`);

        // If action is escalate_to_human, soft_exit, hard_exit, or wait (no reply needed)
        // or if reply is empty, stop here
        if (action === 'wait' || action === 'hard_exit' || action === 'escalate_to_human' || !reply) {
          console.log(`[Worker] [${job.id}] Action is ${action} or reply is empty. No auto-send reply needed.`);
          return {
            status: 'success_no_reply_needed',
            action,
            eventId: webhookEventId,
            suggestionId: aiLog.id
          };
        }

        // --- 5. Auto-Send via Platform API (delayed asynchronously) ---
        if (!botConfig.auto_send) {
          console.log(`[Worker] [${job.id}] Auto-send is OFF. Stopping after suggestion.`);
          return {
            status: 'success_suggestion_only',
            eventId: webhookEventId,
            suggestionId: aiLog.id,
            reason: 'Auto-send is OFF'
          };
        }

        // Tự động trì hoãn không đồng bộ cục bộ (Background setTimeout) để gửi tin nhắn
        console.log(`[Worker] [${job.id}] Scheduling delayed reply in ${delay}ms...`);
        
        // Chạy bất đồng bộ ngầm để giải phóng job BullMQ ngay lập tức
        setTimeout(async () => {
          try {
            console.log(`\n⏰ [Delayed Send] Executing delayed reply for conversation ${persistResult.conversationId}`);
            let platformBotMessageId = `bot_generated_${Date.now()}`;
            
            if (platform === 'meta' || platform === 'facebook' || platform === 'instagram') {
              const tokenRecord = account.meta_tokens[0];
              if (!tokenRecord) {
                console.warn(`[Delayed Send] Cannot auto-send: No access token found for account ${account.id}`);
                return;
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
                  console.log(`[Delayed Send] Resolved linked FB Page ${effectivePageId} for IG account ${externalPageId}`);
                }
              }

              const { data: sendResult, error: sendErr } = await metaSendService.sendText({
                platform: platform === 'instagram' ? 'instagram' : 'facebook',
                recipientId: externalSenderId,
                pageId: effectivePageId,
                text: reply,
                encryptedToken: tokenRecord.encrypted_access_token
              });

              if (sendErr) {
                console.error(`[Delayed Send] Meta Send Service failed: ${sendErr}`);
                return;
              }
              if (sendResult && sendResult.messageId) {
                platformBotMessageId = sendResult.messageId;
              }
            } else {
              console.warn(`[Delayed Send] Send API for platform ${platform} not supported yet`);
              return;
            }

            // Persist Bot Message
            const { data: botPersist } = await idempotentPersistMessage({
              platform,
              externalPageId,
              externalSenderId,
              platformMessageId: platformBotMessageId,
              senderType: 'ai',
              messageText: reply,
              timestamp: new Date(),
            });

            if (botPersist && botPersist.isNewMessage) {
              // Update AI log with the actual sent message ID and set status to 'sent'
              await db.aIReplyLog.update({
                where: { id: aiLog.id },
                data: {
                  messageId: botPersist.messageId,
                  status: 'sent'
                } as any
              });
              console.log(`[Delayed Send] Bot reply sent and associated with log.`);
            }
          } catch (err) {
            console.error(`[Delayed Send] Failed to execute delayed reply:`, err);
          }
        }, delay);

        return {
          processedAt: new Date().toISOString(),
          status: 'success_replied_scheduled',
          eventId: webhookEventId,
          delayMs: delay,
          action
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
