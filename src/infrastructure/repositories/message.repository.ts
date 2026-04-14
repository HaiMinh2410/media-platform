import { db } from '@/lib/db';
import type { PersistMessageInput, PersistMessageResult } from '@/domain/types/messaging';

/**
 * Idempotently persists an incoming or outgoing message.
 * - Looks up the PlatformAccount.
 * - Upserts the Conversation.
 * - Inserts the Message (idempotent via platform_message_id).
 *
 * @param input Data describing the platform message to store
 * @returns Result with generated IDs and uniqueness flag
 */
export async function idempotentPersistMessage(
  input: PersistMessageInput
): Promise<PersistMessageResult> {
  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Locate the platform account
      const account = await tx.platformAccount.findFirst({
        where: {
          platform: input.platform,
          platform_user_id: input.externalPageId,
        },
      });

      if (!account) {
        throw new Error(`Platform account not found for ${input.platform} / ${input.externalPageId}`);
      }

      // 2. Upsert the conversation
      // We use findFirst + create/update to avoid issues with Prisma compound unique constraints naming
      let conversation = await tx.conversation.findFirst({
        where: {
          account_id: account.id,
          platform_conversation_id: input.externalSenderId,
        },
      });

      const messageTime = input.timestamp || new Date();

      if (!conversation) {
        // Conversation might have been created by another webhook concurrently, 
        // but $transaction ensures isolation in most cases. If this fails due to uniqueness,
        // it means we need to handle P2002.
        conversation = await tx.conversation.create({
          data: {
            account_id: account.id,
            platform_conversation_id: input.externalSenderId,
            lastMessageAt: messageTime,
          },
        });
      } else {
        // Update lastMessageAt if the new message is newer
        if (messageTime > conversation.lastMessageAt) {
          conversation = await tx.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: messageTime },
          });
        }
      }

      // 3. Insert the message idempotently
      let isNewMessage = false;
      let message = await tx.message.findUnique({
        where: { platform_message_id: input.platformMessageId },
      });

      if (!message) {
        message = await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: input.externalSenderId,
            content: input.messageText,
            platform_message_id: input.platformMessageId,
            senderType: input.senderType,
            createdAt: messageTime,
          },
        });
        isNewMessage = true;
      }

      return {
        messageId: message.id,
        conversationId: conversation.id,
        isNewMessage,
      };
    });

    return { data: result, error: null };
  } catch (error: any) {
    // If a P2002 (Unique constraint) error occurs during create, it means another webhook 
    // for the same message/conversation race-conditioned. 
    // We could retry or just treat it as an existing message.
    if (error.code === 'P2002') {
      console.warn(`⚠️ [MessageRepository] Race condition P2002 detected for msg: ${input.platformMessageId}`);
      try {
        // In this rare edge case, we try to fetch it one more time to return success
        const existingMessage = await db.message.findUnique({
          where: { platform_message_id: input.platformMessageId }
        });
        if (existingMessage) {
          return {
            data: {
              messageId: existingMessage.id,
              conversationId: existingMessage.conversationId,
              isNewMessage: false,
            },
            error: null,
          };
        }
      } catch (e) {
        // Fall down to generic error
      }
    }

    console.error('❌ [MessageRepository] Error persisting message:', error);
    return { data: null, error: error.message || 'Unknown database error' };
  }
}
