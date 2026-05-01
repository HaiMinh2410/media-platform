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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: { position: 'asc' } as any,
      });

      const mappedGroups: AccountGroup[] = await Promise.all(groups.map(async (g) => {
        // Sum unread messages across all conversations in this group
        const unreadMessagesCount = await db.message.count({
          where: {
            is_read: false,
            conversation: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              account_id: { in: (g as any).members.map((m: any) => m.account_id) }
            }
          }
        });

        return {
          id: g.id,
          workspaceId: g.workspace_id,
          name: g.name,
          description: g.description,
          position: g.position,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
          unreadCount: unreadMessagesCount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          members: (g as any).members.map((m: any) => ({
            id: m.account.id,
            workspaceId: m.account.workspaceId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            platform: (m as any).account.platform as any,
            externalId: m.account.platform_user_id,
            name: m.account.platform_user_name,
            metadata: m.account.metadata,
          })),
        };
      }));

      return { data: mappedGroups, error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[AccountGroupRepository] findByWorkspaceId failed:', error);
      return { data: null, error: error.message || 'DATABASE_ERROR' };
    }
  }

  async create(workspaceId: string, name: string, accountIds: string[]): Promise<{ data: AccountGroup | null; error: string | null }> {
    try {
      // Get current max position
      const lastGroup = await db.accountGroup.findFirst({
        where: { workspace_id: workspaceId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: { position: 'desc' } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        select: { position: true } as any
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newPosition = ((lastGroup as any)?.position ?? -1) + 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const group = await (db.accountGroup as any).create({
        data: {
          workspace_id: workspaceId,
          name,
          position: newPosition,
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            account_id: { in: (group as any).members.map((m: any) => m.account_id) }
          }
        }
      });

      const mappedGroup: AccountGroup = {
        id: group.id,
        workspaceId: group.workspace_id,
        name: group.name,
        description: group.description,
        position: group.position,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        unreadCount: unreadMessagesCount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        members: (group as any).members.map((m: any) => ({
          id: m.account.id,
          workspaceId: m.account.workspaceId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          platform: (m as any).account.platform as any,
          externalId: m.account.platform_user_id,
          name: m.account.platform_user_name,
          metadata: m.account.metadata,
        })),
      };

      return { data: mappedGroup, error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[AccountGroupRepository] create failed:', error);
      return { data: null, error: error.message || 'DATABASE_ERROR' };
    }
  }

  async updatePositions(workspaceId: string, orderedIds: string[]): Promise<{ success: boolean; error: string | null }> {
    try {
      await db.$transaction(
        orderedIds.map((id, index) => 
          db.accountGroup.update({
            where: { id, workspace_id: workspaceId },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { position: index } as any
          })
        )
      );
      return { success: true, error: null };
    } catch (error: any) {
      console.error('[AccountGroupRepository] updatePositions failed:', error);
      return { success: false, error: error.message || 'DATABASE_ERROR' };
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
