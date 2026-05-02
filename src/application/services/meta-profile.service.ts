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
    const { conversationId, externalSenderId, externalPageId } = params;
    const platform = params.platform === 'messenger' ? 'facebook' : params.platform;
    let encryptedToken = params.encryptedToken;

    try {
      // 1. Resolve Token if missing or for better permissions
      if (!encryptedToken) {
        let tokenRecord = null;

        if (platform === 'instagram') {
          // For Instagram: Always prefer the linked Facebook Page token if available
          // as it typically carries the 'instagram_manage_messages' permission.
          const linkedFbAccount = await db.platformAccount.findFirst({
            where: {
              platform: 'facebook',
              metadata: { path: ['instagram_id'], equals: externalPageId }
            },
            include: { meta_tokens: { orderBy: { updated_at: 'desc' }, take: 1 } }
          });
          tokenRecord = linkedFbAccount?.meta_tokens[0] || null;

          // Fallback to Instagram's own token if no linked FB page found
          if (!tokenRecord) {
            tokenRecord = await db.meta_tokens.findFirst({
              where: { platform_accounts: { platform: 'instagram', platform_user_id: externalPageId } },
              orderBy: { updated_at: 'desc' }
            });
          }
        } else {
          // For Facebook/Messenger: Get the page access token
          tokenRecord = await db.meta_tokens.findFirst({
            where: { platform_accounts: { platform: 'facebook', platform_user_id: externalPageId } },
            orderBy: { updated_at: 'desc' }
          });
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
      
      // Prevent syncing if the sender is the page itself (rare but possible in some webhook configurations)
      if (externalSenderId === externalPageId) {
        console.log(`[MetaProfileService] Sender is the page itself (${externalPageId}). Skipping profile sync.`);
        return;
      }

      // Fields for profile fetch:
      // Facebook (PSID): first_name, last_name, profile_pic (sometimes), picture
      // Instagram (IGSID): name, profile_pic, username
      // Note: 'name' is often restricted for Facebook PSIDs, prefer first/last name.
      const fields = platform === 'instagram' 
        ? 'name,username,profile_pic' 
        : 'first_name,last_name,link,picture.type(large)';
      
      let result = await graphClient.request<any>(externalSenderId, plainToken, { fields });
      
      // Fallback: If it fails with certain fields, try a safer subset.
      if (result.error) {
        console.warn(`[MetaProfileService] Primary profile fetch failed for ${externalSenderId} on ${platform}:`, result.error);
        
        // Retry with minimal fields (just name or first/last name)
        const fallbackFields = platform === 'instagram' ? 'name,username' : 'first_name,last_name';
        result = await graphClient.request<any>(externalSenderId, plainToken, { fields: fallbackFields });
      }

      const profile = result.data || {};
      const error = result.error;

      // 4. Normalize Name and Avatar
      // Priority for Name:
      // 1. Combined first/last name (especially for Facebook)
      // 2. Full name from API (if provided)
      // 3. Username (Instagram specific)
      // 4. Fallback "User XXXX"
      const combinedName = (profile.first_name || profile.last_name) 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : null;
      
      const name = combinedName || 
                   profile.name || 
                   profile.username ||
                   `User ${externalSenderId.slice(-4)}`;
      
      // Avatar resolution order: 
      const avatar = profile.picture?.data?.url || 
                     profile.profile_pic || 
                     null;

      // 5. Update Conversation
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          customer_name: name,
          customer_avatar: avatar,
          customer_username: profile.username || null,
          customer_link: profile.link || null
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
