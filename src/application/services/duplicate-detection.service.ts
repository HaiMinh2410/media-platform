// src/application/services/duplicate-detection.service.ts
import { checkAndRegisterIdentity } from '@/infrastructure/repositories/customer-identity.repository';
import type { DuplicateCheckInput, DuplicateCheckResult } from '@/domain/types/customer-identity';

/**
 * DuplicateDetectionService
 *
 * Runs cross-channel duplicate detection after a message is persisted.
 * It registers the (platform, externalSenderId) pair in the identity graph
 * and, if a match is found on another channel, tags the conversation with
 * `canonical_conversation_id` so the UI can show a unified view.
 *
 * Design principles:
 * - Non-blocking: failures are logged but do NOT throw (worker continues).
 * - Idempotent: repeated calls for the same sender are safe (upsert).
 * - Async-first: intended to be called fire-and-forget from the worker.
 */
export const duplicateDetectionService = {
  /**
   * Detects and registers cross-channel identity for an incoming message.
   *
   * @param input - Sender info from the webhook payload
   * @returns Detection result (or error if DB fails)
   */
  async detect(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
    const { data, error } = await checkAndRegisterIdentity(input);

    if (error) {
      console.error('[DuplicateDetection] Failed to check identity:', error);
      return { data: null, error };
    }

    if (data?.isCrossChannelMatch) {
      console.log(
        `[DuplicateDetection] Cross-channel match for conversation ${input.conversationId}` +
        ` → canonical: ${data.canonicalConversationId}` +
        ` (identity: ${data.identityId}, total linked: ${data.linkedConversationIds.length})`
      );
    } else if (data) {
      console.log(
        `[DuplicateDetection] New identity registered for ${input.platform}:${input.externalSenderId}` +
        ` (identity: ${data.identityId})`
      );
    }

    return { data, error: null };
  },
};
