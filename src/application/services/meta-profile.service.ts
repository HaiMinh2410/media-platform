import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { getMetaGraphClient } from '@/infrastructure/meta/graph-api.client';
import { db } from '@/lib/db';

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
    encryptedToken: string;
  }) {
    const { conversationId, platform, externalSenderId, encryptedToken } = params;

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
      
      // Fields differ slightly between Messenger and Instagram
      // Messenger: first_name, last_name, profile_pic
      // Instagram: name, profile_pic
      const fields = platform === 'instagram' ? 'name,profile_pic' : 'name,first_name,last_name,profile_pic';
      
      const { data: profile, error: apiError } = await graphClient.request<any>(
        externalSenderId,
        plainToken,
        { fields }
      );

      if (apiError || !profile) {
        console.warn(`[MetaProfileService] Fetch failed for ${externalSenderId}:`, apiError);
        return;
      }

      // 3. Normalize Name and Avatar
      const name = profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || `User ${externalSenderId.slice(-4)}`;
      const avatar = profile.profile_pic || profile.picture?.data?.url || null;

      // 4. Update Conversation
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          customer_name: name,
          customer_avatar: avatar
        }
      });

      console.log(`[MetaProfileService] Successfully synced profile for ${name} (${externalSenderId})`);
    } catch (err) {
      console.error(`[MetaProfileService] Unexpected error syncing profile:`, err);
    }
  }
};
