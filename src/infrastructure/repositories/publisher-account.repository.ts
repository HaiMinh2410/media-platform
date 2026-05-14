import { db } from '../../lib/db';

export type PublisherAccountInput = {
  profile_id: string;
  platform: string;
  platform_id: string;
  name: string;
  avatar_url?: string;
  is_active?: boolean;
};

export class PublisherAccountRepository {
  /**
   * Tạo hoặc cập nhật thông tin tài khoản publisher.
   */
  async upsert(input: PublisherAccountInput) {
    try {
      const account = await db.account.upsert({
        where: {
          profile_id_platform_platform_id: {
            profile_id: input.profile_id,
            platform: input.platform,
            platform_id: input.platform_id,
          },
        },
        update: {
          name: input.name,
          avatar_url: input.avatar_url,
          is_active: input.is_active ?? true,
          updated_at: new Date(),
        },
        create: {
          profile_id: input.profile_id,
          platform: input.platform,
          platform_id: input.platform_id,
          name: input.name,
          avatar_url: input.avatar_url,
          is_active: input.is_active ?? true,
        },
      });
      return { data: account, error: null };
    } catch (error: any) {
      console.error('[PublisherAccountRepository] upsert failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Lấy danh sách tài khoản theo profile_id (user_id).
   */
  async findByProfileId(profileId: string) {
    try {
      const accounts = await db.account.findMany({
        where: { profile_id: profileId },
        include: { token: true },
        orderBy: { created_at: 'desc' }
      });
      return { data: accounts, error: null };
    } catch (error: any) {
      console.error('[PublisherAccountRepository] findByProfileId failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Tìm tài khoản theo ID.
   */
  async findById(id: string) {
    try {
      const account = await db.account.findUnique({
        where: { id },
        include: { token: true }
      });
      if (!account) return { data: null, error: 'ACCOUNT_NOT_FOUND' };
      return { data: account, error: null };
    } catch (error: any) {
      console.error('[PublisherAccountRepository] findById failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }
}

// Singleton helper
let instance: PublisherAccountRepository | null = null;

export function getPublisherAccountRepository() {
  if (!instance) {
    instance = new PublisherAccountRepository();
  }
  return instance;
}
