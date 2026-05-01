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
    encryptedToken: string;
  }) {
    const { conversationId, platform, externalSenderId, externalPageId, encryptedToken } = params;

    try {
      // 1. Decrypt token
      const encryptionService = getTokenEncryptionService();
      const { data: plainToken, error: decryptError } = await encryptionService.decrypt(encryptedToken);

      if (decryptError || !plainToken) {
        console.error(`[MetaProfileService] Decrypt failed for ${conversationId}:`, decryptError);
        return;
      }

      // 2. Fetch profile from Meta
      const graphClient = getMetaGraphClient();
      
      // Fields for profile fetch:
      // Facebook: name, first_name, last_name, profile_pic, picture
      // Instagram: name, profile_pic
      const fields = platform === 'instagram' 
        ? 'name,profile_pic' 
        : 'name,first_name,last_name,profile_pic,picture.type(large)';
      
      let result = await graphClient.request<any>(externalSenderId, plainToken, { fields });
      
      // Heuristic: If it fails with certain fields, try a safer subset
      if (result.error && (result.error.includes('profile_pic') || result.error.includes('picture'))) {
        console.warn(`[MetaProfileService] Avatar fetch failed for ${externalSenderId}, retrying without avatar fields...`);
        const fallbackFields = platform === 'instagram' ? 'name' : 'name,first_name,last_name';
        result = await graphClient.request<any>(externalSenderId, plainToken, { fields: fallbackFields });
      }

      if (result.error || !result.data) {
        console.warn(`[MetaProfileService] Fetch failed for ${externalSenderId}:`, result.error);
        return;
      }

      const profile = result.data || {};

      // 3. Normalize Name and Avatar
      // Fallback: If Meta fetch fails (e.g. no permission), use "User XXXX" to avoid showing raw IDs in UI
      const name = profile.name || 
                   (profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null) || 
                   `User ${externalSenderId.slice(-4)}`;
      
      // Avatar resolution order: 
      // 1. profile_pic (Direct URL - works for both FB/IG messaging profiles)
      // 2. picture.data.url (FB specific legacy/broad format)
      const avatar = profile.profile_pic || 
                     profile.picture?.data?.url || 
                     null;

      // 4. Update Conversation
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          customer_name: name,
          customer_avatar: avatar
        }
      });

      if (result.error || !result.data) {
        console.warn(`[MetaProfileService] Fetch failed for ${externalSenderId}, using fallback name "${name}". Error:`, result.error);
        // We continue to duplicate detection even with fallback name
      } else {
        console.log(`[MetaProfileService] Successfully synced profile for ${name} (${externalSenderId})`);
      }

      // 5. Trigger Duplicate Detection now that we have a name!
      // This is the most reliable time to link cross-channel identities.
      const account = await db.platformAccount.findFirst({
        where: { platform, platform_user_id: externalPageId }
      });
      // Actually, we can get workspaceId from the conversation's account
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { platform_accounts: true }
      });

      if (conversation) {
        duplicateDetectionService.detect({
          workspaceId: conversation.platform_accounts.workspaceId,
          platform,
          externalSenderId,
          conversationId,
          customerName: name,
          customerAvatar: avatar,
        }).catch(err => console.error(`[MetaProfileService] Duplicate detection failed:`, err));
      }
    } catch (err) {
      console.error(`[MetaProfileService] Unexpected error syncing profile:`, err);
    }
  }
};
