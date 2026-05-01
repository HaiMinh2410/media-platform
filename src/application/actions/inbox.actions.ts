'use server';

import { getConversations } from '@/infrastructure/repositories/conversation.repository';
import { getMessages, getUnifiedHistory } from '../../../message.repository';
import { ConversationFilter, PaginationParams, ConversationSort, ConversationWithLastMessage } from '@/domain/types/messaging';

/**
 * Server action to fetch conversations based on the 4-tier inbox logic.

 * Tiers are determined by the filter params: workspaceId (Tier 1), groupId (Tier 2),
 * accountId (Tier 3), and identityId (Tier 4).
 */
export async function getInboxAction(
  filter: ConversationFilter,
  pagination: PaginationParams,
  sort?: ConversationSort
) {
  // 1. Validation (Ideally using Zod, but for now we follow the project's existing pattern)
  if (!filter.workspaceId) {
    return { data: null, error: 'WORKSPACE_ID_REQUIRED' };
  }

  // 2. Fetch data from repository
  const { data, nextCursor, error } = await getConversations(filter, pagination, sort);

  if (error) {
    return { data: null, error };
  }

  return { data, nextCursor, error: null };
}

/**
 * Server action to fetch message history for a single conversation.
 */
export async function getMessagesAction(
  conversationId: string,
  pagination: PaginationParams
) {
  if (!conversationId) {
    return { data: null, error: 'CONVERSATION_ID_REQUIRED' };
  }

  const { data, nextCursor, error } = await getMessages(conversationId, pagination);

  if (error) {
    return { data: null, error };
  }

  return { data, nextCursor, error: null };
}

/**
 * Server action to fetch unified message history (Tier 4) for a customer identity.
 */
export async function getUnifiedMessagesAction(
  identityId: string,
  pagination: PaginationParams
) {
  if (!identityId) {
    return { data: null, error: 'IDENTITY_ID_REQUIRED' };
  }

  const { data, nextCursor, error } = await getUnifiedHistory(identityId, pagination);

  if (error) {
    return { data: null, error };
  }

  return { data, nextCursor, error: null };
}

/**
 * Server action to fetch a single conversation by ID.
 */
export async function getConversationAction(conversationId: string): Promise<{ data: ConversationWithLastMessage | null; error: string | null }> {
  const { db } = await import('@/lib/db');

  try {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        platform_accounts: true,
        _count: {
          select: {
            messages: {
              where: { is_read: false }
            }
          }
        }
      }
    });

    if (!conversation) return { data: null, error: 'NOT_FOUND' };

    // Fetch the last message separately for the preview
    const lastMessage = await db.message.findFirst({
      where: { conversationId: conversationId },
      orderBy: { createdAt: 'desc' }
    });

    return {
      data: {
        id: conversation.id,
        platform: conversation.platform_accounts.platform,
        platform_conversation_id: conversation.platform_conversation_id,
        sender_name: conversation.customer_name || 'Unknown',
        customer_avatar: conversation.customer_avatar,
        last_message_content: lastMessage?.content || '',
        last_message_at: lastMessage?.createdAt || conversation.lastMessageAt,
        unread_count: conversation._count.messages,
        status: conversation.status,
        priority: conversation.priority,
        sentiment: conversation.sentiment,
        tags: conversation.tags,
        is_vip: conversation.is_vip,
        canonical_conversation_id: conversation.canonical_conversation_id
      },
      error: null
    };
  } catch (error: any) {
    console.error('[getConversationAction] failed:', error);
    return { data: null, error: 'DATABASE_ERROR' };
  }
}

