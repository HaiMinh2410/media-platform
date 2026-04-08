import { db } from '../../lib/db';
import { WorkspaceResult } from '../../domain/types/workspace';

export class WorkspaceRepository {
  /**
   * Finds all workspaces for a given user.
   */
  async findByUserId(userId: string): Promise<{ data: WorkspaceResult[] | null, error: string | null }> {
    try {
      const workspaces = await db.workspace.findMany({
        where: { userId },
      });
      return { data: workspaces, error: null };
    } catch (error) {
      console.error('[WorkspaceRepository] findByUserId failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Finds the first workspace for a user (MVP default).
   */
  async findFirstByUserId(userId: string): Promise<{ data: WorkspaceResult | null, error: string | null }> {
    try {
      const workspace = await db.workspace.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      return { data: workspace, error: null };
    } catch (error) {
      console.error('[WorkspaceRepository] findFirstByUserId failed:', error);
      return { data: null, error: 'DATABASE_ERROR' };
    }
  }
}

// Singleton helper
let instance: WorkspaceRepository | null = null;

export function getWorkspaceRepository() {
  if (!instance) {
    instance = new WorkspaceRepository();
  }
  return instance;
}
