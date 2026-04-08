import { Platform } from '@prisma/client';
export { Platform };

export type CreatePlatformAccountInput = {
  workspaceId: string;
  platform: Platform;
  externalId: string;
  name: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
};

export type PlatformAccountResult = {
  id: string;
  workspaceId: string;
  platform: Platform;
  externalId: string;
  name: string;
};
