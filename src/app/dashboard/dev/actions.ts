'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Server action to clear all webhook logs (both raw logs and parsed events)
 * to reset the development/testing state.
 */
export async function clearWebhookLogsAction() {
  try {
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
