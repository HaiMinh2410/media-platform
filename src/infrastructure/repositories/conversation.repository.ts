import { db } from '@/lib/db';
import type { 
  ConversationFilter, 
  PaginationParams, 
  ConversationWithLastMessage 
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
        // Filter by status if provided
        ...(filter.status ? { status: filter.status } : {}),
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
