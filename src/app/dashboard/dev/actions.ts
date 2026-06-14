'use server';

import { db } from "@shared/lib/db";
import { revalidatePath } from 'next/cache';
import { createClient } from "@shared/api/supabase/server";
import crypto from 'crypto';

/**
 * Server action to cleared webhook logs securely, checking user authentication
 */
export async function clearWebhookLogsAction(confirmText?: string) {
  try {
    if (confirmText !== 'TRUNCATE') {
      return { error: 'INVALID_CONFIRMATION_TEXT' };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'UNAUTHORIZED' };
    }

    // Delete parsed events first because of foreign key constraint
    const deletedEvents = await db.webhookEvent.deleteMany({});
    const deletedLogs = await db.platformEventLog.deleteMany({});
    
    revalidatePath('/dashboard/dev');
    
    return { 
      success: true, 
      message: `Cleared ${deletedEvents.count} parsed events and ${deletedLogs.count} raw platform logs.` 
    };
  } catch (error) {
    console.error('[DevActions] Failed to clear webhook logs:', error);
    return { error: error instanceof Error ? error.message : 'DATABASE_ERROR' };
  }
}

/**
 * Server action to simulate Meta webhook POST request with valid HMAC-SHA256 signature
 */
export async function simulateWebhookAction(payload: any) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'UNAUTHORIZED: Bạn phải đăng nhập để giả lập webhook' };
    }

    const appSecret = process.env.META_APP_SECRET || '';
    const rawBody = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', appSecret);
    const signature = 'sha256=' + hmac.update(rawBody, 'utf8').digest('hex');

    const port = process.env.PORT || '3000';
    // Fallback to localhost if NEXT_PUBLIC_APP_URL is not set
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`;
    
    console.log(`[DevActions] Sending simulation POST to ${appUrl}/api/webhooks/meta`);
    
    const response = await fetch(`${appUrl}/api/webhooks/meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature,
      },
      body: rawBody,
    });

    const resText = await response.text();
    let resBody: any;
    try {
      resBody = JSON.parse(resText);
    } catch (e) {
      resBody = { text: resText };
    }

    if (!response.ok) {
      return { 
        error: `HTTP ${response.status}: ${resBody.error || resText || 'Server Error'}` 
      };
    }

    return { success: true, response: resBody };
  } catch (error) {
    console.error('[DevActions] Failed to simulate webhook:', error);
    return { error: error instanceof Error ? error.message : 'INTERNAL_SERVER_ERROR' };
  }
}

/**
 * Fetches current record counts for key development entities.
 */
export async function getDatabaseStatsAction() {
  try {
    const [rawLogs, parsedEvents, conversations, messages, platformAccounts] = await Promise.all([
      db.platformEventLog.count(),
      db.webhookEvent.count(),
      db.conversation.count(),
      db.message.count(),
      db.platformAccount.count()
    ]);

    return {
      success: true,
      stats: {
        rawLogs,
        parsedEvents,
        conversations,
        messages,
        platformAccounts
      }
    };
  } catch (error) {
    console.error('[DevActions] Failed to get database stats:', error);
    return { error: error instanceof Error ? error.message : 'DATABASE_ERROR' };
  }
}

/**
 * Fetches the details of a single raw log, including any associated parsed WebhookEvents,
 * and searches if there are related Conversations or Messages in the DB.
 */
export async function getLogDetailsAction(logId: string) {
  try {
    const log = await db.platformEventLog.findUnique({
      where: { id: logId },
      include: {
        webhookEvents: true
      }
    });

    if (!log) {
      return { error: 'Log not found' };
    }

    // Try to find if any of these events triggered conversation or messages creation
    const eventDetails = await Promise.all(
      log.webhookEvents.map(async (ev) => {
        // Find conversation by platform_conversation_id = externalSenderId or mapping
        let conversation = await db.conversation.findFirst({
          where: {
            platform_conversation_id: ev.externalSenderId
          },
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        });

        if (!conversation) {
          // Try mapping
          const mapping = await db.customerPlatformMapping.findFirst({
            where: { external_sender_id: ev.externalSenderId },
            include: { 
              conversation: { 
                include: { 
                  messages: { orderBy: { createdAt: 'desc' }, take: 5 } 
                } 
              } 
            }
          });
          if (mapping) {
            conversation = mapping.conversation;
          }
        }

        return {
          eventId: ev.id,
          externalSenderId: ev.externalSenderId,
          messageText: ev.messageText,
          conversation: conversation ? {
            id: conversation.id,
            customerName: conversation.customer_name,
            customerUsername: conversation.customer_username,
            status: conversation.status,
            messages: conversation.messages.map(m => ({
              id: m.id,
              content: m.content,
              senderType: m.senderType,
              createdAt: m.createdAt
            }))
          } : null
        };
      })
    );

    return {
      success: true,
      log,
      eventDetails
    };
  } catch (error) {
    console.error('[DevActions] Failed to get log details:', error);
    return { error: error instanceof Error ? error.message : 'DATABASE_ERROR' };
  }
}
