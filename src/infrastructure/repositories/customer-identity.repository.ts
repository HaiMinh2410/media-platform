// src/infrastructure/repositories/customer-identity.repository.ts
import { db } from '@/lib/db';
import type {
  DuplicateCheckInput,
  DuplicateCheckResult,
  LinkedIdentitySummary,
} from '@/domain/types/customer-identity';

/**
 * Normalizes a platform string for consistent cross-platform grouping.
 * 'facebook' and 'messenger' are treated as the same channel group.
 */
function normalizePlatform(platform: string): string {
  if (platform === 'facebook' || platform === 'messenger') return 'facebook';
  return platform;
}

/**
 * Checks if this (platform, externalSenderId) is already linked to a CustomerIdentity.
 * If not linked, creates a new identity and registers the mapping.
 * If already linked, checks if there are other platforms linked (cross-channel).
 *
 * Algorithm:
 * 1. Check `customer_platform_mappings` for existing (platform, externalSenderId) entry
 * 2a. If found → identity already registered; check for cross-channel siblings
 * 2b. If not found → check other platforms in same workspace for name-based similarity
 *     (heuristic: same customer_name on a different platform = same person)
 * 3. Upsert identity + mapping
 * 4. Optionally link canonical_conversation_id on the duplicate conversation
 */
export async function checkAndRegisterIdentity(
  input: DuplicateCheckInput
): Promise<DuplicateCheckResult> {
  try {
    const normalizedPlatform = normalizePlatform(input.platform);

    const result = await db.$transaction(async (tx) => {
      // ── Step 1: Check if this sender is already registered ──────────────────
      const existingMapping = await tx.customerPlatformMapping.findUnique({
        where: {
          platform_external_sender_id: {
            platform: normalizedPlatform,
            external_sender_id: input.externalSenderId,
          },
        },
        include: {
          identity: {
            include: {
              platform_mappings: true,
            },
          },
        },
      });

      if (existingMapping) {
        // Already registered — collect all linked conversation IDs
        const linkedConversationIds = existingMapping.identity.platform_mappings.map(
          (m) => m.conversation_id
        );
        // Cross-channel = sender appears on DIFFERENT platform types (e.g. instagram + facebook)
        // Same platform (e.g. instagram + instagram) is NOT cross-channel — just same user on 2 accounts
        const isCrossChannelMatch =
          existingMapping.identity.platform_mappings.some(
            (m) => normalizePlatform(m.platform) !== normalizedPlatform
          );

        // Ensure the current conversationId is in the list (may differ from what's stored)
        if (!linkedConversationIds.includes(input.conversationId)) {
          linkedConversationIds.push(input.conversationId);
        }

        // Canonical = the oldest (first) conversation linked
        const canonicalConversationId =
          existingMapping.identity.platform_mappings.sort(
            (a, b) => a.created_at.getTime() - b.created_at.getTime()
          )[0]?.conversation_id ?? input.conversationId;

        // Only hide as duplicate if it's truly cross-PLATFORM (not just cross-account on same platform)
        if (isCrossChannelMatch && canonicalConversationId !== input.conversationId) {
          await tx.conversation.update({
            where: { id: input.conversationId },
            data: { canonical_conversation_id: canonicalConversationId },
          });
        }

        return {
          identityId: existingMapping.identity_id,
          isCrossChannelMatch,
          canonicalConversationId,
          linkedConversationIds,
        };
      }

      // ── Step 2: Name-based heuristic for cross-channel linking ───────────────
      // Find if there's an existing identity in this workspace with the same customer_name
      // (only when name is available and meaningful)
      let existingIdentity = null;
      if (input.customerName && input.customerName.trim().length > 2) {
        existingIdentity = await tx.customerIdentity.findFirst({
          where: {
            workspace_id: input.workspaceId,
            customer_name: input.customerName.trim(),
          },
          include: {
            platform_mappings: true,
          },
        });
      }

      let identity: { id: string };
      let isCrossChannelMatch = false;

      if (existingIdentity) {
        // Cross-channel match via name heuristic!
        identity = existingIdentity;
        isCrossChannelMatch = existingIdentity.platform_mappings.some(
          (m) => normalizePlatform(m.platform) !== normalizedPlatform
        );

        // Update name/avatar if the existing is missing them
        if (!existingIdentity.customer_name && input.customerName) {
          await tx.customerIdentity.update({
            where: { id: existingIdentity.id },
            data: {
              customer_name: input.customerName,
              customer_avatar: input.customerAvatar ?? null,
            },
          });
        }
      } else {
        // ── Step 3: Create a new identity ───────────────────────────────────────
        identity = await tx.customerIdentity.create({
          data: {
            workspace_id: input.workspaceId,
            canonical_external_id: input.externalSenderId,
            customer_name: input.customerName ?? null,
            customer_avatar: input.customerAvatar ?? null,
          },
        });
      }

      // ── Step 4: Register the platform mapping ────────────────────────────────
      await tx.customerPlatformMapping.create({
        data: {
          identity_id: identity.id,
          platform: normalizedPlatform,
          external_sender_id: input.externalSenderId,
          conversation_id: input.conversationId,
        },
      });

      // ── Step 5: Get all linked conversations for this identity ───────────────
      const allMappings = await tx.customerPlatformMapping.findMany({
        where: { identity_id: identity.id },
        orderBy: { created_at: 'asc' },
      });

      const linkedConversationIds = allMappings.map((m) => m.conversation_id);
      const canonicalConversationId = allMappings[0]?.conversation_id ?? input.conversationId;

      if (isCrossChannelMatch && canonicalConversationId !== input.conversationId) {
        await tx.conversation.update({
          where: { id: input.conversationId },
          data: { canonical_conversation_id: canonicalConversationId },
        });

        // Surface the canonical conversation by updating its timestamp
        await tx.conversation.update({
          where: { id: canonicalConversationId },
          data: { lastMessageAt: new Date() },
        });
      }

      return {
        identityId: identity.id,
        isCrossChannelMatch,
        canonicalConversationId,
        linkedConversationIds,
      };
    });

    return { data: result, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown database error';
    console.error('❌ [CustomerIdentityRepository] Error in checkAndRegisterIdentity:', error);
    return { data: null, error: msg };
  }
}

/**
 * Fetches a summary of all platforms/conversations linked to the identity
 * associated with this conversation. Used for the unified view UI.
 *
 * @param conversationId Any conversation belonging to the identity
 */
export async function getLinkedIdentitySummary(
  conversationId: string
): Promise<{ data: LinkedIdentitySummary | null; error: string | null }> {
  try {
    const mapping = await db.customerPlatformMapping.findFirst({
      where: { conversation_id: conversationId },
      include: {
        identity: {
          include: {
            platform_mappings: {
              orderBy: { created_at: 'asc' },
            },
          },
        },
      },
    });

    if (!mapping) {
      return { data: null, error: null }; // Not yet registered — not an error
    }

    const summary: LinkedIdentitySummary = {
      identityId: mapping.identity.id,
      customerName: mapping.identity.customer_name,
      customerAvatar: mapping.identity.customer_avatar,
      platforms: mapping.identity.platform_mappings.map((m) => ({
        platform: m.platform,
        externalSenderId: m.external_sender_id,
        conversationId: m.conversation_id,
      })),
    };

    return { data: summary, error: null };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown database error';
    console.error('❌ [CustomerIdentityRepository] Error in getLinkedIdentitySummary:', error);
    return { data: null, error: msg };
  }
}
