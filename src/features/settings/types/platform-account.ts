export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'meta' | 'twitter' | 'linkedin';

export type CreatePlatformAccountInput = {
  profileId: string;  // Supabase auth user id — maps to profile_id (NOT NULL in DB)
  workspaceId: string;
  platform: Platform;
  externalId: string;
  name: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  metadata?: any;
};

export type PlatformAccount = {
  id: string;
  workspaceId: string;
  platform: Platform;
  externalId: string;
  name: string;
  username?: string;
  avatar_url?: string;
  metadata?: any;
  needs_reauth?: boolean;
  token_expires_at?: Date | null;
};

export interface AccountHealthData {
  id: string;
  platform: string;
  platform_user_name: string;
  platform_user_id: string;
  status: 'connected' | 'error' | 'warning';
  responseRate: number;
  pendingCount: number;
  lastActiveAt: Date | null;
  tokenExpiresAt: Date | null;
  errorReason: string | null;
  isNew: boolean;
}
