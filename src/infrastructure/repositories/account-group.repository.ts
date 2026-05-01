import { db } from '../../lib/db';
import { AccountGroup } from '../../domain/types/account-group';

export class AccountGroupRepository {
  async findByWorkspaceId(workspaceId: string): Promise<{ data: AccountGroup[] | null; error: string | null }> {
    try {
      const groups = await db.accountGroup.findMany({
        where: { workspace_id: workspaceId },
        include: {
          members: {
            include: {
              account: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const mappedGroups: AccountGroup[] = groups.map((g) => ({
        id: g.id,
        workspaceId: g.workspace_id,
        name: g.name,
        description: g.description,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        members: g.members.map((m) => ({
          id: m.account.id,
          workspaceId: m.account.workspaceId,
          platform: m.account.platform as any,
          externalId: m.account.platform_user_id,
          name: m.account.platform_user_name,
          metadata: m.account.metadata,
        })),
      }));

      return { data: mappedGroups, error: null };
    } catch (error: any) {
      console.error('[AccountGroupRepository] findByWorkspaceId failed:', error);
      return { data: null, error: error.message || 'DATABASE_ERROR' };
    }
  }
}

let instance: AccountGroupRepository | null = null;

export function getAccountGroupRepository() {
  if (!instance) {
    instance = new AccountGroupRepository();
  }
  return instance;
}
