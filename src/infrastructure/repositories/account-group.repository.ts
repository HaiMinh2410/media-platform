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

      const mappedGroups: AccountGroup[] = await Promise.all(groups.map(async (g) => {
        // Sum unread messages across all conversations in this group
        const unreadMessagesCount = await db.message.count({
          where: {
            is_read: false,
            conversation: {
              account_id: { in: g.members.map(m => m.account_id) }
            }
          }
        });

        return {
          id: g.id,
          workspaceId: g.workspace_id,
          name: g.name,
          description: g.description,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
          unreadCount: unreadMessagesCount,
          members: g.members.map((m) => ({
            id: m.account.id,
            workspaceId: m.account.workspaceId,
            platform: m.account.platform as any,
            externalId: m.account.platform_user_id,
            name: m.account.platform_user_name,
            metadata: m.account.metadata,
          })),
        };
      }));

      return { data: mappedGroups, error: null };
    } catch (error: any) {
      console.error('[AccountGroupRepository] findByWorkspaceId failed:', error);
      return { data: null, error: error.message || 'DATABASE_ERROR' };
    }
  }

  async create(workspaceId: string, name: string, accountIds: string[]): Promise<{ data: AccountGroup | null; error: string | null }> {
    try {
      const group = await db.accountGroup.create({
        data: {
          workspace_id: workspaceId,
          name,
          members: {
            create: accountIds.map(id => ({
              account_id: id
            }))
          }
        },
        include: {
          members: {
            include: {
              account: true,
            },
          },
        },
      });

      // Sum unread messages across all conversations in this group
      const unreadMessagesCount = await db.message.count({
        where: {
          is_read: false,
          conversation: {
            account_id: { in: group.members.map(m => m.account_id) }
          }
        }
      });

      const mappedGroup: AccountGroup = {
        id: group.id,
        workspaceId: group.workspace_id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        unreadCount: unreadMessagesCount,
        members: group.members.map((m) => ({
          id: m.account.id,
          workspaceId: m.account.workspaceId,
          platform: m.account.platform as any,
          externalId: m.account.platform_user_id,
          name: m.account.platform_user_name,
          metadata: m.account.metadata,
        })),
      };

      return { data: mappedGroup, error: null };
    } catch (error: any) {
      console.error('[AccountGroupRepository] create failed:', error);
      return { data: null, error: error.message || 'DATABASE_ERROR' };
    }
  }

  async delete(groupId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await db.accountGroup.delete({
        where: { id: groupId }
      });
      return { success: true, error: null };
    } catch (error: any) {
      console.error('[AccountGroupRepository] delete failed:', error);
      return { success: false, error: error.message || 'DATABASE_ERROR' };
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
