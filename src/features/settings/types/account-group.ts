import { PlatformAccount } from './platform-account';

export type AccountGroup = {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  members: PlatformAccount[];
  unreadCount?: number;
};

export type AccountGroupMembership = {
  groupId: string;
  accountId: string;
  createdAt: Date;
};
