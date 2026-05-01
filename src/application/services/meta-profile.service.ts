import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';
import { db } from '@/lib/db';
import { duplicateDetectionService } from './duplicate-detection.service';

/**
 * Service to sync customer profile information (Name, Avatar) from Meta platforms.
 */
export const metaProfileService = {
  /**
   * Fetches profile from Meta Graph API and updates the Conversation record.
   */
  async syncCustomerProfile(params: {
    conversationId: string;
    platform: string;
    externalSenderId: string;
    externalPageId: string;
    encryptedToken?: string; // Optional: will try to resolve from DB if missing
  }) {
    const { conversationId, platform, externalSenderId, externalPageId } = params;
    let encryptedToken = params.encryptedToken;

    try {
      // 1. Resolve Token if missing (common for Instagram accounts linked to FB)
      if (!encryptedToken) {
        let tokenRecord = await db.meta_tokens.findFirst({
          where: { platform_accounts: { platform, platform_user_id: externalPageId } },
          orderBy: { updated_at: 'desc' }
        });

        // Fallback for Instagram: Try to find token from the linked Facebook Page
        if (!tokenRecord && platform === 'instagram') {
          const linkedFbAccount = await db.platformAccount.findFirst({
            where: {
              platform: 'facebook',
              metadata: { path: ['instagram_id'], equals: externalPageId }
            },
            include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
          });
          tokenRecord = linkedFbAccount?.meta_tokens[0] || null;
        }

        if (!tokenRecord) {
          console.warn(`[MetaProfileService] No token found for ${platform} account ${externalPageId}. Cannot sync profile.`);
          return;
        }
        encryptedToken = tokenRecord.encrypted_access_token;
      }

      // 2. Decrypt token
      const encryptionService = getTokenEncryptionService();
      const { data: plainToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

      if (decryptError || !plainToken) {
        console.error(`[MetaProfileService] Decrypt failed for ${conversationId}:`, decryptError);
        return;
      }

      // 3. Fetch profile from Meta
      const graphClient = getMetaGraphClient();
      
      // Fields for profile fetch:
      // Facebook (PSID): first_name, last_name, name, profile_pic
      // Instagram (IGSID): name, profile_pic, username
      const fields = platform === 'instagram' 
        ? 'name,username,profile_pic' 
        : 'name,first_name,last_name,profile_pic,picture.type(large)';
      
      let result = await graphClient.request<any>(externalSenderId, plainToken, { fields });
      
      // Fallback: If it fails with certain fields (e.g. profile_pic requires extra permissions sometimes), 
      // try a safer subset to at least get the name.
      if (result.error && (result.error.toLowerCase().includes('profile_pic') || result.error.toLowerCase().includes('picture'))) {
        console.warn(`[MetaProfileService] Avatar fetch failed for ${externalSenderId}, retrying without avatar fields...`);
        const fallbackFields = platform === 'instagram' ? 'name,username' : 'name,first_name,last_name';
        result = await graphClient.request<any>(externalSenderId, plainToken, { fields: fallbackFields });
      }

      const profile = result.data || {};
      const error = result.error;

      // 4. Normalize Name and Avatar
      // Priority: 
      // 1. Full name from API
      // 2. Combined first/last name
      // 3. Username (Instagram specific)
      // 4. Fallback "User XXXX"
      const name = profile.name || 
                   (profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null) || 
                   profile.username ||
                   `User ${externalSenderId.slice(-4)}`;
      
      // Avatar resolution order: 
      const avatar = profile.profile_pic || 
                     profile.picture?.data?.url || 
                     null;

      // 5. Update Conversation
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          customer_name: name,
          customer_avatar: avatar
        }
      });

      if (error) {
        console.warn(`[MetaProfileService] Fetch had issues for ${externalSenderId}, used fallback name "${name}". Error:`, error);
      } else {
        console.log(`[MetaProfileService] Successfully synced profile for ${name} (${externalSenderId}) on ${platform}`);
      }

      // 6. Trigger Duplicate Detection & Identity Registration
      // This is crucial for linking the same person across platforms
      const convoWithAccount = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { platform_accounts: true }
      });

      if (convoWithAccount) {
        duplicateDetectionService.detect({
          workspaceId: convoWithAccount.platform_accounts.workspaceId,
          platform,
          externalSenderId,
          conversationId,
          customerName: name,
          customerAvatar: avatar,
        }).catch(err => console.error(`[MetaProfileService] Duplicate detection failed:`, err));
      }
    } catch (err) {
      console.error(`[MetaProfileService] Unexpected error syncing profile for ${conversationId}:`, err);
    }
  },
};
