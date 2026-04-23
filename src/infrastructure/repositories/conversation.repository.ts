import { db } from '@/lib/db';
import type { 
  ConversationFilter, 
  PaginationParams, 
  ConversationWithLastMessage,
  MarkReadResult 
} from '@/domain/types/messaging';


/**
 * Fetches a list of conversations for a specific workspace with pagination and filters.
 * Each conversation includes the latest message snippet and unread count.
 */
export async function getConversations(
  filter: ConversationFilter,
  pagination: PaginationParams
): Promise<{ 
  data: ConversationWithLastMessage[] | null; 
  nextCursor: string | null; 
  error: string | null 
}> {
  try {
    const limit = pagination.limit || 20;
    const cursor = pagination.cursor;

    const conversations = await db.conversation.findMany({
      where: {
        platform_accounts: {
          workspaceId: filter.workspaceId,
          // Filter by platform if provided
          ...(filter.platform ? { platform: filter.platform } : {}),
        },
        // Filter by status if provided (e.g., 'open', 'resolved')
        ...(filter.status ? { status: filter.status } : {}),
        // Filter by unread if provided
        ...(filter.unread ? { messages: { some: { is_read: false } } } : {}),
        // Search in platform ID or message content
        ...(filter.search ? {
          OR: [
            { platform_conversation_id: { contains: filter.search, mode: 'insensitive' } },
            { messages: { some: { content: { contains: filter.search, mode: 'insensitive' } } } }
          ]
        } : {})
      },
      // Take one extra to determine if there's a next page
      take: limit + 1,
      // Use standard Prisma cursor-based pagination
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // Skip the cursor element itself
      orderBy: {
        lastMessageAt: 'desc'
      },
      include: {
        platform_accounts: true,
        // Include only the very latest message for the list snippet
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        // Efficient unread count via Prisma's relation count filtering
        _count: {
          select: {
            messages: {
              where: { is_read: false }
            }
          }
        }
      }
    });

    let nextCursor: string | null = null;
    if (conversations.length > limit) {
      const nextItem = conversations.pop();
      nextCursor = nextItem!.id;
    }

    const formatted: ConversationWithLastMessage[] = conversations.map(c => ({
      id: c.id,
      platform_conversation_id: c.platform_conversation_id,
      last_message_at: c.lastMessageAt,
      status: c.status,
      platform: c.platform_accounts.platform,
      // For now we use the platform_conversation_id as the name until we have profile sync
      sender_name: c.platform_conversation_id, 
      last_message_content: c.messages[0]?.content || '',
      unread_count: c._count.messages
    }));

    return { data: formatted, nextCursor, error: null };
  } catch (error: any) {
    console.error('❌ [ConversationRepository] Error fetching conversations:', error);
    return { data: null, nextCursor: null, error: error.message || 'Unknown database error' };
  }
}

/**
 * ConversationWithAccount groups conversation data with its Platform Account
 * and the latest Meta token — needed for agent replies.
 */
export type ConversationWithAccount = {
  id: string;
  platform_conversation_id: string;
  status: string | null;
  account: {
    id: string;
    platform: string;
    platform_user_id: string;  // The page ID used as sender
    encryptedToken: string | null;
  };
};

/**
 * Fetches a single conversation with its associated platform account
 * and the most recent Meta access token (encrypted).
 * Used by the reply endpoint to resolve the token for sending.
 *
 * @param conversationId UUID of the conversation
 */
export async function getConversationWithAccount(
  conversationId: string
): Promise<{ data: ConversationWithAccount | null; error: string | null }> {
  try {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        platform_accounts: {
          include: {
            meta_tokens: {
              orderBy: { updated_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!conversation) {
      return { data: null, error: 'CONVERSATION_NOT_FOUND' };
    }

    const account = conversation.platform_accounts;
    let latestToken = account.meta_tokens[0] ?? null;

    // Fallback: If no token explicitly linked to this account, try to find ANY valid 
    // meta token within the same workspace (common in shared Meta app setups)
    if (!latestToken) {
      const workspaceToken = await db.meta_tokens.findFirst({
        where: {
          platform_accounts: {
            workspaceId: account.workspaceId,
            platform: account.platform // Match platform (e.g., both are Meta-based)
          }
        },
        orderBy: { updated_at: 'desc' }
      });
      if (workspaceToken) {
        latestToken = workspaceToken;
        console.log(`[Repository] Using fallback workspace token for account ${account.id}`);
      }
    }

    return {
      data: {
        id: conversation.id,
        platform_conversation_id: conversation.platform_conversation_id,
        status: conversation.status,
        account: {
          id: account.id,
          platform: account.platform,
          platform_user_id: account.platform_user_id,
          encryptedToken: latestToken?.encrypted_access_token ?? null,
        },
      },
      error: null,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown database error';
    console.error('❌ [ConversationRepository] Error in getConversationWithAccount:', error);
    return { data: null, error: msg };
  }
}

/**
 * Marks all unread messages in a conversation as read.
 * Returns the count of updated messages.
 *
 * @param conversationId UUID of the conversation
 */
export async function markAllRead(conversationId: string): Promise<MarkReadResult> {
  try {
    const result = await db.message.updateMany({
      where: {
        conversationId,
        is_read: false,
      },
      data: { is_read: true },
    });

    return { data: { updatedCount: result.count }, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown database error';
    console.error('❌ [ConversationRepository] Error in markAllRead:', error);
    return { data: null, error: msg };
  }
}
