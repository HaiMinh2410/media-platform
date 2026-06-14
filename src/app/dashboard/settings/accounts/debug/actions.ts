'use server';

import { db } from "@shared/lib/db";

import { getTokenEncryptionService } from '@features/settings/services/token-encryption.service';
import { revalidatePath } from 'next/cache';
import { getMetaGraphClient } from '@shared/api/meta/graph-api.client';

export async function verifyTokenAction(token: string) {
  if (!token) {
    return { error: 'Token is required' };
  }

  try {
    const graphClient = getMetaGraphClient();
    const debugRes = await graphClient.debugToken(token);

    if (debugRes.error) {
      return { error: debugRes.error, details: debugRes.details };
    }

    const debugData = debugRes.data?.data;
    if (!debugData) {
      return { error: 'Failed to retrieve token details' };
    }

    let accountName = 'Unknown';
    if (debugData.is_valid) {
      try {
        const meRes = await graphClient.getMe(token);
        if (meRes.data && meRes.data.name) {
          accountName = meRes.data.name;
        } else {
          const pagesRes = await graphClient.getPages(token);
          if (pagesRes.data && pagesRes.data.data && pagesRes.data.data.length > 0) {
            accountName = pagesRes.data.data[0].name;
          }
        }
      } catch (e) {
        console.warn('[verifyTokenAction] Failed to fetch account name context:', e);
      }
    }

    return {
      success: true,
      data: {
        isValid: debugData.is_valid,
        expiresAt: debugData.expires_at > 0 ? new Date(debugData.expires_at * 1000).toISOString() : 'Never (Page Token)',
        scopes: debugData.scopes || [],
        application: debugData.application || 'Unknown App',
        userId: debugData.user_id,
        accountName,
      }
    };
  } catch (error) {
    console.error('[verifyTokenAction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown connection error' };
  }
}

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
