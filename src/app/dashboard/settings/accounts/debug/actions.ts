'use server';

import { db } from '@/lib/db';
import { getTokenEncryptionService } from '@/infrastructure/crypto/token-encryption.service';
import { revalidatePath } from 'next/cache';

export async function manualConnectAction(formData: FormData) {
  const platform = formData.get('platform') as string;
  const platformId = formData.get('platformId') as string;
  const platformName = formData.get('platformName') as string;
  const token = formData.get('token') as string;
  const workspaceId = formData.get('workspaceId') as string;

  if (!platform || !platformId || !token || !workspaceId) {
    return { error: 'Missing required fields' };
  }

  try {
    const encryptionService = getTokenEncryptionService();
    const { data: encryptedToken, error: encryptError } = await encryptionService.encrypt(token);

    if (encryptError || !encryptedToken) {
      return { error: 'Failed to encrypt token' };
    }

    // 1. Find or create the platform account
    let account = await db.platformAccount.findFirst({
      where: {
        platform,
        platform_user_id: platformId
      }
    });

    if (account) {
      account = await db.platformAccount.update({
        where: { id: account.id },
        data: {
          platform_user_name: platformName || `Manual ${platform}`,
          disconnected_at: null,
        }
      });
    } else {
      // Need a profile_id
      const workspace = await db.workspace.findUnique({ 
        where: { id: workspaceId }, 
        include: { workspace_members: true } 
      });
      const profileId = workspace?.workspace_members[0]?.profile_id;

      if (!profileId) {
        return { error: 'No profile found for workspace' };
      }

      account = await db.platformAccount.create({
        data: {
          platform,
          platform_user_id: platformId,
          platform_user_name: platformName || `Manual ${platform}`,
          workspaceId,
          profile_id: profileId,
        }
      });
    }

    // Upsert the token
    const existingToken = await db.meta_tokens.findFirst({
      where: { account_id: account.id }
    });

    if (existingToken) {
      await db.meta_tokens.update({
        where: { id: existingToken.id },
        data: {
          encrypted_access_token: encryptedToken,
          updated_at: new Date()
        }
      });
    } else {
      await db.meta_tokens.create({
        data: {
          account_id: account.id,
          encrypted_access_token: encryptedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      });
    }

    revalidatePath('/dashboard/settings/accounts');
    return { success: true };
  } catch (error) {
    console.error('Manual connect error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
