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
  metadata?: any; // Will be cast to Prisma JSON
};

export type PlatformAccountResult = {
  id: string;
  workspaceId: string;
  platform: Platform;
  externalId: string;
  name: string;
  metadata?: any;
};
