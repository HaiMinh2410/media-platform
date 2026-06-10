import { PlatformAccount } from '@features/settings';

export type PostStatus = 'scheduled' | 'processing' | 'published' | 'failed';

export type Post = {
  id: string;
  accountId: string;
  title: string | null;
  content: string | null;
  mediaUrls: string[];
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  platformPostId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PostWithAccount = Post & {
  account: PlatformAccount;
};

export type CreatePostInput = {
  accountIds: string[];
  title?: string;
  content: string;
  mediaUrls: string[];
  scheduledAt?: string; // ISO string for API boundary
  workspaceId: string;
};

export type CreatePostResult = {
  data: Post[] | null;
  error: string | null;
};

export type BatchPublishSummary = {
  id: string;
  batchId: string;
  content: string;
  mediaUrls: string[];
  createdAt: Date;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  status: "SUCCESS" | "PARTIAL" | "FAILED" | "SCHEDULED" | "PROCESSING";
  accounts: {
    id: string;
    name: string;
    platform: string;
    status: "SUCCESS" | "FAILED" | "SCHEDULED" | "PROCESSING";
    avatarUrl?: string;
    platformId?: string;
  }[];
};

