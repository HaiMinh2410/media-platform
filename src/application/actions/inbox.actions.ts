'use server';

import { getConversations } from '@/infrastructure/repositories/conversation.repository';
import { getMessages, getUnifiedHistory } from '@/infrastructure/repositories/message.repository';
import { ConversationFilter, PaginationParams, ConversationSort } from '@/domain/types/messaging';

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
