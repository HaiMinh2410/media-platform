// src/domain/types/customer-identity.ts

/**
 * A canonical customer identity that may span multiple platforms.
 * When the same person contacts via Facebook Messenger AND Instagram,
 * they share one CustomerIdentity that links both conversations.
 */
export type CustomerIdentity = {
  id: string;
  workspaceId: string;
  /** The "primary" external sender ID used as the canonical key */
  canonicalExternalId: string;
  customerName: string | null;
  customerAvatar: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * A single platform binding for a CustomerIdentity.
 * One identity may have many platform mappings (fb + ig).
 */
export type CustomerPlatformMapping = {
  id: string;
  identityId: string;
  platform: string;
  externalSenderId: string;
  conversationId: string;
};

/**
 * Input for checking/registering a sender in the identity system.
 */
export type DuplicateCheckInput = {
  workspaceId: string;
  platform: string;
  externalSenderId: string;
  conversationId: string;
  customerName?: string | null;
  customerAvatar?: string | null;
};

/**
 * Result of a duplicate detection check.
 */
export type DuplicateCheckResult = {
  data: {
    identityId: string;
    /** True if this sender was already linked to an existing identity from another platform */
    isCrossChannelMatch: boolean;
    /** The canonical conversation (oldest/primary for this identity) */
    canonicalConversationId: string;
    /** All conversation IDs linked to this identity (including the current one) */
    linkedConversationIds: string[];
  } | null;
  error: string | null;
};

/**
 * Summary of a linked identity for display/API purposes.
 */
export type LinkedIdentitySummary = {
  identityId: string;
  customerName: string | null;
  customerAvatar: string | null;
  platforms: Array<{
    platform: string;
    externalSenderId: string;
    conversationId: string;
  }>;
};
