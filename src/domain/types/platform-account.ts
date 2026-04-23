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
  metadata?: any;
};
